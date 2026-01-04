"use client";

import { useState, useCallback, useRef } from "react";
import type { JSONContent } from "@tiptap/react";
import {
  parseDocument,
  generateDocument,
  type DocumentContent,
  type Modification,
} from "@/lib/api-client";
import type { DocumentState } from "@/lib/document-types";
import { convertToTipTap } from "@/lib/content-converter";

/**
 * Rappresenta una sostituzione esplicita fatta dall'utente
 */
export interface ExplicitReplacement {
  id: string;
  originalText: string;
  newText: string;
  timestamp: number;
}

/**
 * Hook per la gestione del documento con TipTap
 *
 * IMPORTANTE: Le sostituzioni vengono tracciate esplicitamente quando
 * l'utente seleziona testo e lo sostituisce con un valore dal vault.
 * Questo approccio è molto più affidabile rispetto al confronto
 * tra contenuto TipTap e originale.
 */
export function useDocument() {
  const [documentState, setDocumentState] = useState<DocumentState | null>(
    null
  );
  const [tiptapContent, setTiptapContent] = useState<JSONContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Traccia le sostituzioni esplicite fatte dall'utente
  const [replacements, setReplacements] = useState<ExplicitReplacement[]>([]);

  // Contenuto originale
  const originalContent = useRef<DocumentContent | null>(null);

  /**
   * Carica e parsa un documento DOCX
   */
  const uploadDocument = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setReplacements([]); // Reset sostituzioni

    try {
      console.log("[useDocument] Inizio upload file:", file.name);
      const response = await parseDocument(file);

      if (!response.success) {
        throw new Error("Errore durante il parsing del documento");
      }

      // Salva l'originale
      originalContent.current = JSON.parse(JSON.stringify(response.content));

      // Converti in formato TipTap
      const tiptap = convertToTipTap(response.content);
      setTiptapContent(tiptap);

      // Imposta lo stato del documento
      setDocumentState({
        originalFile: file,
        content: response.content,
        metadata: response.metadata,
        modifications: [],
      });

      console.log("[useDocument] Upload completato con successo");
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
   * Registra una sostituzione esplicita
   *
   * Questa funzione viene chiamata quando l'utente seleziona testo
   * e lo sostituisce con un valore dal vault o testo libero.
   */
  const registerReplacement = useCallback(
    (originalText: string, newText: string) => {
      if (!originalText || originalText === newText) return;

      const replacement: ExplicitReplacement = {
        id: crypto.randomUUID(),
        originalText: originalText.trim(),
        newText: newText,
        timestamp: Date.now(),
      };

      console.log("[useDocument] Registrata sostituzione:", replacement);

      setReplacements((prev) => {
        // Rimuovi eventuali sostituzioni precedenti con lo stesso testo originale
        const filtered = prev.filter(
          (r) => r.originalText !== replacement.originalText
        );
        return [...filtered, replacement];
      });

      // Aggiorna anche le modifications nel documentState per il contatore UI
      setDocumentState((prev) => {
        if (!prev) return prev;

        const modification: Modification = {
          position: {
            type: "paragraph",
            paragraph_index: 0,
            run_index: 0,
            char_start: 0,
            char_end: originalText.length,
          },
          original_text: originalText.trim(),
          new_text: newText,
        };

        // Rimuovi modifiche precedenti con lo stesso testo originale
        const existingMods = prev.modifications.filter(
          (m) => m.original_text !== originalText.trim()
        );

        return {
          ...prev,
          modifications: [...existingMods, modification],
        };
      });
    },
    []
  );

  /**
   * Aggiorna il contenuto TipTap (per sincronizzazione UI)
   * NON genera più modifications - queste vengono tracciate esplicitamente
   */
  const handleTiptapChange = useCallback((newTiptapContent: JSONContent) => {
    setTiptapContent(newTiptapContent);
    // Non facciamo più il confronto qui - le modifiche sono tracciate esplicitamente
  }, []);

  /**
   * Scarica il documento DOCX con le modifiche applicate
   */
  const downloadDocument = useCallback(async () => {
    if (!documentState) return;

    setIsLoading(true);
    setError(null);

    try {
      // Converti le sostituzioni esplicite in Modifications per il backend
      const modifications: Modification[] = replacements.map((r) => ({
        position: {
          type: "paragraph" as const,
          paragraph_index: 0, // Non usato - il backend cerca per testo
          run_index: 0,
          char_start: 0,
          char_end: r.originalText.length,
        },
        original_text: r.originalText,
        new_text: r.newText,
      }));

      console.log("[useDocument] Invio modifiche al backend:", modifications);

      const blob = await generateDocument(
        documentState.originalFile,
        modifications
      );

      // Trigger download
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
  }, [documentState, replacements]);

  /**
   * Annulla una sostituzione specifica
   */
  const undoReplacement = useCallback(
    (id: string) => {
      setReplacements((prev) => prev.filter((r) => r.id !== id));

      setDocumentState((prev) => {
        if (!prev) return prev;
        const replacement = replacements.find((r) => r.id === id);
        if (!replacement) return prev;

        return {
          ...prev,
          modifications: prev.modifications.filter(
            (m) => m.original_text !== replacement.originalText
          ),
        };
      });
    },
    [replacements]
  );

  /**
   * Resetta lo stato
   */
  const resetDocument = useCallback(() => {
    setDocumentState(null);
    setTiptapContent(null);
    setReplacements([]);
    originalContent.current = null;
    setError(null);
  }, []);

  return {
    // Stato
    document: documentState,
    content: documentState?.content ?? null,
    metadata: documentState?.metadata ?? null,
    modifications: documentState?.modifications ?? [],
    replacements,
    tiptapContent,
    isLoading,
    error,

    // Azioni
    uploadDocument,
    handleTiptapChange,
    registerReplacement,
    undoReplacement,
    downloadDocument,
    resetDocument,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function getModifiedFileName(originalName: string): string {
  const lastDot = originalName.lastIndexOf(".");
  if (lastDot === -1) {
    return `${originalName}_modificato`;
  }
  const baseName = originalName.substring(0, lastDot);
  const extension = originalName.substring(lastDot);
  return `${baseName}_modificato${extension}`;
}
