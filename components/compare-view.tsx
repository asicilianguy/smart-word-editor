"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Loader2,
  FileText,
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  GitCompare,
  FileCheck,
  Info,
  Highlighter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { getAuthHeaders, removeToken } from "@/lib/auth";

// ============================================================================
// TYPES
// ============================================================================

interface PreviewData {
  original_pdf: string;
  modified_pdf: string;
  affected_pages: number[];
  total_modifications: number;
  total_pages: number;
}

interface CompareViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalFile: File;
  modifications: unknown[];
  checkboxModifications: { checkboxIndex: number; newChecked: boolean }[];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CompareView({
  open,
  onOpenChange,
  originalFile,
  modifications,
  checkboxModifications,
}: CompareViewProps) {
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [originalPdfUrl, setOriginalPdfUrl] = useState<string | null>(null);
  const [modifiedPdfUrl, setModifiedPdfUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(75);
  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [iframeKey, setIframeKey] = useState(0);

  // Refs
  const originalIframeRef = useRef<HTMLIFrameElement>(null);
  const modifiedIframeRef = useRef<HTMLIFrameElement>(null);

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

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      if (originalPdfUrl) URL.revokeObjectURL(originalPdfUrl);
      if (modifiedPdfUrl) URL.revokeObjectURL(modifiedPdfUrl);
    };
  }, [originalPdfUrl, modifiedPdfUrl]);

  // Fetch preview when dialog opens
  useEffect(() => {
    if (open && originalFile) {
      fetchPreview();
      setCurrentPage(1);
      setZoom(75);
      setIframeKey(0);
    }
  }, [open, originalFile]);

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

  // Fetch preview from backend
  const fetchPreview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", originalFile);
      formData.append("modifications", JSON.stringify(modifications));
      formData.append(
        "checkbox_modifications",
        JSON.stringify(checkboxModifications)
      );

      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${API_BASE}/api/documents/preview`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
        },
        body: formData,
      });

      if (response.status === 401) {
        removeToken();
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Errore server: ${response.statusText}`
        );
      }

      const data: PreviewData = await response.json();
      setPreviewData(data);

      // Convert base64 to blob URLs
      const originalBlob = base64ToBlob(data.original_pdf, "application/pdf");
      const modifiedBlob = base64ToBlob(data.modified_pdf, "application/pdf");

      // Revoke old URLs
      if (originalPdfUrl) URL.revokeObjectURL(originalPdfUrl);
      if (modifiedPdfUrl) URL.revokeObjectURL(modifiedPdfUrl);

      // Create new URLs
      setOriginalPdfUrl(URL.createObjectURL(originalBlob));
      setModifiedPdfUrl(URL.createObjectURL(modifiedBlob));

      // Vai alla prima pagina con modifiche se presente
      if (data.affected_pages.length > 0) {
        setCurrentPage(data.affected_pages[0]);
      }
    } catch (err) {
      console.error("Preview fetch error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Errore durante la generazione della preview"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Helper: base64 to Blob
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };

  // Zoom controls
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

  // Navigate to page
  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    setIframeKey((k) => k + 1);
  }, []);

  // Build PDF URL with parameters
  const getPdfUrl = useCallback(
    (baseUrl: string) => {
      const params = [
        "toolbar=0",
        "navpanes=0",
        "scrollbar=1",
        `zoom=${zoom}`,
        "view=Fit",
        `page=${currentPage}`,
      ];
      return `${baseUrl}#${params.join("&")}`;
    },
    [zoom, currentPage]
  );

  // Don't render if not open or not mounted
  if (!open || !mounted) return null;

  const totalPages = previewData?.total_pages || 1;
  const affectedPages = previewData?.affected_pages || [];
  const totalModifications = previewData?.total_modifications || 0;

  // Render fullscreen modal via portal
  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Container - FULLSCREEN */}
      <div
        className="absolute inset-4 bg-background rounded-lg border shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center">
              <GitCompare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Confronta modifiche</h2>
              {!isLoading && !error && previewData && (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {totalModifications} modific
                    {totalModifications === 1 ? "a" : "he"}
                  </span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileCheck className="h-3 w-3" />
                    {affectedPages.length} pagin
                    {affectedPages.length === 1 ? "a" : "e"} coinvolt
                    {affectedPages.length === 1 ? "a" : "e"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomOut}
                disabled={zoom <= 25}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-12 text-center font-medium">
                {zoom}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomReset}
                title="Adatta alla pagina"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

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
        <div className="flex-1 overflow-hidden min-h-0">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={fetchPreview} />
          ) : (
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Original PDF Panel */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full flex flex-col">
                  <div className="px-4 py-2.5 border-b bg-muted/30 shrink-0">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      Documento originale
                    </h3>
                  </div>
                  <div className="flex-1 overflow-hidden bg-muted/20 p-2">
                    {originalPdfUrl ? (
                      <iframe
                        key={`original-${iframeKey}`}
                        ref={originalIframeRef}
                        src={getPdfUrl(originalPdfUrl)}
                        className="w-full h-full border-0 rounded bg-white shadow"
                        title="Documento originale"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        Nessuna preview disponibile
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* Modified PDF Panel */}
              <ResizablePanel defaultSize={50} minSize={30}>
                <div className="h-full flex flex-col">
                  <div className="px-4 py-2.5 border-b bg-amber-50 shrink-0">
                    <h3 className="text-sm font-medium flex items-center gap-2 text-amber-800">
                      <FileText className="h-4 w-4 text-amber-600" />
                      Con le tue modifiche
                      <span className="text-[10px] font-medium bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <Highlighter className="h-3 w-3" />
                        Solo anteprima
                      </span>
                    </h3>
                  </div>
                  <div className="flex-1 overflow-hidden bg-muted/20 p-2">
                    {modifiedPdfUrl ? (
                      <iframe
                        key={`modified-${iframeKey}`}
                        ref={modifiedIframeRef}
                        src={getPdfUrl(modifiedPdfUrl)}
                        className="w-full h-full border-0 rounded bg-white shadow"
                        title="Documento modificato"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        Nessuna preview disponibile
                      </div>
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t bg-card shrink-0">
          {/* Banner informativo evidenziature */}
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Info className="h-4 w-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-amber-800">
                  <strong>
                    Le evidenziature in giallo sono solo per questa anteprima.
                  </strong>{" "}
                  Il documento che scaricherai <strong>non avrà</strong> alcuna
                  evidenziatura: vedrai solo il testo modificato, esattamente
                  come nell'originale.
                </p>
              </div>
            </div>
          </div>

          {/* Azioni */}
          <div className="px-6 py-3 flex items-center justify-between">
            {/* Page Navigation */}
            <div className="flex items-center gap-2">
              {previewData && totalPages > 1 && (
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

                  <div className="flex items-center gap-1">
                    {affectedPages.length > 0 ? (
                      affectedPages.map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "h-8 min-w-[2rem] px-2",
                            currentPage === page
                              ? "bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
                              : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                          )}
                          onClick={() => goToPage(page)}
                        >
                          {page}
                        </Button>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground px-2">
                        Pagina {currentPage} di {totalPages}
                      </span>
                    )}
                  </div>

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

                  <span className="text-xs text-muted-foreground ml-2">
                    {currentPage}/{totalPages}
                  </span>
                </>
              )}
            </div>

            {/* Close button */}
            <Button
              onClick={() => onOpenChange(false)}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
            >
              Ho capito, chiudi
            </Button>
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
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <div className="h-16 w-16 rounded-2xl bg-[var(--brand-primary-subtle)] border border-[var(--brand-primary)]/20 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-primary)]" />
      </div>
      <div className="text-center">
        <p className="font-medium">Generazione preview in corso...</p>
        <p className="text-sm text-muted-foreground mt-1">
          Conversione documenti in PDF
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
        <p className="font-medium mb-2">Errore generazione preview</p>
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
