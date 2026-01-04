/**
 * Converte il contenuto dal formato backend (DocumentContent) al formato TipTap JSON
 * e viceversa per generare le modifiche.
 *
 * SEMPLIFICATO: usa solo funzionalità base di TipTap (StarterKit)
 */

import type {
  DocumentContent,
  ParagraphElement,
  TableElement,
  Modification,
} from "@/lib/api-client";
import type { JSONContent } from "@tiptap/react";

// ============================================================================
// BACKEND → TIPTAP
// ============================================================================

/**
 * Converte DocumentContent (dal backend) in formato TipTap JSON
 */
export function convertToTipTap(content: DocumentContent): JSONContent {
  const doc: JSONContent = {
    type: "doc",
    content: [],
  };

  if (!content || !content.elements) {
    console.warn("[convertToTipTap] Contenuto vuoto o non valido");
    return doc;
  }

  content.elements.forEach((element, index) => {
    if (element.type === "paragraph") {
      const para = convertParagraphToTipTap(element);
      if (para) {
        doc.content!.push(para);
      }
    } else if (element.type === "table") {
      // Converti ogni cella della tabella come paragrafo separato
      // (TipTap base non supporta tabelle senza estensione)
      const tableParagraphs = convertTableToParagraphs(element);
      doc.content!.push(...tableParagraphs);
    }
  });

  // Se il documento è vuoto, aggiungi un paragrafo vuoto
  if (doc.content!.length === 0) {
    doc.content!.push({ type: "paragraph" });
  }

  console.log("[convertToTipTap] Convertito:", doc.content?.length, "nodi");
  return doc;
}

function convertParagraphToTipTap(
  paragraph: ParagraphElement
): JSONContent | null {
  const node: JSONContent = {
    type: "paragraph",
    content: [],
  };

  // Aggiungi il testo dei run
  paragraph.runs.forEach((run) => {
    if (run.text && run.text.length > 0) {
      const textNode: JSONContent = {
        type: "text",
        text: run.text,
      };

      // Aggiungi marks per stili (solo quelli supportati da StarterKit)
      const marks: JSONContent[] = [];
      if (run.style.bold) {
        marks.push({ type: "bold" });
      }
      if (run.style.italic) {
        marks.push({ type: "italic" });
      }
      // Underline richiede estensione separata, ma l'abbiamo aggiunta
      if (run.style.underline) {
        marks.push({ type: "underline" });
      }

      if (marks.length > 0) {
        textNode.marks = marks as any;
      }

      node.content!.push(textNode);
    }
  });

  // Ritorna il paragrafo anche se vuoto (TipTap gestisce paragrafi vuoti)
  if (node.content!.length === 0) {
    delete node.content;
  }

  return node;
}

function convertTableToParagraphs(table: TableElement): JSONContent[] {
  const paragraphs: JSONContent[] = [];

  // Aggiungi un separatore visivo prima della tabella
  paragraphs.push({
    type: "paragraph",
    content: [
      { type: "text", text: "═══ TABELLA ═══", marks: [{ type: "bold" }] },
    ],
  });

  table.rows.forEach((row, rowIndex) => {
    row.cells.forEach((cell, cellIndex) => {
      cell.paragraphs.forEach((para) => {
        const text = para.runs.map((r) => r.text).join("");
        if (text.trim()) {
          paragraphs.push({
            type: "paragraph",
            content: [
              {
                type: "text",
                text: `[R${rowIndex + 1}C${cellIndex + 1}] `,
                marks: [{ type: "bold" }],
              },
              { type: "text", text: text },
            ],
          });
        }
      });
    });
  });

  // Separatore di fine tabella
  paragraphs.push({
    type: "paragraph",
    content: [
      { type: "text", text: "═══════════════", marks: [{ type: "bold" }] },
    ],
  });

  return paragraphs;
}

// ============================================================================
// TIPTAP → MODIFICATIONS (per il backend)
// ============================================================================

/**
 * Confronta il contenuto originale con quello modificato in TipTap
 * e genera la lista di modifiche per il backend
 */
export function generateModificationsFromTipTap(
  originalContent: DocumentContent,
  tiptapContent: JSONContent
): Modification[] {
  const modifications: Modification[] = [];

  if (!tiptapContent.content) return modifications;

  // Estrai tutto il testo da TipTap come array di stringhe (un elemento per paragrafo)
  const tiptapTexts: string[] = [];
  tiptapContent.content.forEach((node) => {
    if (node.type === "paragraph") {
      tiptapTexts.push(extractTextFromNode(node));
    }
  });

  // Indice per tracciare la posizione in tiptapTexts
  let tiptapIndex = 0;

  // Confronta con l'originale
  originalContent.elements.forEach((element, elementIndex) => {
    if (element.type === "paragraph") {
      const originalText = element.runs.map((r) => r.text).join("");
      const currentText = tiptapTexts[tiptapIndex] || "";
      tiptapIndex++;

      if (originalText !== currentText) {
        modifications.push({
          position: {
            type: "paragraph",
            paragraph_index: elementIndex,
            run_index: 0,
            char_start: 0,
            char_end: originalText.length,
          },
          original_text: originalText,
          new_text: currentText,
        });
      }
    } else if (element.type === "table") {
      // Salta il separatore "TABELLA"
      tiptapIndex++;

      element.rows.forEach((row, rowIndex) => {
        row.cells.forEach((cell, cellIndex) => {
          cell.paragraphs.forEach((para, paraIndex) => {
            const originalText = para.runs.map((r) => r.text).join("");

            // Il testo in TipTap ha il prefisso [R1C1], lo rimuoviamo
            let currentText = tiptapTexts[tiptapIndex] || "";
            const prefixMatch = currentText.match(/^\[R\d+C\d+\]\s*/);
            if (prefixMatch) {
              currentText = currentText.substring(prefixMatch[0].length);
            }
            tiptapIndex++;

            if (originalText !== currentText && originalText.trim()) {
              modifications.push({
                position: {
                  type: "table",
                  table_index: elementIndex,
                  row_index: rowIndex,
                  cell_index: cellIndex,
                  cell_paragraph_index: paraIndex,
                  run_index: 0,
                  char_start: 0,
                  char_end: originalText.length,
                },
                original_text: originalText,
                new_text: currentText,
              });
            }
          });
        });
      });

      // Salta il separatore di fine tabella
      tiptapIndex++;
    }
  });

  return modifications;
}

function extractTextFromNode(node: JSONContent): string {
  if (node.type === "text") {
    return node.text || "";
  }

  if (!node.content) return "";

  return node.content.map((child) => extractTextFromNode(child)).join("");
}

// ============================================================================
// UTILITY: Aggiorna DocumentContent dal TipTap (per sincronizzazione stato)
// ============================================================================

/**
 * Aggiorna il DocumentContent con il contenuto modificato da TipTap
 */
export function updateDocumentContentFromTipTap(
  original: DocumentContent,
  tiptapContent: JSONContent
): DocumentContent {
  const updated = JSON.parse(JSON.stringify(original)) as DocumentContent;

  if (!tiptapContent.content) return updated;

  // Estrai testi da TipTap
  const tiptapTexts: string[] = [];
  tiptapContent.content.forEach((node) => {
    if (node.type === "paragraph") {
      tiptapTexts.push(extractTextFromNode(node));
    }
  });

  let tiptapIndex = 0;

  updated.elements.forEach((element) => {
    if (element.type === "paragraph") {
      const newText = tiptapTexts[tiptapIndex] || "";
      tiptapIndex++;

      if (element.runs.length > 0) {
        element.runs = [
          {
            ...element.runs[0],
            index: 0,
            text: newText,
          },
        ];
      }
    } else if (element.type === "table") {
      // Salta separatore
      tiptapIndex++;

      element.rows.forEach((row) => {
        row.cells.forEach((cell) => {
          cell.paragraphs.forEach((para) => {
            let newText = tiptapTexts[tiptapIndex] || "";
            // Rimuovi prefisso [R1C1]
            const prefixMatch = newText.match(/^\[R\d+C\d+\]\s*/);
            if (prefixMatch) {
              newText = newText.substring(prefixMatch[0].length);
            }
            tiptapIndex++;

            if (para.runs.length > 0) {
              para.runs = [
                {
                  ...para.runs[0],
                  index: 0,
                  text: newText,
                },
              ];
            }
          });
        });
      });

      // Salta separatore fine
      tiptapIndex++;
    }
  });

  return updated;
}
