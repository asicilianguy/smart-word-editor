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
  Eye,
  Type,
  CheckSquare,
  Trash2,
  PlusCircle,
  RefreshCw,
  MousePointerClick,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

// ============================================================================
// TYPES
// ============================================================================

interface ModificationSummary {
  index: number;
  type: "INSERT" | "DELETE" | "REPLACE" | "CHECKBOX";
  location: string;
  original: string;
  new: string;
  page?: number;
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
  const [originalPdfUrl, setOriginalPdfUrl] = useState<string | null>(null);
  const [modifiedPdfUrl, setModifiedPdfUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<ModificationSummary[]>([]);
  const [zoom, setZoom] = useState(100);
  const [showSidebar, setShowSidebar] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedModIndex, setSelectedModIndex] = useState<number | null>(null);

  // Chiave per forzare re-render degli iframe
  const [iframeKey, setIframeKey] = useState(0);
  const [targetPage, setTargetPage] = useState<number | null>(null);

  // Refs
  const originalIframeRef = useRef<HTMLIFrameElement>(null);
  const modifiedIframeRef = useRef<HTMLIFrameElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

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
      setSelectedModIndex(null);
      setTargetPage(null);
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
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `Errore server: ${response.statusText}`
        );
      }

      const data = await response.json();

      // Convert base64 to blob URLs
      const originalBlob = base64ToBlob(data.original_pdf, "application/pdf");
      const modifiedBlob = base64ToBlob(data.modified_pdf, "application/pdf");

      // Revoke old URLs
      if (originalPdfUrl) URL.revokeObjectURL(originalPdfUrl);
      if (modifiedPdfUrl) URL.revokeObjectURL(modifiedPdfUrl);

      // Create new URLs
      setOriginalPdfUrl(URL.createObjectURL(originalBlob));
      setModifiedPdfUrl(URL.createObjectURL(modifiedBlob));
      setSummary(data.modifications_summary || []);
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
    // Forza refresh per applicare nuovo zoom
    setIframeKey((k) => k + 1);
  };

  const handleZoomOut = () => {
    setZoom((z) => Math.max(z - 25, 50));
    setIframeKey((k) => k + 1);
  };

  const handleZoomReset = () => {
    setZoom(100);
    setIframeKey((k) => k + 1);
  };

  // Navigate to modification - FIXED
  const handleModificationClick = useCallback(
    (mod: ModificationSummary, index: number) => {
      setSelectedModIndex(index);

      const page = mod.page || 1;
      setTargetPage(page);

      // Forza re-render degli iframe per navigare alla pagina
      setIframeKey((k) => k + 1);

      // Scroll l'item selezionato in vista nella lista
      setTimeout(() => {
        const selectedElement = document.querySelector(
          `[data-mod-index="${index}"]`
        );
        selectedElement?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
    },
    []
  );

  // Build PDF URL with parameters
  const getPdfUrl = useCallback(
    (baseUrl: string, page?: number | null) => {
      const params = [
        "toolbar=0",
        "navpanes=0",
        "scrollbar=1",
        `zoom=${zoom}`,
        "view=FitH", // Fit orizzontale per migliore visualizzazione
      ];

      if (page && page > 0) {
        params.push(`page=${page}`);
      }

      return `${baseUrl}#${params.join("&")}`;
    },
    [zoom]
  );

  // Get icon for modification type
  const getModificationIcon = (type: string) => {
    switch (type) {
      case "INSERT":
        return <PlusCircle className="h-4 w-4 text-green-500 shrink-0" />;
      case "DELETE":
        return <Trash2 className="h-4 w-4 text-red-500 shrink-0" />;
      case "REPLACE":
        return <RefreshCw className="h-4 w-4 text-blue-500 shrink-0" />;
      case "CHECKBOX":
        return <CheckSquare className="h-4 w-4 text-purple-500 shrink-0" />;
      default:
        return <Type className="h-4 w-4 text-gray-500 shrink-0" />;
    }
  };

  // Get color class for modification type
  const getModificationColor = (type: string, isSelected: boolean) => {
    const baseColors: Record<string, string> = {
      INSERT:
        "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
      DELETE: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
      REPLACE:
        "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800",
      CHECKBOX:
        "bg-purple-50 border-purple-200 dark:bg-purple-950/30 dark:border-purple-800",
    };

    const selectedStyles = isSelected
      ? "ring-2 ring-primary ring-offset-2 shadow-md"
      : "hover:shadow-md hover:scale-[1.01]";

    return cn(
      baseColors[type] ||
        "bg-gray-50 border-gray-200 dark:bg-gray-950/30 dark:border-gray-800",
      selectedStyles
    );
  };

  const totalModifications =
    modifications.length + checkboxModifications.length;
  const hasPages = summary.some((m) => m.page && m.page > 0);

  // Don't render if not open or not mounted
  if (!open || !mounted) return null;

  // Render fullscreen modal via portal
  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 animate-in fade-in-0"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal Container - FULLSCREEN */}
      <div
        className="absolute inset-4 bg-background rounded-lg border shadow-lg flex flex-col animate-in fade-in-0 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Confronta Modifiche</h2>
            {!isLoading && !error && (
              <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                {totalModifications} modific
                {totalModifications === 1 ? "a" : "he"}
              </span>
            )}
            {targetPage && (
              <span className="text-sm text-primary bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                Pagina {targetPage}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <div className="flex items-center gap-1 mr-4">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground w-12 text-center">
                {zoom}%
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={handleZoomReset}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>

            {/* Toggle sidebar */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? (
                <>
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Nascondi lista
                </>
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Mostra lista
                </>
              )}
            </Button>

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden min-h-0">
          {isLoading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState error={error} onRetry={fetchPreview} />
          ) : (
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Original PDF Panel */}
              <ResizablePanel defaultSize={showSidebar ? 40 : 50} minSize={20}>
                <div className="h-full flex flex-col">
                  <div className="px-4 py-2 border-b bg-muted/30 shrink-0">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      Documento Originale
                    </h3>
                  </div>
                  <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
                    {originalPdfUrl ? (
                      <iframe
                        key={`original-${iframeKey}`}
                        ref={originalIframeRef}
                        src={getPdfUrl(originalPdfUrl, targetPage)}
                        className="w-full h-full border-0"
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
              <ResizablePanel defaultSize={showSidebar ? 40 : 50} minSize={20}>
                <div className="h-full flex flex-col">
                  <div className="px-4 py-2 border-b bg-yellow-50/50 dark:bg-yellow-950/20 shrink-0">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4 text-yellow-600" />
                      Documento Modificato
                      <span className="text-xs text-yellow-600 bg-yellow-100 dark:bg-yellow-900/50 px-1.5 py-0.5 rounded">
                        Modifiche evidenziate
                      </span>
                    </h3>
                  </div>
                  <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900">
                    {modifiedPdfUrl ? (
                      <iframe
                        key={`modified-${iframeKey}`}
                        ref={modifiedIframeRef}
                        src={getPdfUrl(modifiedPdfUrl, targetPage)}
                        className="w-full h-full border-0"
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

              {/* Modifications Sidebar */}
              {showSidebar && (
                <>
                  <ResizableHandle withHandle />
                  <ResizablePanel defaultSize={20} minSize={15} maxSize={35}>
                    <div className="h-full flex flex-col border-l">
                      <div className="px-4 py-2 border-b shrink-0">
                        <h3 className="text-sm font-medium flex items-center justify-between">
                          <span>Lista Modifiche ({summary.length})</span>
                          {hasPages && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MousePointerClick className="h-3 w-3" />
                              Clicca per navigare
                            </span>
                          )}
                        </h3>
                      </div>

                      {/* Lista scrollabile */}
                      <div
                        ref={listContainerRef}
                        className="flex-1 overflow-y-auto overscroll-contain"
                      >
                        <div className="p-3 space-y-2">
                          {summary.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nessuna modifica
                            </p>
                          ) : (
                            summary.map((mod, idx) => (
                              <button
                                key={mod.index}
                                data-mod-index={idx}
                                onClick={() =>
                                  handleModificationClick(mod, idx)
                                }
                                className={cn(
                                  "w-full text-left p-3 rounded-lg border text-sm transition-all cursor-pointer",
                                  getModificationColor(
                                    mod.type,
                                    selectedModIndex === idx
                                  )
                                )}
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  {getModificationIcon(mod.type)}
                                  <span className="font-medium text-xs">
                                    {mod.type}
                                  </span>
                                  {mod.page && mod.page > 0 && (
                                    <span className="ml-auto text-[10px] text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                      <Navigation className="h-2.5 w-2.5" />
                                      Pag. {mod.page}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">
                                  {mod.location}
                                </p>

                                {mod.type !== "INSERT" && mod.original && (
                                  <div className="mb-1">
                                    <span className="text-xs text-red-600 dark:text-red-400 line-through break-words">
                                      {mod.original}
                                    </span>
                                  </div>
                                )}

                                {mod.type !== "DELETE" && mod.new && (
                                  <div>
                                    <span className="text-xs text-green-600 dark:text-green-400 break-words">
                                      {mod.new}
                                    </span>
                                  </div>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-muted/30 flex items-center justify-between shrink-0">
          <p className="text-xs text-muted-foreground">
            💡 Le modifiche sono evidenziate in{" "}
            <span className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
              giallo
            </span>{" "}
            nel documento modificato
          </p>
          <Button onClick={() => onOpenChange(false)}>Chiudi</Button>
        </div>
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
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
      <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
      </div>
      <div className="text-center max-w-md">
        <p className="font-medium mb-2">Errore generazione preview</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={onRetry}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Riprova
        </Button>
      </div>
    </div>
  );
}
