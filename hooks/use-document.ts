"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import type { JSONContent } from "@tiptap/react";
import {
  parseDocument,
  type DocumentContent,
  type Modification,
  type SelectionPosition,
} from "@/lib/api-client";
import type { DocumentState } from "@/lib/document-types";
import { convertToTipTap } from "@/lib/content-converter";

// ============================================================================
// TYPES
// ============================================================================

export interface CheckboxModification {
  checkboxIndex: number;
  newChecked: boolean;
}

export type DownloadFormat = "docx" | "pdf";

interface TextSegment {
  path: string; // es: "p0", "t0r1c2p0"
  text: string;
}

// ============================================================================
// PATH PARSING - Estrae coordinate dal path
// ============================================================================

/**
 * Parsa un path come "p5" o "t0r1c2p0" e restituisce una SelectionPosition
 *
 * Formati:
 * - "p5" → paragrafo index 5
 * - "t0r1c2p0" → tabella 0, riga 1, cella 2, paragrafo 0
 */
function parsePathToPosition(
  path: string,
  originalTextLength: number
): SelectionPosition {
  // Pattern per tabella: t{tableIdx}r{rowIdx}c{cellIdx}p{paraIdx}
  const tableMatch = path.match(/^t(\d+)r(\d+)c(\d+)p(\d+)$/);

  if (tableMatch) {
    return {
      type: "table",
      table_index: parseInt(tableMatch[1], 10),
      row_index: parseInt(tableMatch[2], 10),
      cell_index: parseInt(tableMatch[3], 10),
      cell_paragraph_index: parseInt(tableMatch[4], 10),
      run_index: 0,
      char_start: 0,
      char_end: originalTextLength,
    };
  }

  // Pattern per paragrafo: p{index}
  const paraMatch = path.match(/^p(\d+)$/);

  if (paraMatch) {
    return {
      type: "paragraph",
      paragraph_index: parseInt(paraMatch[1], 10),
      run_index: 0,
      char_start: 0,
      char_end: originalTextLength,
    };
  }

  // Fallback
  console.warn(`[parsePathToPosition] Path non riconosciuto: ${path}`);
  return {
    type: "paragraph",
    paragraph_index: 0,
    run_index: 0,
    char_start: 0,
    char_end: originalTextLength,
  };
}

// ============================================================================
// TEXT EXTRACTION
// ============================================================================

function extractTextFromNode(node: JSONContent): string {
  if (!node) return "";
  if (node.type === "text") return node.text || "";
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractTextFromNode).join("");
  }
  return "";
}

/**
 * Tipi di nodi che in python-docx sono considerati paragrafi.
 * TipTap può avere vari tipi ma python-docx li vede tutti come paragrafi.
 */
const PARAGRAPH_LIKE_TYPES = [
  "paragraph",
  "heading",
  "blockquote",
  "codeBlock",
  "horizontalRule",
];

/**
 * Verifica se un nodo è un tipo "paragrafo-like" (conta come paragrafo in python-docx)
 */
function isParagraphLike(node: JSONContent): boolean {
  return PARAGRAPH_LIKE_TYPES.includes(node.type || "");
}

/**
 * Estrae tutti i segmenti di testo dal contenuto TipTap.
 *
 * IMPORTANTE: Gli indici devono corrispondere a quelli di python-docx:
 * - doc.paragraphs[] per i paragrafi a livello body
 * - doc.tables[].rows[].cells[].paragraphs[] per le celle
 *
 * Gestisce anche liste (bulletList, orderedList) che contengono listItem
 * che a loro volta contengono paragrafi.
 */
function extractTextSegments(content: JSONContent): TextSegment[] {
  const segments: TextSegment[] = [];
  if (!content?.content) return segments;

  let paragraphIndex = 0;
  let tableIndex = 0;

  const processNode = (node: JSONContent) => {
    if (!node) return;

    // Paragrafo diretto o tipo simile
    if (isParagraphLike(node)) {
      const text = extractTextFromNode(node);
      segments.push({
        path: `p${paragraphIndex}`,
        text: text,
      });
      paragraphIndex++;
      return;
    }

    // Tabella
    if (node.type === "table" && node.content) {
      node.content.forEach((row, rowIndex) => {
        if (row.type === "tableRow" && row.content) {
          row.content.forEach((cell, cellIndex) => {
            if (
              (cell.type === "tableCell" || cell.type === "tableHeader") &&
              cell.content
            ) {
              cell.content.forEach((para, paraIndex) => {
                if (para.type === "paragraph") {
                  const text = extractTextFromNode(para);
                  segments.push({
                    path: `t${tableIndex}r${rowIndex}c${cellIndex}p${paraIndex}`,
                    text: text,
                  });
                }
              });
            }
          });
        }
      });
      tableIndex++;
      return;
    }

    // Liste (bulletList, orderedList) - ogni listItem può contenere paragrafi
    // In python-docx questi sono paragrafi normali con stile lista
    if (
      (node.type === "bulletList" || node.type === "orderedList") &&
      node.content
    ) {
      node.content.forEach((listItem) => {
        if (listItem.type === "listItem" && listItem.content) {
          listItem.content.forEach((childNode) => {
            if (childNode.type === "paragraph") {
              const text = extractTextFromNode(childNode);
              segments.push({
                path: `p${paragraphIndex}`,
                text: text,
              });
              paragraphIndex++;
            }
            // Liste annidate
            else if (
              childNode.type === "bulletList" ||
              childNode.type === "orderedList"
            ) {
              processNode(childNode);
            }
          });
        }
      });
      return;
    }

    // Altri contenitori che potrebbero avere contenuto
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(processNode);
    }
  };

  content.content.forEach(processNode);

  return segments;
}

// ============================================================================
// DIFF GENERATION - Con coordinate corrette
// ============================================================================

function generateDiffModifications(
  originalSegments: TextSegment[],
  currentContent: JSONContent
): Modification[] {
  const modifications: Modification[] = [];
  const currentSegments = extractTextSegments(currentContent);

  // Debug: log dei segmenti
  console.log(
    `[Diff] Originali: ${originalSegments.length}, Correnti: ${currentSegments.length}`
  );

  // Mappa path -> testo attuale
  const currentMap = new Map<string, string>();
  currentSegments.forEach((seg) => currentMap.set(seg.path, seg.text));

  // Confronta ogni segmento originale con quello attuale
  originalSegments.forEach((original) => {
    const currentText = currentMap.get(original.path);

    // Se il path non esiste più, logga un warning
    if (currentText === undefined) {
      console.warn(`[Diff] Path non trovato nel corrente: ${original.path}`);
      return;
    }

    if (currentText !== original.text) {
      // SKIP: entrambi vuoti
      if (original.text.trim() === "" && currentText.trim() === "") {
        return;
      }

      // LOG per debug
      const isInsertion = original.text.trim() === "";
      const isReplacement =
        original.text.trim() !== "" && currentText.trim() !== "";
      const isDeletion = currentText.trim() === "";

      console.log(
        `[Diff] ${original.path}: "${original.text.slice(
          0,
          30
        )}..." → "${currentText.slice(0, 30)}..." ` +
          `(${
            isInsertion
              ? "INSERT"
              : isReplacement
              ? "REPLACE"
              : isDeletion
              ? "DELETE"
              : "CHANGE"
          })`
      );

      // Usa le coordinate corrette dal path!
      const position = parsePathToPosition(original.path, original.text.length);

      modifications.push({
        position,
        original_text: original.text,
        new_text: currentText,
      });
    }
  });

  // Verifica anche se ci sono nuovi segmenti nel corrente che non erano nell'originale
  const originalPaths = new Set(originalSegments.map((s) => s.path));
  currentSegments.forEach((current) => {
    if (!originalPaths.has(current.path) && current.text.trim() !== "") {
      console.warn(
        `[Diff] Nuovo path nel corrente (non tracciato): ${
          current.path
        } = "${current.text.slice(0, 30)}..."`
      );
    }
  });

  return modifications;
}

// ============================================================================
// HOOK
// ============================================================================

export function useDocument() {
  const [documentState, setDocumentState] = useState<DocumentState | null>(
    null
  );
  const [tiptapContent, setTiptapContent] = useState<JSONContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [checkboxModifications, setCheckboxModifications] = useState<
    Map<number, boolean>
  >(new Map());

  const originalTiptapContent = useRef<JSONContent | null>(null);
  const originalTextSegments = useRef<TextSegment[]>([]);

  const uploadDocument = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setCheckboxModifications(new Map());

    try {
      console.log("[useDocument] Inizio upload file:", file.name);
      const response = await parseDocument(file);

      if (!response.success) {
        throw new Error("Errore durante il parsing del documento");
      }

      const tiptap = convertToTipTap(response.content);
      setTiptapContent(tiptap);

      // Salva originale per diff
      originalTiptapContent.current = JSON.parse(JSON.stringify(tiptap));
      originalTextSegments.current = extractTextSegments(tiptap);

      console.log(
        "[useDocument] Salvati",
        originalTextSegments.current.length,
        "segmenti di testo originali"
      );

      // Debug: mostra alcuni segmenti
      console.log("[useDocument] Primi 10 segmenti:");
      originalTextSegments.current.slice(0, 10).forEach((seg) => {
        console.log(
          `  ${seg.path}: "${seg.text.slice(0, 50)}${
            seg.text.length > 50 ? "..." : ""
          }"`
        );
      });

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

  const handleTiptapChange = useCallback((newTiptapContent: JSONContent) => {
    setTiptapContent(newTiptapContent);
  }, []);

  const textModificationsCount = useMemo(() => {
    if (!tiptapContent || originalTextSegments.current.length === 0) {
      return 0;
    }
    const diffs = generateDiffModifications(
      originalTextSegments.current,
      tiptapContent
    );
    return diffs.length;
  }, [tiptapContent]);

  const totalModifications =
    textModificationsCount + checkboxModifications.size;

  const downloadDocument = useCallback(
    async (fileName: string, format: DownloadFormat = "docx") => {
      if (!documentState || !tiptapContent) return;

      setIsLoading(true);
      setError(null);

      try {
        const textMods = generateDiffModifications(
          originalTextSegments.current,
          tiptapContent
        );

        console.log("[useDocument] ========== DOWNLOAD ==========");
        console.log("[useDocument] Modifiche testo (diff):", textMods.length);
        textMods.forEach((m, i) => {
          const posInfo =
            m.position.type === "table"
              ? `Table[${m.position.table_index}][${m.position.row_index}][${m.position.cell_index}]`
              : `Para[${m.position.paragraph_index}]`;
          console.log(`  ${i + 1}. ${posInfo}`);
          console.log(
            `     FROM: "${m.original_text.slice(0, 50)}${
              m.original_text.length > 50 ? "..." : ""
            }"`
          );
          console.log(
            `     TO:   "${m.new_text.slice(0, 50)}${
              m.new_text.length > 50 ? "..." : ""
            }"`
          );
        });

        const checkboxMods: CheckboxModification[] = [];
        checkboxModifications.forEach((newChecked, checkboxIndex) => {
          checkboxMods.push({ checkboxIndex, newChecked });
        });

        console.log("[useDocument] Checkbox modifiche:", checkboxMods.length);
        console.log("[useDocument] ==============================");

        const blob = await generateDocumentWithFormat(
          documentState.originalFile,
          textMods,
          checkboxMods,
          format
        );

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
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [documentState, tiptapContent, checkboxModifications]
  );

  const resetDocument = useCallback(() => {
    setDocumentState(null);
    setTiptapContent(null);
    setCheckboxModifications(new Map());
    originalTiptapContent.current = null;
    originalTextSegments.current = [];
    setError(null);
  }, []);

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
    registerCheckboxModification,
    downloadDocument,
    resetDocument,
  };
}

// ============================================================================
// API HELPER
// ============================================================================

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
      // Ignore
    }

    throw new Error(errorMessage);
  }

  return response.blob();
}
