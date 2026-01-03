"use client"

import type React from "react"

import type { Paragraph } from "@/lib/document-types"
import { cn } from "@/lib/utils"

interface DocumentPreviewProps {
  paragraphs: Paragraph[]
  onTextSelect?: (selection: {
    paragraphIndex: number
    runIndex: number
    startOffset: number
    endOffset: number
    selectedText: string
    x: number
    y: number
  }) => void
}

export function DocumentPreview({ paragraphs, onTextSelect }: DocumentPreviewProps) {
  const handleMouseUp = (e: React.MouseEvent) => {
    const selection = window.getSelection()
    if (!selection || selection.isCollapsed) return

    const selectedText = selection.toString()
    if (!selectedText.trim()) return

    // Get selection position for popover
    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()

    // Find paragraph and run indices
    const anchorNode = selection.anchorNode
    const focusNode = selection.focusNode

    if (!anchorNode || !focusNode) return

    // Traverse up to find the run element
    let runElement = anchorNode.parentElement
    while (runElement && !runElement.hasAttribute("data-run-index")) {
      runElement = runElement.parentElement
    }

    if (!runElement) return

    const paragraphIndex = Number.parseInt(runElement.getAttribute("data-paragraph-index") || "0")
    const runIndex = Number.parseInt(runElement.getAttribute("data-run-index") || "0")
    const startOffset = selection.anchorOffset
    const endOffset = selection.focusOffset

    onTextSelect?.({
      paragraphIndex,
      runIndex,
      startOffset: Math.min(startOffset, endOffset),
      endOffset: Math.max(startOffset, endOffset),
      selectedText,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    })
  }

  return (
    <div className="h-full overflow-y-auto bg-background" onMouseUp={handleMouseUp}>
      <div className="mx-auto max-w-4xl px-12 py-16">
        <div className="bg-card shadow-lg rounded-lg border border-border min-h-[11in] p-16">
          {paragraphs.map((paragraph, pIndex) => (
            <p
              key={pIndex}
              className={cn(
                "mb-4 leading-relaxed",
                paragraph.alignment === "center" && "text-center",
                paragraph.alignment === "right" && "text-right",
                paragraph.alignment === "justify" && "text-justify",
              )}
            >
              {paragraph.runs.map((run, rIndex) => (
                <span
                  key={rIndex}
                  data-paragraph-index={pIndex}
                  data-run-index={rIndex}
                  className={cn(
                    "select-text cursor-text",
                    run.bold && "font-bold",
                    run.italic && "italic",
                    run.underline && "underline",
                  )}
                  style={{
                    color: run.color || undefined,
                    fontSize: run.fontSize ? `${run.fontSize}pt` : undefined,
                  }}
                >
                  {run.text}
                </span>
              ))}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
