"use client";

import type React from "react";
import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Download,
  FileText,
  RotateCcw,
  AlertCircle,
  Loader2,
  GitCompare,
  LogOut,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TipTapEditor,
  type TipTapEditorHandle,
} from "@/components/tiptap-editor";
import { VaultSidebar } from "@/components/vault-sidebar";
import { PreviewInfoBanner } from "@/components/preview-info-banner";
import {
  DownloadDialog,
  type DownloadFormat,
} from "@/components/download-dialog";
import { CompareView } from "@/components/compare-view";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useDocument } from "@/hooks/use-document";
import { useVaultData } from "@/hooks/use-vault-data";
import { useAuth } from "@/lib/auth-context";
import type { VaultValue } from "@/lib/document-types";

/**
 * Smart Word Editor - Pagina principale
 */
export default function Page() {
  return (
    <ProtectedRoute>
      <EditorPage />
    </ProtectedRoute>
  );
}

function EditorPage() {
  const router = useRouter();

  // Auth context
  const { user, logout } = useAuth();

  // Ref all'editor TipTap
  const editorRef = useRef<TipTapEditorHandle>(null);

  // Stato documento
  const {
    document: documentState,
    tiptapContent,
    totalModifications,
    currentTextModifications,
    currentCheckboxModifications,
    isLoading,
    error,
    uploadDocument,
    handleTiptapChange,
    registerCheckboxModification,
    downloadDocument,
    resetDocument,
  } = useDocument();

  // Vault data hook
  const {
    categories: vaultCategories,
    isAuthenticated: isVaultAuthenticated,
    isEmpty: isVaultEmpty,
    isLoading: isVaultLoading,
    error: vaultError,
    refresh: refreshVault,
    addEntry: addVaultEntry,
  } = useVaultData();

  // Stato UI
  const [hasSelection, setHasSelection] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const [selectedText, setSelectedText] = useState<string | undefined>();

  // Stato dialogs
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [compareViewOpen, setCompareViewOpen] = useState(false);

  /**
   * Gestisce l'upload del file
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadDocument(file);
    }
    e.target.value = "";
  };

  /**
   * Gestisce il cambio di stato della selezione nell'editor
   */
  const handleSelectionChange = useCallback(
    (selection: boolean, cursor: boolean, text?: string) => {
      setHasSelection(selection);
      setHasCursor(cursor);
      setSelectedText(text);
    },
    []
  );

  /**
   * Gestisce il click su un valore del vault
   */
  const handleVaultValueClick = useCallback(
    (value: VaultValue) => {
      if (!editorRef.current) return;

      if (hasSelection && selectedText) {
        editorRef.current.replaceSelection(value.value);
      } else if (hasCursor) {
        editorRef.current.insertText(value.value);
      }

      editorRef.current.focus();
    },
    [hasSelection, hasCursor, selectedText]
  );

  /**
   * Gestisce il toggle di una checkbox
   */
  const handleCheckboxToggle = useCallback(
    (checkboxIndex: number, newChecked: boolean) => {
      registerCheckboxModification(checkboxIndex, newChecked);
    },
    [registerCheckboxModification]
  );

  /**
   * Gestisce il download con dialog
   */
  const handleDownload = useCallback(
    async (fileName: string, format: DownloadFormat) => {
      setIsDownloading(true);
      try {
        await downloadDocument(fileName, format);
        setDownloadDialogOpen(false);
      } catch (err) {
        console.error("Download error:", err);
      } finally {
        setIsDownloading(false);
      }
    },
    [downloadDocument]
  );

  /**
   * Naviga al login
   */
  const handleLoginClick = useCallback(() => {
    router.push("/auth/login");
  }, [router]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0">
        {/* Logo e titolo */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-muted border border-border flex items-center justify-center">
            <FileText className="h-4 w-4 text-foreground" />
          </div>
          <h1 className="text-base font-semibold">Smart Word Editor</h1>
        </div>

        {/* Azioni documento + utente */}
        <div className="flex items-center gap-3">
          {/* Contatore modifiche */}
          {documentState && totalModifications > 0 && (
            <span className="text-xs text-muted-foreground">
              {totalModifications} modific
              {totalModifications === 1 ? "a" : "he"}
            </span>
          )}

          {/* Azioni documento */}
          {documentState && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompareViewOpen(true)}
                disabled={isLoading || totalModifications === 0}
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Confronta
              </Button>

              <Button
                size="sm"
                onClick={() => setDownloadDialogOpen(true)}
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Scarica
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={resetDocument}
                disabled={isLoading}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Separatore */}
          <div className="h-5 w-px bg-border" />

          {/* Sezione utente */}
          <span className="text-sm text-muted-foreground">
            {user?.phone_number || "Utente"}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/vault")}
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Gestisci dati
          </Button>

          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-2" />
            Esci
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Info banner */}
        {documentState && <PreviewInfoBanner />}

        <div className="flex-1 flex overflow-hidden">
          {/* Editor Area - 70% */}
          <div className="flex-[7] overflow-hidden">
            {!documentState && !isLoading && !error && (
              <EmptyState onFileUpload={handleFileUpload} />
            )}

            {isLoading && <LoadingState />}

            {error && !isLoading && (
              <ErrorState error={error} onRetry={resetDocument} />
            )}

            {documentState && tiptapContent && (
              <TipTapEditor
                key={documentState.metadata.file_name}
                ref={editorRef}
                initialContent={tiptapContent}
                onContentChange={handleTiptapChange}
                onSelectionChange={handleSelectionChange}
                onCheckboxToggle={handleCheckboxToggle}
              />
            )}
          </div>

          {/* Vault Sidebar - 30% */}
          <div className="flex-[3] overflow-hidden">
            <VaultSidebar
              categories={vaultCategories}
              onValueClick={handleVaultValueClick}
              hasSelection={hasSelection}
              hasCursor={hasCursor}
              selectedText={selectedText}
              isAuthenticated={isVaultAuthenticated}
              isEmpty={isVaultEmpty}
              isLoading={isVaultLoading}
              error={vaultError}
              onAddEntry={addVaultEntry}
              onRefresh={refreshVault}
              onLoginClick={handleLoginClick}
            />
          </div>
        </div>
      </div>

      {/* Download Dialog */}
      {documentState && (
        <DownloadDialog
          open={downloadDialogOpen}
          onOpenChange={setDownloadDialogOpen}
          defaultFileName={documentState.metadata.file_name}
          onDownload={handleDownload}
          isLoading={isDownloading}
        />
      )}

      {/* Compare View Dialog */}
      {documentState && (
        <CompareView
          open={compareViewOpen}
          onOpenChange={setCompareViewOpen}
          originalFile={documentState.originalFile}
          modifications={currentTextModifications}
          checkboxModifications={currentCheckboxModifications}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function EmptyState({
  onFileUpload,
}: {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <div className="h-16 w-16 rounded-md bg-muted border border-border flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Nessun documento</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Carica un documento per iniziare. Le modifiche vengono applicate al
          momento del download.
        </p>

        <div className="relative inline-block">
          <input
            type="file"
            accept=".doc,.docx,.odt,.rtf,.txt"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={onFileUpload}
          />
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Carica documento
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Formati: DOC, DOCX, ODT, RTF, TXT
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Caricamento...</p>
      </div>
    </div>
  );
}

function ErrorState({
  error,
  onRetry,
}: {
  error: string;
  onRetry: () => void;
}) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <div className="h-16 w-16 rounded-md bg-destructive/10 border border-destructive/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Errore</h2>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button variant="secondary" onClick={onRetry}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Riprova
        </Button>
      </div>
    </div>
  );
}
