"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Download,
  FileText,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  GitCompare,
  LogOut,
  User,
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
import { healthCheck } from "@/lib/api-client";
import type { VaultValue } from "@/lib/document-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Smart Word Editor - Pagina principale con TipTap
 *
 * VERSIONE 9 - VAULT DINAMICO:
 * - Integrazione con useVaultData hook
 * - Caricamento dati vault dall'API
 * - CRUD entries dalla sidebar
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
    totalEntries: vaultTotalEntries,
    refresh: refreshVault,
    addEntry: addVaultEntry,
    updateEntry: updateVaultEntry,
    deleteEntry: deleteVaultEntry,
  } = useVaultData();

  // Stato UI
  const [hasSelection, setHasSelection] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const [selectedText, setSelectedText] = useState<string | undefined>();
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");

  // Stato dialogs
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [compareViewOpen, setCompareViewOpen] = useState(false);

  // Verifica connessione backend all'avvio
  useEffect(() => {
    const checkBackend = async () => {
      const isOnline = await healthCheck();
      setBackendStatus(isOnline ? "online" : "offline");
    };
    checkBackend();
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

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
      console.log(
        `[Page] Checkbox #${checkboxIndex} → ${newChecked ? "☑" : "☐"}`
      );
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
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Smart Word Editor</h1>
            <p className="text-xs text-muted-foreground">
              Editing controllato con preview live
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <BackendStatus status={backendStatus} />

          {documentState && totalModifications > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>
                {totalModifications} modific
                {totalModifications === 1 ? "a" : "he"}
              </span>
            </div>
          )}

          <div className="relative">
            <input
              type="file"
              accept=".doc,.docx,.odt,.rtf,.txt"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isLoading}
            />
            <Button variant="outline" disabled={isLoading}>
              <Upload className="h-4 w-4 mr-2" />
              {documentState ? "Cambia file" : "Carica documento"}
            </Button>
          </div>

          {documentState && (
            <>
              {/* Bottone Confronta Modifiche */}
              <Button
                variant="outline"
                onClick={() => setCompareViewOpen(true)}
                disabled={isLoading || totalModifications === 0}
                title={
                  totalModifications === 0
                    ? "Nessuna modifica da confrontare"
                    : "Confronta documento originale e modificato"
                }
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Confronta
              </Button>

              <Button
                onClick={() => setDownloadDialogOpen(true)}
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Scarica
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetDocument}
                disabled={isLoading}
                title="Nuovo documento"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-2">
                <User className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">Account</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    {user?.phone_number || "Utente"}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <span className="text-sm">
                  Token disponibili: <strong>{user?.tokens || 0}</strong>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <span className="text-sm">
                  Valori nel vault: <strong>{vaultTotalEntries}</strong>
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/vault")}>
                <FolderOpen className="h-4 w-4 mr-2" />
                Gestisci Vault
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Esci
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
              <EmptyState
                backendStatus={backendStatus}
                onRetryBackend={() => setBackendStatus("checking")}
                onFileUpload={handleFileUpload}
              />
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

function BackendStatus({
  status,
}: {
  status: "checking" | "online" | "offline";
}) {
  if (status === "checking") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
        Connessione...
      </div>
    );
  }

  if (status === "offline") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive">
        <div className="h-2 w-2 rounded-full bg-destructive" />
        Backend offline
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs text-green-600">
      <div className="h-2 w-2 rounded-full bg-green-500" />
      Connesso
    </div>
  );
}

function EmptyState({
  backendStatus,
  onRetryBackend,
  onFileUpload,
}: {
  backendStatus: "checking" | "online" | "offline";
  onRetryBackend: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Nessun documento</h2>
        <p className="text-muted-foreground mb-6">
          Carica un documento per iniziare. Potrai modificare il testo
          direttamente nell&apos;editor e tutte le modifiche verranno
          <strong> automaticamente</strong> applicate al download.
        </p>

        {backendStatus === "offline" && (
          <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-lg mb-4">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            Backend non raggiungibile.
            <Button
              variant="link"
              size="sm"
              className="text-destructive p-0 h-auto ml-2"
              onClick={onRetryBackend}
            >
              Riprova
            </Button>
          </div>
        )}

        <div className="relative inline-block">
          <input
            type="file"
            accept=".doc,.docx,.odt,.rtf,.txt"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={onFileUpload}
            disabled={backendStatus === "offline"}
          />
          <Button size="lg" disabled={backendStatus === "offline"}>
            <Upload className="h-5 w-5 mr-2" />
            Carica documento
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Formati supportati: DOC, DOCX, ODT, RTF, TXT
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          💡 <strong>Novità:</strong> Usa il pulsante &quot;Confronta&quot; per
          vedere un&apos;anteprima side-by-side delle modifiche!
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Caricamento documento...</p>
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
      <div className="text-center max-w-md px-4">
        <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Errore</h2>
        <p className="text-muted-foreground mb-6">{error}</p>
        <Button onClick={onRetry}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Riprova
        </Button>
      </div>
    </div>
  );
}
