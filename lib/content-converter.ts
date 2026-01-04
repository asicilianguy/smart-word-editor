/**
 * Converte il contenuto dal formato backend (DocumentContent) al formato TipTap JSON
 *
 * VERSIONE CON TABELLE:
 * - Supporto VERO per tabelle (richiede @tiptap/extension-table)
 * - Checkbox normalizzate a ☐/☑ nel parser backend
 * - Preview fedele al documento originale
 */

import type {
  DocumentContent,
  ParagraphElement,
  TableElement,
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

  content.elements.forEach((element) => {
    if (element.type === "paragraph") {
      const para = convertParagraphToTipTap(element);
      if (para) {
        doc.content!.push(para);
      }
    } else if (element.type === "table") {
      // Converti come tabella VERA di TipTap
      const table = convertTableToTipTap(element);
      if (table) {
        doc.content!.push(table);
      }
    }
  });

  // Se il documento è vuoto, aggiungi un paragrafo vuoto
  if (doc.content!.length === 0) {
    doc.content!.push({ type: "paragraph" });
  }

  console.log("[convertToTipTap] Convertito:", doc.content?.length, "nodi");
  return doc;
}

/**
 * Converte un paragrafo in formato TipTap
 */
function convertParagraphToTipTap(
  paragraph: ParagraphElement
): JSONContent | null {
  const node: JSONContent = {
    type: "paragraph",
    content: [],
  };

  paragraph.runs.forEach((run) => {
    if (run.text && run.text.length > 0) {
      const textNode: JSONContent = {
        type: "text",
        text: run.text,
      };

      // Aggiungi marks per stili
      const marks: JSONContent[] = [];
      if (run.style.bold) {
        marks.push({ type: "bold" });
      }
      if (run.style.italic) {
        marks.push({ type: "italic" });
      }
      if (run.style.underline) {
        marks.push({ type: "underline" });
      }

      if (marks.length > 0) {
        textNode.marks = marks as any;
      }

      node.content!.push(textNode);
    }
  });

  if (node.content!.length === 0) {
    delete node.content;
  }

  return node;
}

/**
 * Converte una tabella in formato TipTap Table
 *
 * Struttura TipTap:
 * {
 *   type: "table",
 *   content: [
 *     { type: "tableRow", content: [
 *       { type: "tableHeader" | "tableCell", content: [{ type: "paragraph", ... }] }
 *     ]}
 *   ]
 * }
 */
function convertTableToTipTap(table: TableElement): JSONContent {
  const tableNode: JSONContent = {
    type: "table",
    content: [],
  };

  table.rows.forEach((row, rowIndex) => {
    const rowNode: JSONContent = {
      type: "tableRow",
      content: [],
    };

    row.cells.forEach((cell) => {
      // Prima riga = header, altre = celle normali
      const cellType = rowIndex === 0 ? "tableHeader" : "tableCell";

      const cellNode: JSONContent = {
        type: cellType,
        content: [],
      };

      // Ogni cella contiene paragrafi
      if (cell.paragraphs && cell.paragraphs.length > 0) {
        cell.paragraphs.forEach((para) => {
          const textContent: JSONContent[] = [];

          para.runs.forEach((run) => {
            if (run.text && run.text.length > 0) {
              const textNode: JSONContent = {
                type: "text",
                text: run.text,
              };

              // Marks per stili
              const marks: JSONContent[] = [];
              if (run.style.bold) marks.push({ type: "bold" });
              if (run.style.italic) marks.push({ type: "italic" });
              if (run.style.underline) marks.push({ type: "underline" });

              if (marks.length > 0) {
                textNode.marks = marks as any;
              }

              textContent.push(textNode);
            }
          });

          cellNode.content!.push({
            type: "paragraph",
            content: textContent.length > 0 ? textContent : undefined,
          });
        });
      }

      // Se la cella è vuota, aggiungi un paragrafo vuoto
      if (cellNode.content!.length === 0) {
        cellNode.content!.push({ type: "paragraph" });
      }

      rowNode.content!.push(cellNode);
    });

    // Assicurati che ogni riga abbia almeno una cella
    if (rowNode.content!.length === 0) {
      rowNode.content!.push({
        type: rowIndex === 0 ? "tableHeader" : "tableCell",
        content: [{ type: "paragraph" }],
      });
    }

    tableNode.content!.push(rowNode);
  });

  return tableNode;
}

// ============================================================================
// FUNZIONI LEGACY (mantenute per compatibilità ma non più usate)
// ============================================================================

/**
 * @deprecated - Le modifiche sono ora tracciate esplicitamente
 */
export function generateModificationsFromTipTap(): never[] {
  return [];
}

/**
 * @deprecated - Non più usata
 */
export function updateDocumentContentFromTipTap(
  original: DocumentContent
): DocumentContent {
  return original;
}
