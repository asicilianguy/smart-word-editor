"use client"

import { useState, useCallback } from "react"
import type { ParsedDocument } from "@/lib/document-types"

export function useDocument() {
  const [document, setDocument] = useState<ParsedDocument | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadDocument = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/parse-docx", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to parse document")
      }

      const parsed = await response.json()
      setDocument(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const replaceText = useCallback(
    (paragraphIndex: number, runIndex: number, startOffset: number, endOffset: number, newText: string) => {
      if (!document) return

      const newParagraphs = [...document.paragraphs]
      const paragraph = newParagraphs[paragraphIndex]
      const run = paragraph.runs[runIndex]

      // Replace the selected portion of text
      const before = run.text.substring(0, startOffset)
      const after = run.text.substring(endOffset)
      run.text = before + newText + after

      setDocument({ ...document, paragraphs: newParagraphs })
    },
    [document],
  )

  const downloadDocument = useCallback(async () => {
    if (!document) return

    try {
      const response = await fetch("/api/generate-docx", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(document),
      })

      if (!response.ok) {
        throw new Error("Failed to generate document")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = window.document.createElement("a")
      a.href = url
      a.download = "document.docx"
      window.document.body.appendChild(a)
      a.click()
      window.document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download document")
    }
  }, [document])

  return {
    document,
    isLoading,
    error,
    uploadDocument,
    replaceText,
    downloadDocument,
  }
}
