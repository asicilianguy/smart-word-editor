"use client";

import { useState, useEffect } from "react";
import {
  Download,
  FileText,
  FileIcon,
  Loader2,
  Coins,
  AlertTriangle,
} from "lucide-react";
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
import { cn } from "@/lib/utils";

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

interface TokenInfo {
  available: number;
  isChecking: boolean;
  error: string | null;
}

// ============================================================================
// API
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "smart_word_editor_token";

async function checkUserTokens(): Promise<{ tokens: number } | null> {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return { tokens: data.tokens ?? 0 };
  } catch {
    return null;
  }
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
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    available: 0,
    isChecking: true,
    error: null,
  });

  // Reset stato e verifica token quando si apre il dialog
  useEffect(() => {
    if (open) {
      // Rimuovi l'estensione dal nome file di default
      const nameWithoutExt = defaultFileName.replace(/\.[^/.]+$/, "");
      setFileName(nameWithoutExt);
      setFormat("docx");
      setError(null);

      // Verifica token disponibili
      setTokenInfo({ available: 0, isChecking: true, error: null });
      checkUserTokens().then((result) => {
        if (result) {
          setTokenInfo({
            available: result.tokens,
            isChecking: false,
            error: null,
          });
        } else {
          setTokenInfo({
            available: 0,
            isChecking: false,
            error: "Impossibile verificare i token",
          });
        }
      });
    }
  }, [open, defaultFileName]);

  // Gestisce il download
  const handleDownload = async () => {
    if (!fileName.trim()) {
      setError("Inserisci un nome per il file");
      return;
    }

    if (tokenInfo.available < 1) {
      setError("Token insufficienti per il download");
      return;
    }

    setError(null);

    try {
      await onDownload(fileName.trim(), format);
      // Aggiorna il conteggio token localmente (il backend lo ha già decrementato)
      setTokenInfo((prev) => ({
        ...prev,
        available: Math.max(0, prev.available - 1),
      }));
      onOpenChange(false);
    } catch (err) {
      // Gestisci errore 402 (token insufficienti) dal backend
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase();
        if (
          errorMessage.includes("402") ||
          errorMessage.includes("insufficient") ||
          errorMessage.includes("token")
        ) {
          setError("Token insufficienti. Ricarica la pagina e riprova.");
          // Ricarica info token
          checkUserTokens().then((result) => {
            if (result) {
              setTokenInfo({
                available: result.tokens,
                isChecking: false,
                error: null,
              });
            }
          });
        } else {
          setError(err.message);
        }
      } else {
        setError("Errore durante il download");
      }
    }
  };

  // Nome file completo con estensione
  const fullFileName = `${fileName}.${format}`;
  const hasEnoughTokens = tokenInfo.available >= 1;
  const canDownload = hasEnoughTokens && !tokenInfo.isChecking && !isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Scarica documento
          </DialogTitle>
          <DialogDescription>
            Scegli il nome e il formato del file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Token status */}
          <TokenStatusBanner tokenInfo={tokenInfo} />

          {/* Nome file */}
          <div className="space-y-1.5">
            <Label htmlFor="fileName" className="text-sm">
              Nome file
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="Nome del file"
                className="flex-1 h-9"
                disabled={isLoading || !hasEnoughTokens}
              />
              <span className="text-sm text-muted-foreground w-12">
                .{format}
              </span>
            </div>
          </div>

          {/* Formato - design compatto */}
          <div className="space-y-1.5">
            <Label className="text-sm">Formato</Label>
            <div className="grid grid-cols-2 gap-3">
              <FormatButton
                format="docx"
                selected={format === "docx"}
                onClick={() => setFormat("docx")}
                disabled={isLoading || !hasEnoughTokens}
                icon={<FileText className="h-5 w-5 text-blue-600" />}
                label="DOCX"
                description="Microsoft Word"
              />
              <FormatButton
                format="pdf"
                selected={format === "pdf"}
                onClick={() => setFormat("pdf")}
                disabled={isLoading || !hasEnoughTokens}
                icon={<FileIcon className="h-5 w-5 text-red-600" />}
                label="PDF"
                description="Documento portabile"
              />
            </div>
          </div>

          {/* Preview nome file - compatto */}
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">File: </span>
            <span className="font-mono">{fullFileName}</span>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            size="sm"
          >
            Annulla
          </Button>
          <Button onClick={handleDownload} disabled={!canDownload} size="sm">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {format === "pdf" ? "Conversione..." : "Download..."}
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Scarica
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// TOKEN STATUS BANNER
// ============================================================================

function TokenStatusBanner({ tokenInfo }: { tokenInfo: TokenInfo }) {
  if (tokenInfo.isChecking) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
        <Loader2 className="h-4 w-4 animate-spin" />
        Verifica token disponibili...
      </div>
    );
  }

  if (tokenInfo.error) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-md border border-amber-200 dark:border-amber-800">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span>{tokenInfo.error}</span>
      </div>
    );
  }

  if (tokenInfo.available < 1) {
    return (
      <div className="flex items-center justify-between gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2.5 rounded-md border border-destructive/20">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 flex-shrink-0" />
          <span>Token esauriti</span>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          Acquista token
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 text-sm bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 px-3 py-2 rounded-md border border-green-200 dark:border-green-800">
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 flex-shrink-0" />
        <span>
          <strong>{tokenInfo.available}</strong> token disponibil
          {tokenInfo.available === 1 ? "e" : "i"}
        </span>
      </div>
      <span className="text-xs text-green-600 dark:text-green-500">
        -1 per download
      </span>
    </div>
  );
}

// ============================================================================
// FORMAT BUTTON
// ============================================================================

interface FormatButtonProps {
  format: DownloadFormat;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
}

function FormatButton({
  selected,
  onClick,
  disabled,
  icon,
  label,
  description,
}: FormatButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
        "hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed",
        selected
          ? "border-primary bg-primary/5"
          : "border-muted hover:border-muted-foreground/30"
      )}
    >
      {icon}
      <div>
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
