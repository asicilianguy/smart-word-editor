"use client"

import type React from "react"

import { useState } from "react"
import { Upload, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DocumentPreview } from "@/components/document-preview"
import { VaultSidebar } from "@/components/vault-sidebar"
import { ReplacePopover } from "@/components/replace-popover"
import { useDocument } from "@/hooks/use-document"
import { vaultData } from "@/lib/vault-data"
import type { VaultValue } from "@/lib/document-types"

export default function Page() {
  const { document, isLoading, error, uploadDocument, replaceText, downloadDocument } = useDocument()

  const [selection, setSelection] = useState<{
    paragraphIndex: number
    runIndex: number
    startOffset: number
    endOffset: number
    selectedText: string
    x: number
    y: number
  } | null>(null)

  const [suggestedValue, setSuggestedValue] = useState<string | undefined>()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      uploadDocument(file)
    }
  }

  const handleTextSelect = (sel: {
    paragraphIndex: number
    runIndex: number
    startOffset: number
    endOffset: number
    selectedText: string
    x: number
    y: number
  }) => {
    setSelection(sel)
    setSuggestedValue(undefined)
  }

  const handleVaultValueClick = (value: VaultValue) => {
    if (selection) {
      // Apply the vault value immediately
      replaceText(selection.paragraphIndex, selection.runIndex, selection.startOffset, selection.endOffset, value.value)
      setSelection(null)
      setSuggestedValue(undefined)
      window.getSelection()?.removeAllRanges()
    } else {
      // Store as suggested value for next selection
      setSuggestedValue(value.value)
    }
  }

  const handleReplace = (newText: string) => {
    if (selection) {
      replaceText(selection.paragraphIndex, selection.runIndex, selection.startOffset, selection.endOffset, newText)
      setSelection(null)
      setSuggestedValue(undefined)
      window.getSelection()?.removeAllRanges()
    }
  }

  const handleClosePopover = () => {
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Smart Word Editor</h1>
            <p className="text-xs text-muted-foreground">Document editing with live preview</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!document && (
            <>
              <input
                type="file"
                accept=".docx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isLoading}
              />
              <label htmlFor="file-upload">
                <Button asChild disabled={isLoading}>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {isLoading ? "Loading..." : "Upload DOCX"}
                  </span>
                </Button>
              </label>
            </>
          )}

          {document && (
            <>
              <Button variant="outline" onClick={downloadDocument}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <label htmlFor="file-upload">
                <Button variant="outline" asChild disabled={isLoading}>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Replace File
                  </span>
                </Button>
              </label>
              <input
                type="file"
                accept=".docx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isLoading}
              />
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Preview - 70% */}
        <div className="flex-[7] overflow-hidden">
          {!document && !isLoading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md px-4">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">No Document Loaded</h2>
                <p className="text-muted-foreground mb-6">
                  Upload a DOCX file to start editing with live preview and vault-based text replacement.
                </p>
                <label htmlFor="file-upload">
                  <Button size="lg" asChild>
                    <span>
                      <Upload className="h-5 w-5 mr-2" />
                      Upload DOCX File
                    </span>
                  </Button>
                </label>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading document...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md px-4">
                <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-destructive" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Error Loading Document</h2>
                <p className="text-muted-foreground mb-6">{error}</p>
                <label htmlFor="file-upload">
                  <Button variant="outline" asChild>
                    <span>Try Again</span>
                  </Button>
                </label>
              </div>
            </div>
          )}

          {document && <DocumentPreview paragraphs={document.paragraphs} onTextSelect={handleTextSelect} />}
        </div>

        {/* Vault Sidebar - 30% */}
        <div className="flex-[3] overflow-hidden">
          <VaultSidebar categories={vaultData} onValueClick={handleVaultValueClick} />
        </div>
      </div>

      {/* Replace Popover */}
      {selection && (
        <ReplacePopover
          x={selection.x}
          y={selection.y}
          selectedText={selection.selectedText}
          onReplace={handleReplace}
          onClose={handleClosePopover}
          suggestedValue={suggestedValue}
        />
      )}
    </div>
  )
}
