"use client";

import { useState, useCallback, useRef } from "react";
import type { JSONContent } from "@tiptap/react";
import {
  parseDocument,
  type DocumentContent,
  type Modification,
} from "@/lib/api-client";
import type { DocumentState } from "@/lib/document-types";
import { convertToTipTap } from "@/lib/content-converter";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Modifica checkbox (per indice)
 */
export interface CheckboxModification {
  checkboxIndex: number;
  newChecked: boolean;
}

/**
 * Sostituzione testo
 */
export interface TextReplacement {
  id: string;
  originalText: string;
  newText: string;
  timestamp: number;
}

/**
 * Formato download supportato
 */
export type DownloadFormat = "docx" | "pdf";

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook per la gestione del documento con TipTap
 *
 * VERSIONE 5:
 * - Testo: tracking esplicito delle sostituzioni
 * - Checkbox: identificate per INDICE (0, 1, 2, ...), non per matching testuale
 * - Download: supporto DOCX e PDF con nome file personalizzato
 */
export function useDocument() {
  const [documentState, setDocumentState] = useState<DocumentState | null>(
    null
  );
  const [tiptapContent, setTiptapContent] = useState<JSONContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sostituzioni testo
  const [textReplacements, setTextReplacements] = useState<TextReplacement[]>(
    []
  );

  // Modifiche checkbox (per indice!)
  const [checkboxModifications, setCheckboxModifications] = useState<
    Map<number, boolean>
  >(new Map());

  const originalContent = useRef<DocumentContent | null>(null);

  /**
   * Carica e parsa un documento DOCX
   */
  const uploadDocument = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setTextReplacements([]);
    setCheckboxModifications(new Map());

    try {
      console.log("[useDocument] Inizio upload file:", file.name);
      const response = await parseDocument(file);

      if (!response.success) {
        throw new Error("Errore durante il parsing del documento");
      }

      originalContent.current = JSON.parse(JSON.stringify(response.content));
      const tiptap = convertToTipTap(response.content);
      setTiptapContent(tiptap);

      setDocumentState({
        originalFile: file,
        content: response.content,
        metadata: response.metadata,
        modifications: [],
      });

      console.log("[useDocument] Upload completato");
    } catch (err) {
      console.error("[useDocument] Errore upload:", err);
      setError(
        err instanceof Error ? err.message : "Errore durante il caricamento"
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Registra una sostituzione TESTO
   */
  const registerTextReplacement = useCallback(
    (originalText: string, newText: string) => {
      if (!originalText || originalText === newText) return;

      const replacement: TextReplacement = {
        id: crypto.randomUUID(),
        originalText: originalText.trim(),
        newText: newText,
        timestamp: Date.now(),
      };

      console.log(
        "[useDocument] Sostituzione testo:",
        replacement.originalText.slice(0, 30)
      );

      setTextReplacements((prev) => {
        const filtered = prev.filter(
          (r) => r.originalText !== replacement.originalText
        );
        return [...filtered, replacement];
      });
    },
    []
  );

  /**
   * Registra modifica CHECKBOX (per indice)
   */
  const registerCheckboxModification = useCallback(
    (checkboxIndex: number, newChecked: boolean) => {
      console.log(
        `[useDocument] Checkbox #${checkboxIndex} → ${newChecked ? "☑" : "☐"}`
      );

      setCheckboxModifications((prev) => {
        const next = new Map(prev);
        next.set(checkboxIndex, newChecked);
        return next;
      });
    },
    []
  );

  /**
   * Aggiorna contenuto TipTap
   */
  const handleTiptapChange = useCallback((newTiptapContent: JSONContent) => {
    setTiptapContent(newTiptapContent);
  }, []);

  /**
   * Scarica il documento con modifiche
   *
   * @param fileName - Nome del file (senza estensione)
   * @param format - Formato: "docx" o "pdf"
   */
  const downloadDocument = useCallback(
    async (fileName: string, format: DownloadFormat = "docx") => {
      if (!documentState) return;

      setIsLoading(true);
      setError(null);

      try {
        // Prepara modifiche testo
        const textMods: Modification[] = textReplacements.map((r) => ({
          position: {
            type: "paragraph" as const,
            paragraph_index: 0,
            run_index: 0,
            char_start: 0,
            char_end: r.originalText.length,
          },
          original_text: r.originalText,
          new_text: r.newText,
        }));

        // Prepara modifiche checkbox (per indice!)
        const checkboxMods: CheckboxModification[] = [];
        checkboxModifications.forEach((newChecked, checkboxIndex) => {
          checkboxMods.push({ checkboxIndex, newChecked });
        });

        console.log("[useDocument] Invio:", {
          textMods: textMods.length,
          checkboxMods: checkboxMods.length,
          format,
          fileName,
        });

        const blob = await generateDocumentWithFormat(
          documentState.originalFile,
          textMods,
          checkboxMods,
          format
        );

        // Trigger download con nome personalizzato
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        console.log(`[useDocument] Download completato: ${fileName}.${format}`);
      } catch (err) {
        console.error("[useDocument] Errore download:", err);
        setError(err instanceof Error ? err.message : "Errore download");
        throw err; // Re-throw per il dialog
      } finally {
        setIsLoading(false);
      }
    },
    [documentState, textReplacements, checkboxModifications]
  );

  /**
   * Reset
   */
  const resetDocument = useCallback(() => {
    setDocumentState(null);
    setTiptapContent(null);
    setTextReplacements([]);
    setCheckboxModifications(new Map());
    originalContent.current = null;
    setError(null);
  }, []);

  // Calcola numero modifiche per UI
  const totalModifications =
    textReplacements.length + checkboxModifications.size;

  return {
    document: documentState,
    content: documentState?.content ?? null,
    metadata: documentState?.metadata ?? null,
    modifications: documentState?.modifications ?? [],
    tiptapContent,
    isLoading,
    error,
    totalModifications,

    uploadDocument,
    handleTiptapChange,
    registerTextReplacement,
    registerCheckboxModification,
    downloadDocument,
    resetDocument,
  };
}

// ============================================================================
// API HELPER
// ============================================================================

/**
 * Genera documento con supporto per formato DOCX o PDF
 */
async function generateDocumentWithFormat(
  file: File,
  textModifications: Modification[],
  checkboxModifications: CheckboxModification[],
  format: DownloadFormat = "docx"
): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("modifications", JSON.stringify(textModifications));
  formData.append(
    "checkbox_modifications",
    JSON.stringify(checkboxModifications)
  );
  formData.append("output_format", format);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const response = await fetch(`${API_BASE}/api/documents/generate`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Errore generazione: ${response.statusText}`;

    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.detail) {
        errorMessage = errorJson.detail;
      }
    } catch {
      // Ignore JSON parse error
    }

    throw new Error(errorMessage);
  }

  return response.blob();
}
