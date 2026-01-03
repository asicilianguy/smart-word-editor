"use client";

import type React from "react";
import type {
  DocumentContent,
  ParagraphElement,
  TableElement,
  Run,
  SelectionPosition,
} from "@/lib/api-client";
import type { SelectionRef } from "@/lib/document-types";
import { cn } from "@/lib/utils";

interface DocumentPreviewProps {
  content: DocumentContent;
  onTextSelect?: (selection: SelectionRef) => void;
}

/**
 * Componente per la preview del documento
 *
 * Responsabilità:
 * - Renderizzare il contenuto del documento (paragrafi e tabelle)
 * - Gestire la selezione del testo (click e drag)
 * - Preservare la formattazione originale
 * - Supportare selezioni cross-run
 */
export function DocumentPreview({
  content,
  onTextSelect,
}: DocumentPreviewProps) {
  /**
   * Gestisce la selezione del testo quando l'utente rilascia il mouse
   */
  const handleMouseUp = (e: React.MouseEvent) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const selectedText = selection.toString();
    if (!selectedText.trim()) return;

    // Ottieni la posizione per il popover
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Trova le informazioni sulla posizione nel documento
    const positionInfo = getSelectionPosition(selection);
    if (!positionInfo) {
      console.warn(
        "[DocumentPreview] Impossibile determinare la posizione della selezione"
      );
      return;
    }

    const selectionRef: SelectionRef = {
      position: positionInfo,
      selectedText,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    };

    onTextSelect?.(selectionRef);
  };

  return (
    <div
      className="h-full overflow-y-auto bg-background"
      onMouseUp={handleMouseUp}
    >
      <div className="mx-auto max-w-4xl px-12 py-16">
        <div className="bg-card shadow-lg rounded-lg border border-border min-h-[11in] p-16">
          {content.elements.map((element, index) =>
            element.type === "paragraph" ? (
              <ParagraphRenderer key={`p-${index}`} paragraph={element} />
            ) : (
              <TableRenderer key={`t-${index}`} table={element} />
            )
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PARAGRAPH RENDERER
// ============================================================================

interface ParagraphRendererProps {
  paragraph: ParagraphElement;
  /** Indice del paragrafo nella cella (per tabelle) */
  cellContext?: {
    tableIndex: number;
    rowIndex: number;
    cellIndex: number;
    paragraphIndex: number;
  };
}

function ParagraphRenderer({ paragraph, cellContext }: ParagraphRendererProps) {
  // Se non ci sono run, renderizza un paragrafo vuoto
  if (paragraph.runs.length === 0) {
    return <p className="mb-4 leading-relaxed min-h-[1.5em]">&nbsp;</p>;
  }

  return (
    <p
      className={cn(
        "mb-4 leading-relaxed",
        paragraph.alignment === "center" && "text-center",
        paragraph.alignment === "right" && "text-right",
        paragraph.alignment === "justify" && "text-justify",
        paragraph.alignment === "both" && "text-justify"
      )}
    >
      {paragraph.runs.map((run, rIndex) => (
        <RunRenderer
          key={rIndex}
          run={run}
          paragraphIndex={paragraph.index}
          cellContext={cellContext}
        />
      ))}
    </p>
  );
}

// ============================================================================
// RUN RENDERER
// ============================================================================

interface RunRendererProps {
  run: Run;
  paragraphIndex: number;
  cellContext?: {
    tableIndex: number;
    rowIndex: number;
    cellIndex: number;
    paragraphIndex: number;
  };
}

function RunRenderer({ run, paragraphIndex, cellContext }: RunRendererProps) {
  // Se il run è vuoto, non renderizzare nulla
  if (!run.text) return null;

  // Costruisci i data attributes per identificare la posizione
  const dataAttributes: Record<string, string | number> = {
    "data-run-index": run.index,
  };

  if (cellContext) {
    dataAttributes["data-type"] = "table";
    dataAttributes["data-table-index"] = cellContext.tableIndex;
    dataAttributes["data-row-index"] = cellContext.rowIndex;
    dataAttributes["data-cell-index"] = cellContext.cellIndex;
    dataAttributes["data-cell-paragraph-index"] = cellContext.paragraphIndex;
  } else {
    dataAttributes["data-type"] = "paragraph";
    dataAttributes["data-paragraph-index"] = paragraphIndex;
  }

  return (
    <span
      {...dataAttributes}
      className={cn(
        "select-text cursor-text",
        run.style.bold && "font-bold",
        run.style.italic && "italic",
        run.style.underline && "underline"
      )}
      style={{
        color: run.style.color || undefined,
        fontSize: run.style.font_size ? `${run.style.font_size}pt` : undefined,
        fontFamily: run.style.font_name || undefined,
      }}
    >
      {run.text}
    </span>
  );
}

// ============================================================================
// TABLE RENDERER
// ============================================================================

interface TableRendererProps {
  table: TableElement;
}

function TableRenderer({ table }: TableRendererProps) {
  return (
    <div className="mb-6 overflow-x-auto">
      <table className="w-full border-collapse border border-border">
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.index}>
              {row.cells.map((cell) => (
                <td
                  key={cell.index}
                  className="border border-border p-2 align-top"
                >
                  {cell.paragraphs.map((para, pIndex) => (
                    <ParagraphRenderer
                      key={pIndex}
                      paragraph={para}
                      cellContext={{
                        tableIndex: table.index,
                        rowIndex: row.index,
                        cellIndex: cell.index,
                        paragraphIndex: pIndex,
                      }}
                    />
                  ))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// SELECTION HELPERS
// ============================================================================

/**
 * Determina la posizione della selezione nel documento
 * Supporta selezioni single-run e cross-run
 */
function getSelectionPosition(selection: Selection): SelectionPosition | null {
  const anchorNode = selection.anchorNode;
  const focusNode = selection.focusNode;

  if (!anchorNode || !focusNode) return null;

  // Trova gli elementi run per anchor e focus
  const anchorElement = findRunElement(anchorNode);
  const focusElement = findRunElement(focusNode);

  if (!anchorElement) return null;

  // Determina se è una selezione cross-run
  const isCrossRun = focusElement && anchorElement !== focusElement;

  // Estrai le informazioni dal primo elemento (anchor)
  const type = anchorElement.getAttribute("data-type") as "paragraph" | "table";
  const runIndex = parseInt(
    anchorElement.getAttribute("data-run-index") || "0"
  );

  // Calcola gli offset
  let charStart = selection.anchorOffset;
  let charEnd = selection.focusOffset;

  // Se la selezione è al contrario (da destra a sinistra), inverti
  if (!isCrossRun && charStart > charEnd) {
    [charStart, charEnd] = [charEnd, charStart];
  }

  // Costruisci la posizione base
  const position: SelectionPosition = {
    type,
    run_index: runIndex,
    char_start: charStart,
    char_end: isCrossRun ? getTextLength(anchorElement) : charEnd,
  };

  // Aggiungi informazioni specifiche per tipo
  if (type === "paragraph") {
    position.paragraph_index = parseInt(
      anchorElement.getAttribute("data-paragraph-index") || "0"
    );
  } else if (type === "table") {
    position.table_index = parseInt(
      anchorElement.getAttribute("data-table-index") || "0"
    );
    position.row_index = parseInt(
      anchorElement.getAttribute("data-row-index") || "0"
    );
    position.cell_index = parseInt(
      anchorElement.getAttribute("data-cell-index") || "0"
    );
    position.cell_paragraph_index = parseInt(
      anchorElement.getAttribute("data-cell-paragraph-index") || "0"
    );
  }

  // Se è cross-run, aggiungi le informazioni del focus
  if (isCrossRun && focusElement) {
    const endRunIndex = parseInt(
      focusElement.getAttribute("data-run-index") || "0"
    );

    position.end_run_index = endRunIndex;
    position.char_start_in_first_run = charStart;
    position.char_end_in_last_run = selection.focusOffset;
  }

  return position;
}

/**
 * Trova l'elemento run (span con data-run-index) partendo da un nodo
 */
function findRunElement(node: Node): HTMLElement | null {
  let current: Node | null = node;

  while (current) {
    if (
      current instanceof HTMLElement &&
      current.hasAttribute("data-run-index")
    ) {
      return current;
    }
    current = current.parentElement;
  }

  return null;
}

/**
 * Ottiene la lunghezza del testo in un elemento
 */
function getTextLength(element: HTMLElement): number {
  return element.textContent?.length ?? 0;
}
