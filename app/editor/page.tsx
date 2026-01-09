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
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TipTapEditor,
  type TipTapEditorHandle,
} from "@/components/tiptap-editor";
import { VaultSidebar } from "@/components/vault-sidebar";
import {
  DownloadDialog,
  type DownloadFormat,
} from "@/components/download-dialog";
import { CompareView } from "@/components/compare-view";
import { DemoOnboardingDialog } from "@/components/demo-onboarding-dialog";
import {
  DocumentUploadPreviewDialog,
  shouldSkipUploadPreview,
} from "@/components/document-upload-preview-dialog";
import { useDocument } from "@/hooks/use-document";
import { useVaultData } from "@/hooks/use-vault-data";
import { useAuth } from "@/lib/auth-context";
import type { VaultValue } from "@/lib/document-types";
import { cn } from "@/lib/utils";

/**
 * CompilaloEasy - Editor Page
 *
 * Accessibile a tutti:
 * - Non autenticati: demo completa con dati mock interattivi
 * - Autenticati: accesso completo al vault personale
 *
 * Flusso upload:
 * 1. Utente seleziona file
 * 2. Mostra anteprima PDF del documento originale
 * 3. Utente conferma → carica documento nell'editor
 * 4. Mostra onboarding (solo prima volta in demo)
 */
export default function EditorPage() {
  const router = useRouter();

  // Auth context
  const { user, isAuthenticated, logout, isLoading: authLoading } = useAuth();

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
    isDemo,
    isEmpty: isVaultEmpty,
    isLoading: isVaultLoading,
    error: vaultError,
    demoEntriesCount,
    refresh: refreshVault,
    addEntry: addVaultEntry,
  } = useVaultData();

  // Stato UI
  const [hasSelection, setHasSelection] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const [selectedText, setSelectedText] = useState<string | undefined>();

  // Stato upload preview
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showUploadPreview, setShowUploadPreview] = useState(false);

  // Stato dialogs
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [compareViewOpen, setCompareViewOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  /**
   * Gestisce la selezione del file
   * Salva il file e mostra l'anteprima PDF prima di procedere
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Controlla se l'utente ha scelto di saltare l'anteprima
      if (shouldSkipUploadPreview()) {
        // Carica direttamente senza mostrare l'anteprima
        uploadDocument(file);

        // Mostra onboarding in demo mode (solo se non l'ha già visto)
        if (isDemo && typeof window !== "undefined") {
          const hasSeenOnboarding = localStorage.getItem(
            "demo_onboarding_seen"
          );
          if (!hasSeenOnboarding) {
            setTimeout(() => setShowOnboarding(true), 600);
          }
        }
      } else {
        // Mostra l'anteprima
        setUploadedFile(file);
        setShowUploadPreview(true);
      }
    }
    e.target.value = "";
  };

  /**
   * Gestisce il click su "Continua" dopo l'anteprima
   * Carica effettivamente il documento e mostra l'onboarding
   */
  const handleContinueAfterPreview = useCallback(() => {
    if (uploadedFile) {
      uploadDocument(uploadedFile);

      // Mostra onboarding in demo mode (solo se non l'ha già visto)
      if (isDemo && typeof window !== "undefined") {
        const hasSeenOnboarding = localStorage.getItem("demo_onboarding_seen");
        if (!hasSeenOnboarding) {
          setTimeout(() => setShowOnboarding(true), 600);
        }
      }
    }
    setUploadedFile(null);
  }, [uploadedFile, uploadDocument, isDemo]);

  /**
   * Gestisce la chiusura dell'anteprima upload
   */
  const handleUploadPreviewClose = (open: boolean) => {
    setShowUploadPreview(open);
    if (!open) {
      setUploadedFile(null);
    }
  };

  /**
   * Gestisce la chiusura dell'onboarding
   */
  const handleOnboardingClose = (open: boolean) => {
    setShowOnboarding(open);
    if (!open && typeof window !== "undefined") {
      localStorage.setItem("demo_onboarding_seen", "true");
    }
  };

  const handleSelectionChange = useCallback(
    (selection: boolean, cursor: boolean, text?: string) => {
      setHasSelection(selection);
      setHasCursor(cursor);
      setSelectedText(text);
    },
    []
  );

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

  const handleCheckboxToggle = useCallback(
    (checkboxIndex: number, newChecked: boolean) => {
      registerCheckboxModification(checkboxIndex, newChecked);
    },
    [registerCheckboxModification]
  );

  /**
   * Gestisce il download
   * Chiamato solo se l'utente è autenticato (il dialog blocca altrimenti)
   */
  const handleDownload = useCallback(
    async (fileName: string, format: DownloadFormat) => {
      setIsDownloading(true);
      try {
        await downloadDocument(fileName, format);
        setDownloadDialogOpen(false);
      } catch (err) {
        console.error("Download error:", err);
        throw err;
      } finally {
        setIsDownloading(false);
      }
    },
    [downloadDocument]
  );

  const handleLogoClick = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 flex-shrink-0">
        {/* Logo */}
        <button
          onClick={handleLogoClick}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <div className="h-8 w-8 rounded-lg bg-(--brand-primary) flex items-center justify-center">
            <span className="text-white font-semibold text-xs">CE</span>
          </div>
          <h1 className="text-base font-semibold">
            Compilalo<span className="text-[var(--brand-primary)]">Easy</span>
          </h1>
        </button>

        {/* Azioni */}
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
                <span className="hidden sm:inline">Confronta</span>
              </Button>

              <Button
                size="sm"
                onClick={() => setDownloadDialogOpen(true)}
                disabled={isLoading}
                className="bg-(--brand-primary) hover:bg-[var(--brand-primary-hover)]"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Scarica</span>
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
          {authLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isAuthenticated ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user?.phone_number || "Utente"}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/vault")}
              >
                <FolderOpen className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">I miei dati</span>
              </Button>

              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => router.push("/auth")}
              className="bg-(--brand-primary) hover:bg-[var(--brand-primary-hover)]"
            >
              <User className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Accedi</span>
            </Button>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area - 70% */}
        <div className="flex-[7] overflow-hidden">
          {!documentState && !isLoading && !error && (
            <EmptyState onFileUpload={handleFileUpload} isDemo={isDemo} />
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
            isDemo={isDemo}
            isEmpty={isVaultEmpty}
            isLoading={isVaultLoading}
            error={vaultError}
            demoEntriesCount={demoEntriesCount}
            onAddEntry={addVaultEntry}
            onRefresh={refreshVault}
            onAuthClick={() => router.push("/auth")}
            onManageVaultClick={() => router.push("/vault")}
          />
        </div>
      </div>

      {/* Document Upload Preview Dialog */}
      <DocumentUploadPreviewDialog
        open={showUploadPreview}
        onOpenChange={handleUploadPreviewClose}
        file={uploadedFile}
        onContinue={handleContinueAfterPreview}
      />

      {/* Download Dialog */}
      {documentState && (
        <DownloadDialog
          open={downloadDialogOpen}
          onOpenChange={setDownloadDialogOpen}
          defaultFileName={documentState.metadata.file_name}
          onDownload={handleDownload}
          isLoading={isDownloading}
          isAuthenticated={isAuthenticated}
          onAuthClick={() => {
            setDownloadDialogOpen(false);
            router.push("/auth");
          }}
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

      {/* Demo Onboarding Dialog */}
      <DemoOnboardingDialog
        open={showOnboarding}
        onOpenChange={handleOnboardingClose}
      />
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function EmptyState({
  onFileUpload,
  isDemo,
}: {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isDemo?: boolean;
}) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="h-20 w-20 rounded-2xl bg-[var(--brand-primary-subtle)] border border-[var(--brand-primary)]/20 flex items-center justify-center mx-auto mb-6">
          <FileText className="h-10 w-10 text-[var(--brand-primary)]" />
        </div>

        <h2 className="text-2xl font-semibold mb-3 text-foreground">
          {isDemo ? "Prova subito!" : "Carica un documento"}
        </h2>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          {isDemo ? (
            <>
              Carica un documento Word e usa i dati sulla destra per compilarlo
              velocemente.
              <br />
              <span className="text-sm text-[var(--brand-primary)]">
                È una demo, niente viene salvato.
              </span>
            </>
          ) : (
            <>
              Trascina qui il tuo file oppure clicca per selezionarlo.
              <br />
              <span className="text-sm">
                Potrai modificarlo e scaricarlo nel formato che preferisci.
              </span>
            </>
          )}
        </p>

        <div className="relative inline-block">
          <input
            type="file"
            accept=".doc,.docx,.odt,.rtf,.txt"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={onFileUpload}
          />
          <Button
            size="lg"
            className={cn(
              "bg-(--brand-primary) hover:bg-[var(--brand-primary-hover)]",
              "shadow-lg hover:shadow-xl hover:-translate-y-0.5",
              "transition-all duration-200"
            )}
          >
            <Upload className="h-5 w-5 mr-2" />
            {isDemo ? "Carica documento di prova" : "Seleziona file"}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          Formati supportati: DOC, DOCX, ODT, RTF, TXT
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-primary)] mx-auto mb-4" />
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
      <div className="text-center max-w-sm px-6">
        <div className="h-16 w-16 rounded-xl bg-[var(--error-bg)] border border-[var(--error-border)] flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="h-8 w-8 text-[var(--error)]" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Qualcosa è andato storto</h2>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" onClick={onRetry}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Riprova
        </Button>
      </div>
    </div>
  );
}
