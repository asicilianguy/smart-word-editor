"use client";

import { useState, useEffect } from "react";
import { Download, FileText, FileIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// ============================================================================
// TYPES
// ============================================================================

export type DownloadFormat = "docx" | "pdf";

interface DownloadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFileName: string;
  onDownload: (fileName: string, format: DownloadFormat) => Promise<void>;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DownloadDialog({
  open,
  onOpenChange,
  defaultFileName,
  onDownload,
  isLoading = false,
}: DownloadDialogProps) {
  // Stato locale
  const [fileName, setFileName] = useState("");
  const [format, setFormat] = useState<DownloadFormat>("docx");
  const [error, setError] = useState<string | null>(null);

  // Reset stato quando si apre il dialog
  useEffect(() => {
    if (open) {
      // Rimuovi l'estensione dal nome file di default
      const nameWithoutExt = defaultFileName.replace(/\.[^/.]+$/, "");
      setFileName(nameWithoutExt);
      setFormat("docx");
      setError(null);
    }
  }, [open, defaultFileName]);

  // Gestisce il download
  const handleDownload = async () => {
    if (!fileName.trim()) {
      setError("Inserisci un nome per il file");
      return;
    }

    setError(null);

    try {
      await onDownload(fileName.trim(), format);
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Errore durante il download"
      );
    }
  };

  // Nome file completo con estensione
  const fullFileName = `${fileName}.${format}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Scarica documento
          </DialogTitle>
          <DialogDescription>
            Scegli il nome e il formato del file da scaricare.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nome file */}
          <div className="space-y-2">
            <Label htmlFor="fileName">Nome file</Label>
            <div className="flex items-center gap-2">
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Nome del file"
                className="flex-1"
                disabled={isLoading}
              />
              <span className="text-sm text-muted-foreground">.{format}</span>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          {/* Formato */}
          <div className="space-y-3">
            <Label>Formato</Label>
            <RadioGroup
              value={format}
              onValueChange={(value) => setFormat(value as DownloadFormat)}
              className="grid grid-cols-2 gap-4"
              disabled={isLoading}
            >
              {/* DOCX Option */}
              <div>
                <RadioGroupItem
                  value="docx"
                  id="format-docx"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="format-docx"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileText className="mb-3 h-6 w-6 text-blue-600" />
                  <span className="font-medium">DOCX</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Microsoft Word
                  </span>
                </Label>
              </div>

              {/* PDF Option */}
              <div>
                <RadioGroupItem
                  value="pdf"
                  id="format-pdf"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="format-pdf"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <FileIcon className="mb-3 h-6 w-6 text-red-600" />
                  <span className="font-medium">PDF</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Documento portabile
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Anteprima nome */}
          <div className="rounded-md bg-muted p-3">
            <p className="text-sm text-muted-foreground">
              Il file verrà salvato come:
            </p>
            <p className="font-mono text-sm mt-1 truncate" title={fullFileName}>
              {fullFileName}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Annulla
          </Button>
          <Button onClick={handleDownload} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {format === "pdf" ? "Conversione..." : "Download..."}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Scarica {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
