"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Loader2,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowRight,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [zoom, setZoom] = useState(75); // Default più basso per vedere la pagina intera
  const [iframeKey, setIframeKey] = useState(0);

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
    setZoom(75); // Reset a default "fit page"

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

      // Convert base64 to blob URL
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

  const handleZoomIn = () => {
    setZoom((z) => Math.min(z + 25, 200));
    setIframeKey((k) => k + 1);
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 25, 25));
    setIframeKey((k) => k + 1);
  };

  const handleZoomReset = () => {
    setZoom(75);
    setIframeKey((k) => k + 1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    setIframeKey((k) => k + 1);
  };

  const getPdfUrl = (baseUrl: string) => {
    // Usa "Fit" per far entrare la pagina intera nella vista
    const params = [
      "toolbar=0",
      "navpanes=0",
      "scrollbar=1",
      `zoom=${zoom}`,
      "view=Fit", // Fit intera pagina invece di FitH
      `page=${currentPage}`,
    ];
    return `${baseUrl}#${params.join("&")}`;
  };

  const handleContinue = () => {
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
      <div className="absolute inset-4 md:inset-8 lg:inset-12 bg-background rounded-lg border shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Anteprima documento</h2>
              {previewData && (
                <p className="text-sm text-muted-foreground">
                  {previewData.file_name} · {totalPages} pagin
                  {totalPages === 1 ? "a" : "e"}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-9 w-9"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={generatePreview} />
          ) : pdfUrl ? (
            <div className="flex-1 overflow-hidden bg-muted/30 flex items-center justify-center p-4">
              <iframe
                key={iframeKey}
                src={getPdfUrl(pdfUrl)}
                className="w-full h-full border-0 rounded-lg shadow-lg bg-white"
                title="Anteprima documento"
              />
            </div>
          ) : null}
        </div>

        {/* Footer con banner prominente */}
        <footer className="border-t bg-card shrink-0">
          {/* Banner informativo prominente */}
          <div className="bg-[var(--brand-primary)] text-white px-6 py-4">
            <div className="flex items-start gap-4 max-w-3xl mx-auto">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-base">
                  ✓ Documento caricato correttamente
                </p>
                <p className="text-white/90 text-sm mt-1 leading-relaxed">
                  Questo è esattamente come apparirà il tuo documento finale
                  dopo il download. Nell'editor vedrai una{" "}
                  <strong>vista semplificata</strong> per facilitare le
                  modifiche, ma tutte le formattazioni originali verranno
                  preservate.
                </p>
              </div>
            </div>
          </div>

          {/* Azioni */}
          <div className="px-6 py-4 flex items-center justify-between bg-muted/30">
            {/* Page navigation */}
            <div className="flex items-center gap-2">
              {totalPages > 1 && !isLoading && !error && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => goToPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground px-2 min-w-[80px] text-center">
                    Pagina {currentPage} di {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      goToPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage >= totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Bottoni azione */}
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
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function LoadingState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4">
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
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
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
