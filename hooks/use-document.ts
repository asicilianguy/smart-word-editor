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
import {
  convertToTipTap,
  generateModificationsFromTipTap,
  updateDocumentContentFromTipTap,
} from "@/lib/content-converter";

/**
 * Hook per la gestione del documento con TipTap
 */
export function useDocument() {
  const [documentState, setDocumentState] = useState<DocumentState | null>(
    null
  );
  const [tiptapContent, setTiptapContent] = useState<JSONContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contenuto originale per calcolo modifiche
  const originalContent = useRef<DocumentContent | null>(null);

  /**
   * Carica e parsa un documento DOCX
   */
  const uploadDocument = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("[useDocument] Inizio upload file:", file.name);
      const response = await parseDocument(file);
      console.log("[useDocument] Risposta backend:", response);
      console.log(
        "[useDocument] Elementi:",
        response.content?.elements?.length
      );

      if (!response.success) {
        throw new Error("Errore durante il parsing del documento");
      }

      // Salva l'originale
      originalContent.current = JSON.parse(JSON.stringify(response.content));

      // Converti in formato TipTap
      console.log("[useDocument] Converto in TipTap...");
      const tiptap = convertToTipTap(response.content);
      console.log("[useDocument] TipTap content:", tiptap);
      console.log("[useDocument] TipTap nodi:", tiptap.content?.length);

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
   * Aggiorna il contenuto quando TipTap cambia
   */
  const handleTiptapChange = useCallback(
    (newTiptapContent: JSONContent) => {
      if (!documentState || !originalContent.current) return;

      setTiptapContent(newTiptapContent);

      // Genera le modifiche confrontando con l'originale
      const modifications = generateModificationsFromTipTap(
        originalContent.current,
        newTiptapContent
      );

      // Aggiorna il DocumentContent per mantenerlo sincronizzato
      const updatedContent = updateDocumentContentFromTipTap(
        originalContent.current,
        newTiptapContent
      );

      setDocumentState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          content: updatedContent,
          modifications,
        };
      });
    },
    [documentState]
  );

  /**
   * Scarica il documento DOCX con le modifiche applicate
   */
  const downloadDocument = useCallback(async () => {
    if (!documentState) return;

    setIsLoading(true);
    setError(null);

    try {
      // Genera le modifiche finali dal contenuto TipTap corrente
      const modifications =
        tiptapContent && originalContent.current
          ? generateModificationsFromTipTap(
              originalContent.current,
              tiptapContent
            )
          : documentState.modifications;

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
  }, [documentState, tiptapContent]);

  /**
   * Resetta lo stato
   */
  const resetDocument = useCallback(() => {
    setDocumentState(null);
    setTiptapContent(null);
    originalContent.current = null;
    setError(null);
  }, []);

  return {
    // Stato
    document: documentState,
    content: documentState?.content ?? null,
    metadata: documentState?.metadata ?? null,
    modifications: documentState?.modifications ?? [],
    tiptapContent,
    isLoading,
    error,

    // Azioni
    uploadDocument,
    handleTiptapChange,
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
