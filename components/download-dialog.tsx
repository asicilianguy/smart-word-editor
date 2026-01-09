"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Download,
  FileText,
  FileIcon,
  Loader2,
  Coins,
  AlertTriangle,
  Lock,
  ArrowRight,
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
  isAuthenticated?: boolean;
  onAuthClick?: () => void;
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
  isAuthenticated = false,
  onAuthClick,
}: DownloadDialogProps) {
  const t = useTranslations("download");

  const [fileName, setFileName] = useState("");
  const [format, setFormat] = useState<DownloadFormat>("docx");
  const [error, setError] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo>({
    available: 0,
    isChecking: false,
    error: null,
  });

  // Reset stato quando si apre il dialog
  useEffect(() => {
    if (open) {
      const nameWithoutExt = defaultFileName.replace(/\.[^/.]+$/, "");
      setFileName(nameWithoutExt);
      setFormat("docx");
      setError(null);

      // Verifica token solo se autenticato
      if (isAuthenticated) {
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
              error: t("credits.verificationError"),
            });
          }
        });
      } else {
        setTokenInfo({ available: 0, isChecking: false, error: null });
      }
    }
  }, [open, defaultFileName, isAuthenticated, t]);

  const handleDownload = async () => {
    if (!fileName.trim()) {
      setError(t("errors.fileNameRequired"));
      return;
    }

    if (tokenInfo.available < 1) {
      setError(t("errors.insufficientCredits"));
      return;
    }

    setError(null);

    try {
      await onDownload(fileName.trim(), format);
      setTokenInfo((prev) => ({
        ...prev,
        available: Math.max(0, prev.available - 1),
      }));
    } catch (err) {
      if (err instanceof Error) {
        const errorMessage = err.message.toLowerCase();
        if (
          errorMessage.includes("402") ||
          errorMessage.includes("insufficient") ||
          errorMessage.includes("token")
        ) {
          setError(t("errors.insufficientCreditsRetry"));
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
        setError(t("errors.downloadFailed"));
      }
    }
  };

  const fullFileName = `${fileName}.${format}`;
  const hasEnoughTokens = tokenInfo.available >= 1;
  const canDownload =
    isAuthenticated && hasEnoughTokens && !tokenInfo.isChecking && !isLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Auth required banner - se non autenticato */}
          {!isAuthenticated && <AuthRequiredBanner onAuthClick={onAuthClick} />}

          {/* Token status - solo se autenticato */}
          {isAuthenticated && <TokenStatusBanner tokenInfo={tokenInfo} />}

          {/* Nome file */}
          <div className="space-y-1.5">
            <Label htmlFor="fileName" className="text-sm">
              {t("fileName")}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="fileName"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder={t("fileNamePlaceholder")}
                className="flex-1 h-9"
                disabled={isLoading}
              />
              <span className="text-sm text-muted-foreground w-12">
                .{format}
              </span>
            </div>
          </div>

          {/* Formato */}
          <div className="space-y-1.5">
            <Label className="text-sm">{t("format")}</Label>
            <div className="grid grid-cols-2 gap-3">
              <FormatButton
                format="docx"
                selected={format === "docx"}
                onClick={() => setFormat("docx")}
                disabled={isLoading}
                icon={<FileText className="h-5 w-5 text-blue-600" />}
                label={t("formats.docx.label")}
                description={t("formats.docx.description")}
              />
              <FormatButton
                format="pdf"
                selected={format === "pdf"}
                onClick={() => setFormat("pdf")}
                disabled={isLoading}
                icon={<FileIcon className="h-5 w-5 text-red-600" />}
                label={t("formats.pdf.label")}
                description={t("formats.pdf.description")}
              />
            </div>
          </div>

          {/* Preview nome file */}
          <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
            <span className="text-muted-foreground">{t("filePreview")} </span>
            <span className="font-mono">{fullFileName}</span>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              <AlertTriangle className="h-4 w-4 shrink-0" />
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
            {t("cancel")}
          </Button>

          {isAuthenticated ? (
            <Button onClick={handleDownload} disabled={!canDownload} size="sm">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {format === "pdf" ? t("converting") : t("downloading")}
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  {t("download")}
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onAuthClick}
              size="sm"
              className="bg-(--brand-primary) hover:bg-(--brand-primary-hover)"
            >
              {t("loginToDownload")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// AUTH REQUIRED BANNER
// ============================================================================

function AuthRequiredBanner({ onAuthClick }: { onAuthClick?: () => void }) {
  const t = useTranslations("download");

  return (
    <div className="rounded-lg border border-(--brand-primary)/30 bg-(--brand-primary-subtle) p-4">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-(--brand-primary)/10 flex items-center justify-center shrink-0">
          <Lock className="h-5 w-5 text-(--brand-primary)" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-sm mb-1">{t("auth.title")}</h4>
          <p className="text-xs text-muted-foreground mb-3">
            {t("auth.description")}
          </p>
          <Button
            size="sm"
            onClick={onAuthClick}
            className="h-8 bg-(--brand-primary) hover:bg-(--brand-primary-hover)"
          >
            {t("auth.continue")}
            <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TOKEN STATUS BANNER
// ============================================================================

function TokenStatusBanner({ tokenInfo }: { tokenInfo: TokenInfo }) {
  const t = useTranslations("download");

  if (tokenInfo.isChecking) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
        <Loader2 className="h-4 w-4 animate-spin" />
        {t("credits.checking")}
      </div>
    );
  }

  if (tokenInfo.error) {
    return (
      <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span>{tokenInfo.error}</span>
      </div>
    );
  }

  if (tokenInfo.available < 1) {
    return (
      <div className="flex items-center justify-between gap-2 text-sm text-destructive bg-destructive/10 px-3 py-2.5 rounded-md border border-destructive/20">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 shrink-0" />
          <span>{t("credits.exhausted")}</span>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          {t("credits.buy")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-2 text-sm bg-green-50 text-green-700 px-3 py-2 rounded-md border border-green-200">
      <div className="flex items-center gap-2">
        <Coins className="h-4 w-4 shrink-0" />
        <span>{t("credits.available", { count: tokenInfo.available })}</span>
      </div>
      <span className="text-xs text-green-600">
        {t("credits.costPerDownload")}
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
        "flex items-center gap-3 p-3 rounded-md border-2 text-left",
        "hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/30"
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
