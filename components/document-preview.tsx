"use client";

import type React from "react";
import { useCallback, useRef, useState, useEffect } from "react";
import type {
  DocumentContent,
  ParagraphElement,
  TableElement,
  Run,
  SelectionPosition,
} from "@/lib/api-client";
import type { SelectionRef } from "@/lib/document-types";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface CursorPosition {
  type: "paragraph" | "table";
  paragraphIndex?: number;
  tableIndex?: number;
  rowIndex?: number;
  cellIndex?: number;
  cellParagraphIndex?: number;
  runIndex: number;
  charOffset: number;
}

interface DocumentPreviewProps {
  content: DocumentContent;
  onTextSelect?: (selection: SelectionRef) => void;
  onContentChange?: (content: DocumentContent) => void;
  onCursorStateChange?: (hasCursor: boolean, canInsert: boolean) => void;
  /** Testo da inserire programmaticamente (dal vault) */
  textToInsert?: string | null;
  /** Callback dopo l'inserimento */
  onInsertComplete?: () => void;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DocumentPreview({
  content,
  onTextSelect,
  onContentChange,
  onCursorStateChange,
  textToInsert,
  onInsertComplete,
}: DocumentPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  // Cursore virtuale
  const [cursorPos, setCursorPos] = useState<CursorPosition | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{
    x: number;
    y: number;
    height: number;
  } | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Input nascosto per catturare la digitazione
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // EFFETTO: Inserimento testo dal vault
  // ============================================================================
  useEffect(() => {
    if (textToInsert && cursorPos) {
      insertTextAtCursor(textToInsert);
      onInsertComplete?.();
    }
  }, [textToInsert]);

  // ============================================================================
  // EFFETTO: Notifica stato cursore al parent
  // ============================================================================
  useEffect(() => {
    onCursorStateChange?.(cursorPos !== null, cursorPos !== null && isFocused);
  }, [cursorPos, isFocused, onCursorStateChange]);

  // ============================================================================
  // INSERIMENTO TESTO
  // ============================================================================
  const insertTextAtCursor = useCallback(
    (text: string) => {
      if (!cursorPos) return;

      const newContent = JSON.parse(JSON.stringify(content)) as DocumentContent;

      // Trova il paragrafo target
      let targetParagraph: ParagraphElement | null = null;

      if (
        cursorPos.type === "paragraph" &&
        cursorPos.paragraphIndex !== undefined
      ) {
        const element = newContent.elements[cursorPos.paragraphIndex];
        if (element?.type === "paragraph") {
          targetParagraph = element;
        }
      } else if (
        cursorPos.type === "table" &&
        cursorPos.tableIndex !== undefined
      ) {
        const table = newContent.elements[cursorPos.tableIndex];
        if (table?.type === "table") {
          const cell =
            table.rows[cursorPos.rowIndex!]?.cells[cursorPos.cellIndex!];
          targetParagraph =
            cell?.paragraphs[cursorPos.cellParagraphIndex!] || null;
        }
      }

      if (!targetParagraph) return;

      // Trova il run e inserisci il testo
      const run = targetParagraph.runs[cursorPos.runIndex];
      if (run) {
        const before = run.text.substring(0, cursorPos.charOffset);
        const after = run.text.substring(cursorPos.charOffset);
        run.text = before + text + after;

        // Aggiorna la posizione del cursore
        setCursorPos({
          ...cursorPos,
          charOffset: cursorPos.charOffset + text.length,
        });

        onContentChange?.(newContent);
      }
    },
    [cursorPos, content, onContentChange]
  );

  // ============================================================================
  // GESTIONE CLICK - Posizionamento cursore
  // ============================================================================
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // Focus sull'input nascosto per catturare i tasti
      hiddenInputRef.current?.focus();
      setIsFocused(true);

      // Trova la posizione del click nel documento
      const clickedElement = e.target as HTMLElement;
      const runElement = findRunElement(clickedElement);

      if (!runElement) {
        // Click fuori dai run - cerca il paragrafo più vicino
        const paragraphElement = findParagraphElement(clickedElement);
        if (paragraphElement) {
          // Posiziona alla fine del paragrafo
          const pos = getEndOfParagraphPosition(paragraphElement, content);
          if (pos) {
            setCursorPos(pos);
            updateCursorCoords(paragraphElement, pos);
          }
        }
        return;
      }

      // Calcola l'offset del carattere basandosi sulla posizione X del click
      const range = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (!range) return;

      const charOffset = range.startOffset;
      const pos = getPositionFromRunElement(runElement, charOffset, content);

      if (pos) {
        setCursorPos(pos);
        updateCursorCoords(runElement, pos, charOffset);
      }
    },
    [content]
  );

  // ============================================================================
  // AGGIORNA COORDINATE CURSORE VISIVO
  // ============================================================================
  const updateCursorCoords = useCallback(
    (element: HTMLElement, pos: CursorPosition, charOffset?: number) => {
      const offset = charOffset ?? pos.charOffset;
      const textNode = element.firstChild;

      if (textNode && textNode.nodeType === Node.TEXT_NODE) {
        const range = document.createRange();
        const safeOffset = Math.min(offset, textNode.textContent?.length || 0);
        range.setStart(textNode, safeOffset);
        range.collapse(true);

        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();

        if (containerRect) {
          setCursorCoords({
            x:
              rect.left - containerRect.left + containerRef.current!.scrollLeft,
            y: rect.top - containerRect.top + containerRef.current!.scrollTop,
            height: rect.height || 20,
          });
        }
      } else {
        // Fallback: usa la posizione dell'elemento
        const rect = element.getBoundingClientRect();
        const containerRect = containerRef.current?.getBoundingClientRect();

        if (containerRect) {
          setCursorCoords({
            x:
              rect.left - containerRect.left + containerRef.current!.scrollLeft,
            y: rect.top - containerRect.top + containerRef.current!.scrollTop,
            height: rect.height || 20,
          });
        }
      }
    },
    []
  );

  // ============================================================================
  // GESTIONE SELEZIONE TESTO
  // ============================================================================
  const handleMouseUp = useCallback(() => {
    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) return;

      const selectedText = selection.toString();
      if (!selectedText.trim()) return;

      // C'è una selezione → notifica per il popover
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Trova la posizione nel documento
      const startElement = findRunElement(range.startContainer as HTMLElement);
      if (!startElement) return;

      const position = getPositionFromRunElement(
        startElement,
        range.startOffset,
        content
      );
      if (!position) return;

      // Calcola char_end
      const selectionPosition: SelectionPosition = {
        type: position.type,
        paragraph_index: position.paragraphIndex,
        table_index: position.tableIndex,
        row_index: position.rowIndex,
        cell_index: position.cellIndex,
        cell_paragraph_index: position.cellParagraphIndex,
        run_index: position.runIndex,
        char_start: position.charOffset,
        char_end: position.charOffset + selectedText.length,
      };

      // Posiziona il popover sopra la selezione, centrato
      const popoverX = rect.left + rect.width / 2;
      const popoverY = rect.top - 10;

      onTextSelect?.({
        position: selectionPosition,
        selectedText,
        x: popoverX,
        y: popoverY,
      });

      // Nascondi il cursore virtuale quando c'è selezione
      setCursorPos(null);
    }, 10);
  }, [content, onTextSelect]);

  // ============================================================================
  // GESTIONE INPUT DA TASTIERA
  // ============================================================================
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!cursorPos) return;

      // Ignora tasti speciali che non producono testo
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (
        ["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"].includes(e.key)
      )
        return;

      // Backspace
      if (e.key === "Backspace") {
        e.preventDefault();
        deleteCharBefore();
        return;
      }

      // Delete
      if (e.key === "Delete") {
        e.preventDefault();
        deleteCharAfter();
        return;
      }

      // Frecce
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveCursor(-1);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        moveCursor(1);
        return;
      }

      // Enter - per ora ignoriamo
      if (e.key === "Enter") {
        e.preventDefault();
        return;
      }

      // Carattere normale
      if (e.key.length === 1) {
        e.preventDefault();
        insertTextAtCursor(e.key);
      }
    },
    [cursorPos, insertTextAtCursor]
  );

  // ============================================================================
  // MOVIMENTO CURSORE
  // ============================================================================
  const moveCursor = useCallback(
    (delta: number) => {
      if (!cursorPos) return;

      const newOffset = cursorPos.charOffset + delta;

      // Trova il run corrente per verificare i limiti
      let currentRunText = "";
      if (
        cursorPos.type === "paragraph" &&
        cursorPos.paragraphIndex !== undefined
      ) {
        const para = content.elements[cursorPos.paragraphIndex];
        if (para?.type === "paragraph") {
          currentRunText = para.runs[cursorPos.runIndex]?.text || "";
        }
      }

      // Limita l'offset ai confini del run
      const clampedOffset = Math.max(
        0,
        Math.min(newOffset, currentRunText.length)
      );

      const newPos = { ...cursorPos, charOffset: clampedOffset };
      setCursorPos(newPos);

      // Aggiorna le coordinate visive
      const runElement = findRunElementByPosition(newPos);
      if (runElement) {
        updateCursorCoords(runElement, newPos);
      }
    },
    [cursorPos, content, updateCursorCoords]
  );

  // ============================================================================
  // CANCELLAZIONE
  // ============================================================================
  const deleteCharBefore = useCallback(() => {
    if (!cursorPos || cursorPos.charOffset === 0) return;

    const newContent = JSON.parse(JSON.stringify(content)) as DocumentContent;
    let targetParagraph: ParagraphElement | null = null;

    if (
      cursorPos.type === "paragraph" &&
      cursorPos.paragraphIndex !== undefined
    ) {
      const element = newContent.elements[cursorPos.paragraphIndex];
      if (element?.type === "paragraph") {
        targetParagraph = element;
      }
    } else if (
      cursorPos.type === "table" &&
      cursorPos.tableIndex !== undefined
    ) {
      const table = newContent.elements[cursorPos.tableIndex];
      if (table?.type === "table") {
        const cell =
          table.rows[cursorPos.rowIndex!]?.cells[cursorPos.cellIndex!];
        targetParagraph =
          cell?.paragraphs[cursorPos.cellParagraphIndex!] || null;
      }
    }

    if (!targetParagraph) return;

    const run = targetParagraph.runs[cursorPos.runIndex];
    if (run) {
      const before = run.text.substring(0, cursorPos.charOffset - 1);
      const after = run.text.substring(cursorPos.charOffset);
      run.text = before + after;

      setCursorPos({
        ...cursorPos,
        charOffset: cursorPos.charOffset - 1,
      });

      onContentChange?.(newContent);
    }
  }, [cursorPos, content, onContentChange]);

  const deleteCharAfter = useCallback(() => {
    if (!cursorPos) return;

    const newContent = JSON.parse(JSON.stringify(content)) as DocumentContent;
    let targetParagraph: ParagraphElement | null = null;

    if (
      cursorPos.type === "paragraph" &&
      cursorPos.paragraphIndex !== undefined
    ) {
      const element = newContent.elements[cursorPos.paragraphIndex];
      if (element?.type === "paragraph") {
        targetParagraph = element;
      }
    }

    if (!targetParagraph) return;

    const run = targetParagraph.runs[cursorPos.runIndex];
    if (run && cursorPos.charOffset < run.text.length) {
      const before = run.text.substring(0, cursorPos.charOffset);
      const after = run.text.substring(cursorPos.charOffset + 1);
      run.text = before + after;

      onContentChange?.(newContent);
    }
  }, [cursorPos, content, onContentChange]);

  // ============================================================================
  // TROVA RUN ELEMENT PER POSIZIONE
  // ============================================================================
  const findRunElementByPosition = useCallback(
    (pos: CursorPosition): HTMLElement | null => {
      if (!documentRef.current) return null;

      if (pos.type === "paragraph") {
        const selector = `[data-paragraph-index="${pos.paragraphIndex}"] [data-run-index="${pos.runIndex}"]`;
        return documentRef.current.querySelector(selector);
      } else {
        const selector = `[data-table-index="${pos.tableIndex}"][data-row-index="${pos.rowIndex}"][data-cell-index="${pos.cellIndex}"][data-cell-paragraph-index="${pos.cellParagraphIndex}"] [data-run-index="${pos.runIndex}"]`;
        return documentRef.current.querySelector(selector);
      }
    },
    []
  );

  // ============================================================================
  // BLUR - Nascondi cursore quando si clicca fuori
  // ============================================================================
  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto bg-background relative"
      onClick={handleClick}
      onMouseUp={handleMouseUp}
    >
      {/* Input nascosto per catturare la tastiera */}
      <input
        ref={hiddenInputRef}
        type="text"
        className="absolute opacity-0 pointer-events-none"
        style={{ top: 0, left: 0, width: 1, height: 1 }}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-4xl px-12 py-16">
        <div
          ref={documentRef}
          className="bg-card shadow-lg rounded-lg border border-border min-h-[11in] p-16 relative select-text"
        >
          {/* Cursore virtuale */}
          {cursorCoords && isFocused && (
            <div
              className="absolute w-0.5 bg-primary animate-blink pointer-events-none"
              style={{
                left: cursorCoords.x,
                top: cursorCoords.y,
                height: cursorCoords.height,
              }}
            />
          )}

          {/* Contenuto documento */}
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

function ParagraphRenderer({
  paragraph,
  cellContext,
}: {
  paragraph: ParagraphElement;
  cellContext?: {
    tableIndex: number;
    rowIndex: number;
    cellIndex: number;
    paragraphIndex: number;
  };
}) {
  const alignmentClass = paragraph.alignment
    ? {
        left: "text-left",
        center: "text-center",
        right: "text-right",
        justify: "text-justify",
      }[paragraph.alignment.toLowerCase()] || "text-left"
    : "text-left";

  const isEmpty =
    paragraph.runs.length === 0 || paragraph.runs.every((run) => !run.text);

  return (
    <p
      className={cn("mb-4 min-h-[1.5em] cursor-text", alignmentClass)}
      data-paragraph-index={cellContext ? undefined : paragraph.index}
      data-table-index={cellContext?.tableIndex}
      data-row-index={cellContext?.rowIndex}
      data-cell-index={cellContext?.cellIndex}
      data-cell-paragraph-index={cellContext?.paragraphIndex}
    >
      {isEmpty ? (
        <span
          data-run-index={0}
          data-empty="true"
          className="inline-block min-w-[4px] min-h-[1em]"
        >
          {"\u200B"}
        </span>
      ) : (
        paragraph.runs.map((run) => (
          <span
            key={run.index}
            data-run-index={run.index}
            className={cn(
              "cursor-text",
              run.style.bold && "font-bold",
              run.style.italic && "italic",
              run.style.underline && "underline"
            )}
            style={{
              color: run.style.color || undefined,
              fontSize: run.style.font_size
                ? `${run.style.font_size}pt`
                : undefined,
              fontFamily: run.style.font_name || undefined,
            }}
          >
            {run.text}
          </span>
        ))
      )}
    </p>
  );
}

// ============================================================================
// TABLE RENDERER
// ============================================================================

function TableRenderer({ table }: { table: TableElement }) {
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
// HELPER FUNCTIONS
// ============================================================================

function findRunElement(node: Node | HTMLElement | null): HTMLElement | null {
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

function findParagraphElement(
  node: Node | HTMLElement | null
): HTMLElement | null {
  let current: Node | null = node;
  while (current) {
    if (
      current instanceof HTMLElement &&
      (current.hasAttribute("data-paragraph-index") ||
        current.hasAttribute("data-cell-paragraph-index"))
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

function getPositionFromRunElement(
  element: HTMLElement,
  charOffset: number,
  content: DocumentContent
): CursorPosition | null {
  const runIndex = parseInt(element.getAttribute("data-run-index") || "0");
  const parent = element.parentElement;

  if (!parent) return null;

  const paragraphIndex = parent.getAttribute("data-paragraph-index");
  const tableIndex = parent.getAttribute("data-table-index");

  if (paragraphIndex !== null) {
    return {
      type: "paragraph",
      paragraphIndex: parseInt(paragraphIndex),
      runIndex,
      charOffset,
    };
  }

  if (tableIndex !== null) {
    return {
      type: "table",
      tableIndex: parseInt(tableIndex),
      rowIndex: parseInt(parent.getAttribute("data-row-index") || "0"),
      cellIndex: parseInt(parent.getAttribute("data-cell-index") || "0"),
      cellParagraphIndex: parseInt(
        parent.getAttribute("data-cell-paragraph-index") || "0"
      ),
      runIndex,
      charOffset,
    };
  }

  return null;
}

function getEndOfParagraphPosition(
  element: HTMLElement,
  content: DocumentContent
): CursorPosition | null {
  const paragraphIndex = element.getAttribute("data-paragraph-index");

  if (paragraphIndex !== null) {
    const paraIdx = parseInt(paragraphIndex);
    const para = content.elements[paraIdx];
    if (para?.type === "paragraph" && para.runs.length > 0) {
      const lastRun = para.runs[para.runs.length - 1];
      return {
        type: "paragraph",
        paragraphIndex: paraIdx,
        runIndex: lastRun.index,
        charOffset: lastRun.text.length,
      };
    }
  }

  return null;
}
