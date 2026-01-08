"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  Eye,
  MousePointer2,
  Replace,
  PlusCircle,
  Sparkles,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface DocumentUploadPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onContinue: () => void;
}

interface PreviewData {
  pdf: string;
  total_pages: number;
  file_name: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const STORAGE_KEY = "skip_upload_preview";

export function DocumentUploadPreviewDialog({
  open,
  onOpenChange,
  file,
  onContinue,
}: DocumentUploadPreviewDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Cleanup URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // Generate preview when file changes
  useEffect(() => {
    if (open && file) {
      generatePreview();
    }
  }, [open, file]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  const generatePreview = async () => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setCurrentPage(1);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `${API_BASE_URL}/api/documents/preview-upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Errore server: ${response.statusText}`
        );
      }

      const data: PreviewData = await response.json();
      setPreviewData(data);

      const pdfBlob = base64ToBlob(data.pdf, "application/pdf");
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      setPdfUrl(URL.createObjectURL(pdfBlob));
    } catch (err) {
      console.error("Preview generation error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Errore durante la generazione dell'anteprima"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const getPdfUrl = (baseUrl: string) => {
    // Fit: adatta il documento al contenitore
    // L'utente può zoomare con touchpad/scroll
    const params = [
      "toolbar=0",
      "navpanes=0",
      "scrollbar=1",
      "view=Fit",
      `page=${currentPage}`,
    ];
    return `${baseUrl}#${params.join("&")}`;
  };

  const handleContinue = () => {
    // Salva preferenza se selezionata
    if (dontShowAgain && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    onOpenChange(false);
    onContinue();
  };

  if (!open || !mounted) return null;

  const totalPages = previewData?.total_pages || 1;

  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Container */}
      <div className="absolute inset-4 md:inset-6 lg:inset-8 bg-background rounded-lg border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Pronto per iniziare!</h2>
              {previewData && (
                <p className="text-sm text-muted-foreground">
                  {previewData.file_name} · {totalPages} pagin
                  {totalPages === 1 ? "a" : "e"}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-9 w-9"
          >
            <X className="h-5 w-5" />
          </Button>
        </header>

        {/* Content - Split view */}
        <div className="flex-1 overflow-hidden min-h-0 flex">
          {/* Left: PDF Preview */}
          <div className="flex-[3] flex flex-col border-r">
            {/* PDF Content */}
            <div className="flex-1 overflow-hidden">
              {isLoading ? (
                <LoadingState />
              ) : error ? (
                <ErrorState error={error} onRetry={generatePreview} />
              ) : pdfUrl ? (
                <div className="h-full bg-muted/30 p-3">
                  <iframe
                    key={currentPage}
                    src={getPdfUrl(pdfUrl)}
                    className="w-full h-full border-0 rounded-lg shadow-lg bg-white"
                    title="Anteprima documento"
                  />
                </div>
              ) : null}
            </div>

            {/* Page navigation */}
            {totalPages > 1 && !isLoading && !error && (
              <div className="px-4 py-2 border-t bg-muted/30 flex items-center justify-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage <= 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    goToPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage >= totalPages}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Right: Tutorial */}
          <div className="flex-[2] flex flex-col overflow-hidden bg-gradient-to-b from-muted/30 to-muted/10">
            <div className="flex-1 overflow-y-auto p-6">
              {/* Success banner */}
              <div className="bg-[var(--brand-primary)] text-white rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Documento caricato!</p>
                    <p className="text-sm text-white/90">
                      Il file è stato processato correttamente
                    </p>
                  </div>
                </div>
              </div>

              {/* Tutorial title */}
              <div className="mb-5">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" />
                  Come funziona
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Ecco cosa puoi fare nell'editor
                </p>
              </div>

              {/* Features list */}
              <div className="space-y-4">
                {/* Feature 1: Inserimento libero */}
                <FeatureCard
                  icon={<MousePointer2 className="h-4 w-4" />}
                  iconBg="bg-blue-100 text-blue-600"
                  title="Clicca e scrivi"
                  description="Clicca in qualsiasi punto del documento e inizia a digitare, esattamente come in Word."
                />

                {/* Feature 2: Inserimento da sidebar */}
                <FeatureCard
                  icon={<Database className="h-4 w-4" />}
                  iconBg="bg-[var(--brand-primary-subtle)] text-[var(--brand-primary)]"
                  title="Inserisci dalla sidebar"
                  description="Posiziona il cursore e clicca un valore dalla sidebar: verrà inserito automaticamente."
                />

                {/* Feature 3: Selezione e sostituzione */}
                <FeatureCard
                  icon={<Replace className="h-4 w-4" />}
                  iconBg="bg-amber-100 text-amber-600"
                  title="Seleziona e sostituisci"
                  description="Seleziona del testo e scrivi per sostituirlo, oppure clicca un valore dalla sidebar per rimpiazzarlo."
                  highlight
                />

                {/* Feature 4: Salva nella sidebar */}
                <FeatureCard
                  icon={<PlusCircle className="h-4 w-4" />}
                  iconBg="bg-emerald-100 text-emerald-600"
                  title="Salva per riutilizzare"
                  description="Seleziona del testo e aggiungilo alla sidebar con un click: potrai riusarlo in altri documenti."
                />
              </div>

              {/* Note about simplified view */}
              <div className="mt-6 p-3 bg-muted/50 rounded-lg border border-border/50">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Nota:</strong> Nell'editor
                  vedrai una vista semplificata per facilitare le modifiche. Il
                  documento scaricato manterrà la formattazione originale.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-4 border-t bg-card flex items-center justify-between shrink-0">
          {/* Don't show again checkbox */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="dontShowAgain"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked === true)}
            />
            <label
              htmlFor="dontShowAgain"
              className="text-sm text-muted-foreground cursor-pointer select-none"
            >
              Non mostrare più questa schermata
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>

            <Button
              onClick={handleContinue}
              disabled={isLoading || !!error}
              size="lg"
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] px-6"
            >
              Inizia a modificare
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// FEATURE CARD COMPONENT
// ============================================================================

function FeatureCard({
  icon,
  iconBg,
  title,
  description,
  highlight = false,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex gap-3 p-3 rounded-lg transition-colors ${
        highlight
          ? "bg-amber-50 border border-amber-200"
          : "bg-background border border-border/50 hover:border-border"
      }`}
    >
      <div
        className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LoadingState() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <div className="h-16 w-16 rounded-2xl bg-[var(--brand-primary-subtle)] border border-[var(--brand-primary)]/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
      </div>
      <div className="text-center">
        <p className="font-medium">Generazione anteprima...</p>
        <p className="text-sm text-muted-foreground mt-1">
          Stiamo preparando il tuo documento
        </p>
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
    <div className="h-full flex flex-col items-center justify-center gap-4 p-8">
      <div className="h-16 w-16 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="text-center max-w-md">
        <p className="font-medium mb-2">Errore generazione anteprima</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button
          onClick={onRetry}
          className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Riprova
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY: Check if should skip preview
// ============================================================================

export function shouldSkipUploadPreview(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function resetUploadPreviewPreference(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
