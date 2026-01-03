"use client";

import { useState, useCallback } from "react";
import {
  parseDocument,
  generateDocument,
  type Modification,
  type SelectionPosition,
  type DocumentContent,
  type DocumentMetadata,
} from "@/lib/api-client";
import type { DocumentState } from "@/lib/document-types";

/**
 * Hook per la gestione del documento
 *
 * Responsabilità:
 * - Upload e parsing del DOCX via backend FastAPI
 * - Mantenimento dello stato del documento
 * - Gestione delle modifiche (con tracking)
 * - Download del DOCX modificato via backend FastAPI
 */
export function useDocument() {
  const [documentState, setDocumentState] = useState<DocumentState | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carica e parsa un documento DOCX
   */
  const uploadDocument = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      // Chiama il backend FastAPI per il parsing
      const response = await parseDocument(file);

      if (!response.success) {
        throw new Error(
          "Il backend ha restituito un errore durante il parsing"
        );
      }

      // Crea lo stato del documento
      const newState: DocumentState = {
        originalFile: file,
        content: response.content,
        metadata: response.metadata,
        modifications: [],
      };

      setDocumentState(newState);
    } catch (err) {
      console.error("[useDocument] Errore upload:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Errore durante il caricamento del documento"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sostituisce il testo in una posizione specifica
   * Aggiorna immediatamente la preview (stato locale)
   */
  const replaceText = useCallback(
    (position: SelectionPosition, originalText: string, newText: string) => {
      if (!documentState) return;

      setDocumentState((prevState) => {
        if (!prevState) return prevState;

        // Clona lo stato
        const newState: DocumentState = {
          ...prevState,
          content: JSON.parse(
            JSON.stringify(prevState.content)
          ) as DocumentContent,
          modifications: [...prevState.modifications],
        };

        // Trova e modifica l'elemento
        const element = findElement(newState.content, position);
        if (!element) {
          console.error("[useDocument] Elemento non trovato:", position);
          return prevState;
        }

        // Modifica il testo nel run
        if (
          position.type === "paragraph" &&
          position.paragraph_index !== undefined
        ) {
          const paragraph = newState.content.elements[position.paragraph_index];
          if (paragraph && paragraph.type === "paragraph") {
            const run = paragraph.runs[position.run_index];
            if (run) {
              // Gestisci selezione singola o cross-run
              if (
                position.end_run_index !== undefined &&
                position.end_run_index !== position.run_index
              ) {
                // Cross-run: modifica il primo run, svuota gli altri
                applyModificationCrossRun(paragraph.runs, position, newText);
              } else {
                // Singolo run
                const before = run.text.substring(0, position.char_start);
                const after = run.text.substring(position.char_end);
                run.text = before + newText + after;
              }
            }
          }
        } else if (
          position.type === "table" &&
          position.table_index !== undefined
        ) {
          // Trova la tabella e applica la modifica
          const table = newState.content.elements[position.table_index];
          if (table && table.type === "table") {
            const row = table.rows[position.row_index!];
            const cell = row?.cells[position.cell_index!];
            const paragraph = cell?.paragraphs[position.cell_paragraph_index!];
            if (paragraph) {
              const run = paragraph.runs[position.run_index];
              if (run) {
                const before = run.text.substring(0, position.char_start);
                const after = run.text.substring(position.char_end);
                run.text = before + newText + after;
              }
            }
          }
        }

        // Registra la modifica per il backend
        const modification: Modification = {
          position,
          original_text: originalText,
          new_text: newText,
        };
        newState.modifications.push(modification);

        return newState;
      });
    },
    [documentState]
  );

  /**
   * Annulla l'ultima modifica
   */
  const undo = useCallback(() => {
    if (!documentState || documentState.modifications.length === 0) return;

    setDocumentState((prevState) => {
      if (!prevState || prevState.modifications.length === 0) return prevState;

      // Per semplicità, ri-parsiamo il documento originale e riapplichiamo tutte le modifiche tranne l'ultima
      // In produzione si potrebbe ottimizzare con un sistema di snapshot

      // Clona lo stato
      const newState: DocumentState = {
        ...prevState,
        modifications: prevState.modifications.slice(0, -1),
      };

      // Nota: per un undo corretto dovremmo ri-parsare e riapplicare
      // Per ora rimuoviamo solo la modifica dalla lista
      // TODO: implementare undo completo

      return newState;
    });
  }, [documentState]);

  /**
   * Scarica il documento DOCX con tutte le modifiche applicate
   */
  const downloadDocument = useCallback(async () => {
    if (!documentState) return;

    setIsLoading(true);
    setError(null);

    try {
      // Chiama il backend FastAPI per generare il DOCX
      const blob = await generateDocument(
        documentState.originalFile,
        documentState.modifications
      );

      // Crea il download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = getModifiedFileName(documentState.metadata.file_name);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("[useDocument] Errore download:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Errore durante il download del documento"
      );
    } finally {
      setIsLoading(false);
    }
  }, [documentState]);

  /**
   * Resetta lo stato (per caricare un nuovo documento)
   */
  const resetDocument = useCallback(() => {
    setDocumentState(null);
    setError(null);
  }, []);

  return {
    // Stato
    document: documentState,
    content: documentState?.content ?? null,
    metadata: documentState?.metadata ?? null,
    modifications: documentState?.modifications ?? [],
    isLoading,
    error,

    // Azioni
    uploadDocument,
    replaceText,
    undo,
    downloadDocument,
    resetDocument,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Trova un elemento nel contenuto del documento
 */
function findElement(content: DocumentContent, position: SelectionPosition) {
  if (position.type === "paragraph" && position.paragraph_index !== undefined) {
    return content.elements[position.paragraph_index];
  }

  if (position.type === "table" && position.table_index !== undefined) {
    return content.elements[position.table_index];
  }

  return null;
}

/**
 * Applica una modifica cross-run
 * Modifica il primo run con il nuovo testo, svuota gli altri
 */
function applyModificationCrossRun(
  runs: { index: number; text: string; style: unknown }[],
  position: SelectionPosition,
  newText: string
) {
  const startRunIndex = position.run_index;
  const endRunIndex = position.end_run_index!;
  const charStartInFirst =
    position.char_start_in_first_run ?? position.char_start;
  const charEndInLast = position.char_end_in_last_run ?? position.char_end;

  // Primo run: testo prima + nuovo testo
  const firstRun = runs[startRunIndex];
  const before = firstRun.text.substring(0, charStartInFirst);

  // Ultimo run: testo dopo
  const lastRun = runs[endRunIndex];
  const after = lastRun.text.substring(charEndInLast);

  // Modifica il primo run
  firstRun.text = before + newText + after;

  // Svuota i run intermedi e l'ultimo
  for (let i = startRunIndex + 1; i <= endRunIndex; i++) {
    runs[i].text = "";
  }
}

/**
 * Genera il nome del file modificato
 */
function getModifiedFileName(originalName: string): string {
  const lastDot = originalName.lastIndexOf(".");
  if (lastDot === -1) {
    return `${originalName}_modificato`;
  }

  const baseName = originalName.substring(0, lastDot);
  const extension = originalName.substring(lastDot);
  return `${baseName}_modificato${extension}`;
}
