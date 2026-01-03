"use client";

import type React from "react";
import { useState, useEffect } from "react";
import {
  Upload,
  Download,
  FileText,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocumentPreview } from "@/components/document-preview";
import { VaultSidebar } from "@/components/vault-sidebar";
import { ReplacePopover } from "@/components/replace-popover";
import { useDocument } from "@/hooks/use-document";
import { vaultData } from "@/lib/vault-data";
import { healthCheck } from "@/lib/api-client";
import type { VaultValue, SelectionRef } from "@/lib/document-types";

/**
 * Smart Word Editor - Pagina principale
 *
 * Workflow:
 * 1. Upload DOCX
 * 2. Visualizza preview
 * 3. Seleziona testo → sostituisci con vault o testo libero
 * 4. Preview si aggiorna immediatamente
 * 5. Download quando soddisfatto
 */
export default function Page() {
  // Stato documento
  const {
    document: documentState,
    content,
    metadata,
    modifications,
    isLoading,
    error,
    uploadDocument,
    replaceText,
    downloadDocument,
    resetDocument,
  } = useDocument();

  // Stato UI
  const [selection, setSelection] = useState<SelectionRef | null>(null);
  const [suggestedValue, setSuggestedValue] = useState<string | undefined>();
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

    // Ricontrolla ogni 30 secondi
    const interval = setInterval(checkBackend, 30000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Gestisce l'upload del file
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Reset selezione e suggerimento
      setSelection(null);
      setSuggestedValue(undefined);
      uploadDocument(file);
    }
    // Reset input per permettere re-upload stesso file
    e.target.value = "";
  };

  /**
   * Gestisce la selezione del testo nel documento
   */
  const handleTextSelect = (sel: SelectionRef) => {
    setSelection(sel);
    // Non resettare il suggestedValue qui, potrebbe essere già stato impostato dal vault
  };

  /**
   * Gestisce il click su un valore del vault
   */
  const handleVaultValueClick = (value: VaultValue) => {
    if (selection) {
      // Se c'è una selezione attiva, applica subito
      replaceText(selection.position, selection.selectedText, value.value);
      setSelection(null);
      setSuggestedValue(undefined);
      window.getSelection()?.removeAllRanges();
    } else {
      // Altrimenti, salva come suggerimento per la prossima selezione
      setSuggestedValue(value.value);
    }
  };

  /**
   * Gestisce la sostituzione dal popover
   */
  const handleReplace = (newText: string) => {
    if (selection) {
      replaceText(selection.position, selection.selectedText, newText);
      setSelection(null);
      setSuggestedValue(undefined);
      window.getSelection()?.removeAllRanges();
    }
  };

  /**
   * Chiude il popover
   */
  const handleClosePopover = () => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

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
          {/* Status backend */}
          <BackendStatus status={backendStatus} />

          {/* Contatore modifiche */}
          {documentState && modifications.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>
                {modifications.length} modific
                {modifications.length === 1 ? "a" : "he"}
              </span>
            </div>
          )}

          {/* Pulsanti azione */}
          {!documentState && (
            <>
              <input
                type="file"
                accept=".docx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
                disabled={isLoading || backendStatus === "offline"}
              />
              <label htmlFor="file-upload">
                <Button
                  asChild
                  disabled={isLoading || backendStatus === "offline"}
                >
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {isLoading ? "Caricamento..." : "Carica DOCX"}
                  </span>
                </Button>
              </label>
            </>
          )}

          {documentState && (
            <>
              <Button
                variant="outline"
                onClick={downloadDocument}
                disabled={isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                Scarica
              </Button>

              <Button
                variant="outline"
                onClick={resetDocument}
                disabled={isLoading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Nuovo
              </Button>

              <input
                type="file"
                accept=".docx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload-replace"
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
          {/* Stato: Nessun documento */}
          {!documentState && !isLoading && !error && (
            <EmptyState
              backendStatus={backendStatus}
              onRetryBackend={() => setBackendStatus("checking")}
            />
          )}

          {/* Stato: Caricamento */}
          {isLoading && <LoadingState />}

          {/* Stato: Errore */}
          {error && !isLoading && (
            <ErrorState error={error} onRetry={resetDocument} />
          )}

          {/* Stato: Documento caricato */}
          {documentState && content && (
            <DocumentPreview
              content={content}
              onTextSelect={handleTextSelect}
            />
          )}
        </div>

        {/* Vault Sidebar - 30% */}
        <div className="flex-[3] overflow-hidden">
          <VaultSidebar
            categories={vaultData}
            onValueClick={handleVaultValueClick}
            hasActiveSelection={selection !== null}
          />
        </div>
      </div>

      {/* Replace Popover */}
      {selection && (
        <ReplacePopover
          selection={selection}
          onReplace={handleReplace}
          onClose={handleClosePopover}
          suggestedValue={suggestedValue}
        />
      )}
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Indicatore stato backend
 */
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

/**
 * Stato vuoto (nessun documento)
 */
function EmptyState({
  backendStatus,
  onRetryBackend,
}: {
  backendStatus: "checking" | "online" | "offline";
  onRetryBackend: () => void;
}) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <FileText className="h-10 w-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-2">Nessun documento</h2>
        <p className="text-muted-foreground mb-6">
          Carica un file DOCX per iniziare. Potrai selezionare il testo e
          sostituirlo con valori dal vault o testo personalizzato.
        </p>

        {backendStatus === "offline" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>Il server backend non è raggiungibile</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Assicurati che il server FastAPI sia in esecuzione su{" "}
              <code className="bg-muted px-1 py-0.5 rounded">
                localhost:8000
              </code>
            </p>
            <Button variant="outline" onClick={onRetryBackend}>
              Riprova connessione
            </Button>
          </div>
        ) : (
          <label htmlFor="file-upload">
            <Button size="lg" asChild disabled={backendStatus === "checking"}>
              <span>
                <Upload className="h-5 w-5 mr-2" />
                Carica file DOCX
              </span>
            </Button>
          </label>
        )}
      </div>
    </div>
  );
}

/**
 * Stato caricamento
 */
function LoadingState() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Caricamento documento...</p>
        <p className="text-xs text-muted-foreground mt-1">
          Parsing e analisi della struttura in corso
        </p>
      </div>
    </div>
  );
}

/**
 * Stato errore
 */
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
        <div className="space-x-2">
          <Button variant="outline" onClick={onRetry}>
            Riprova
          </Button>
          <label htmlFor="file-upload">
            <Button asChild>
              <span>Carica altro file</span>
            </Button>
          </label>
        </div>
      </div>
    </div>
  );
}
