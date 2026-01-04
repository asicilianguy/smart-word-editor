"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  Download,
  FileText,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TipTapEditor,
  type TipTapEditorHandle,
} from "@/components/tiptap-editor";
import { VaultSidebar } from "@/components/vault-sidebar";
import { useDocument } from "@/hooks/use-document";
import { vaultData } from "@/lib/vault-data";
import { healthCheck } from "@/lib/api-client";
import type { VaultValue } from "@/lib/document-types";

/**
 * Smart Word Editor - Pagina principale con TipTap
 */
export default function Page() {
  // Ref all'editor TipTap
  const editorRef = useRef<TipTapEditorHandle>(null);

  // Stato documento
  const {
    document: documentState,
    tiptapContent,
    modifications,
    isLoading,
    error,
    uploadDocument,
    handleTiptapChange,
    registerReplacement,
    downloadDocument,
    resetDocument,
  } = useDocument();

  // Stato UI
  const [hasSelection, setHasSelection] = useState(false);
  const [hasCursor, setHasCursor] = useState(false);
  const [selectedText, setSelectedText] = useState<string | undefined>();
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");

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
        // C'è una selezione → sostituisci e registra
        editorRef.current.replaceSelection(value.value);

        // IMPORTANTE: Registra la sostituzione per il backend
        registerReplacement(selectedText, value.value);
      } else if (hasCursor) {
        // Solo cursore → inserisci (nessuna registrazione necessaria)
        editorRef.current.insertText(value.value);
      }

      // Rimetti il focus sull'editor
      editorRef.current.focus();
    },
    [hasSelection, hasCursor, selectedText, registerReplacement]
  );

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

          {documentState && modifications.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>
                {modifications.length} modific
                {modifications.length === 1 ? "a" : "he"}
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
              <Button onClick={downloadDocument} disabled={isLoading}>
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
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Info banner per immagini */}
        {documentState && (
          <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800 px-6 py-2">
            <p className="text-xs text-amber-700 dark:text-amber-400 text-center">
              <span className="font-medium">Nota:</span> Le immagini e la
              formattazione complessa non sono visibili nell'anteprima, ma
              vengono <strong>preservate</strong> nel documento scaricato.
            </p>
          </div>
        )}

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
              />
            )}
          </div>

          {/* Vault Sidebar - 30% */}
          <div className="flex-[3] overflow-hidden">
            <VaultSidebar
              categories={vaultData}
              onValueClick={handleVaultValueClick}
              hasSelection={hasSelection}
              hasCursor={hasCursor}
              selectedText={selectedText}
            />
          </div>
        </div>
      </div>
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
          direttamente come in un editor di testo, o inserire valori dal vault.
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
        <p className="text-xs text-muted-foreground">
          💡 Clicca nel documento per posizionare il cursore, seleziona per
          sostituire
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
