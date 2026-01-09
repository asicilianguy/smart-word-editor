"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  File,
  FileText,
  X,
  Loader2,
  Wand2,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  RefreshCw,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getAuthHeaders } from "@/lib/auth";

// ============================================================================
// TYPES
// ============================================================================

interface DocumentImportSectionProps {
  userTokens: number;
  onExtractionComplete: (
    entries: ExtractedEntry[],
    tokensConsumed: number
  ) => void;
  onTokensUpdated: (newBalance: number) => void;
}

interface ExtractedEntry {
  valueData: string;
  nameLabel?: string | null;
  nameGroup?: string | null;
  confidence?: number | null;
}

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
}

interface ExtractionResult {
  success: boolean;
  entries: ExtractedEntry[];
  model_used: string;
  tokens_used: number;
  documents_processed: number;
  tokens_consumed: number;
  tokens_remaining: number;
  error?: string | null;
  error_code?: string | null;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 3;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================================================
// API
// ============================================================================

async function extractVaultDataAuthenticated(
  files: File[],
  usePremium: boolean = false,
  saveToVault: boolean = true
): Promise<ExtractionResult> {
  const authHeaders = getAuthHeaders();

  // Verifica se c'è il token - getAuthHeaders ritorna {} se non autenticato
  const hasAuth = authHeaders && Object.keys(authHeaders).length > 0;

  if (!hasAuth) {
    return {
      success: false,
      entries: [],
      model_used: "",
      tokens_used: 0,
      documents_processed: 0,
      tokens_consumed: 0,
      tokens_remaining: 0,
      error: "Non autorizzato. Effettua il login.",
      error_code: "UNAUTHORIZED",
    };
  }

  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const url = new URL(`${API_BASE_URL}/api/vault/extract-authenticated`);
  url.searchParams.set("use_premium", usePremium.toString());
  url.searchParams.set("save_to_vault", saveToVault.toString());

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });

    if (response.status === 401) {
      return {
        success: false,
        entries: [],
        model_used: "",
        tokens_used: 0,
        documents_processed: 0,
        tokens_consumed: 0,
        tokens_remaining: 0,
        error: "Sessione scaduta. Effettua nuovamente il login.",
        error_code: "UNAUTHORIZED",
      };
    }

    return response.json();
  } catch (error) {
    console.error("Extraction error:", error);
    return {
      success: false,
      entries: [],
      model_used: "",
      tokens_used: 0,
      documents_processed: 0,
      tokens_consumed: 0,
      tokens_remaining: 0,
      error: "Errore di connessione. Verifica la tua connessione internet.",
      error_code: "NETWORK_ERROR",
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DocumentImportSection({
  userTokens,
  onExtractionComplete,
  onTokensUpdated,
}: DocumentImportSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] =
    useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // FILE HANDLING
  // ============================================================================

  const generateId = () =>
    `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null);
      setExtractionResult(null);

      const fileArray = Array.from(files);

      if (uploadedFiles.length + fileArray.length > MAX_FILES) {
        setError(`Puoi caricare al massimo ${MAX_FILES} documenti per volta`);
        return;
      }

      const validFiles: UploadedFile[] = [];

      for (const file of fileArray) {
        const isValidType = ACCEPTED_EXTENSIONS.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        );

        if (!isValidType) {
          setError(
            `${file.name}: formato non supportato. Usa PDF, DOC o DOCX.`
          );
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          setError(`${file.name}: file troppo grande (max 10MB)`);
          continue;
        }

        if (uploadedFiles.some((f) => f.name === file.name)) {
          continue; // Skip duplicates
        }

        validFiles.push({
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          status: "pending",
        });
      }

      if (validFiles.length > 0) {
        setUploadedFiles((prev) => [...prev, ...validFiles]);
      }
    },
    [uploadedFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files);
      }
      e.target.value = "";
    },
    [processFiles]
  );

  const handleRemoveFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleClearAll = () => {
    setUploadedFiles([]);
    setExtractionResult(null);
    setError(null);
  };

  // ============================================================================
  // EXTRACTION
  // ============================================================================

  const handleExtract = async () => {
    if (uploadedFiles.length === 0) return;

    setIsExtracting(true);
    setError(null);

    // Update file statuses
    setUploadedFiles((prev) =>
      prev.map((f) => ({ ...f, status: "processing" as const }))
    );

    try {
      const files = uploadedFiles.map((f) => f.file);
      const result = await extractVaultDataAuthenticated(files, false, true);

      setExtractionResult(result);

      if (result.success) {
        // Update file statuses to done
        setUploadedFiles((prev) =>
          prev.map((f) => ({ ...f, status: "done" as const }))
        );

        // Notify parent
        onExtractionComplete(result.entries, result.tokens_consumed);
        onTokensUpdated(result.tokens_remaining);
      } else {
        // Update file statuses to error
        setUploadedFiles((prev) =>
          prev.map((f) => ({ ...f, status: "error" as const }))
        );
        setError(result.error || "Errore durante l'estrazione");
      }
    } catch (err) {
      console.error("Extraction error:", err);
      setUploadedFiles((prev) =>
        prev.map((f) => ({ ...f, status: "error" as const }))
      );
      setError("Errore di connessione. Riprova.");
    } finally {
      setIsExtracting(false);
    }
  };

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const hasFiles = uploadedFiles.length > 0;
  const tokensRequired = uploadedFiles.length;
  const hasEnoughTokens = userTokens >= tokensRequired;
  const canExtract = hasFiles && hasEnoughTokens && !isExtracting;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border bg-card overflow-hidden">
        {/* Header / Trigger */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-(--brand-primary)/10 flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-[var(--brand-primary)]" />
              </div>
              <div>
                <h3 className="font-medium">Importa da documenti</h3>
                <p className="text-sm text-muted-foreground">
                  Estrai automaticamente dati riutilizzabili
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasFiles && !isOpen && (
                <span className="text-xs px-2 py-1 rounded-full bg-(--brand-primary)/10 text-[var(--brand-primary)]">
                  {uploadedFiles.length} file
                </span>
              )}
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Content */}
        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4">
            {/* Drop Zone */}
            {!extractionResult?.success && (
              <>
                {/* Info box sui token */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border text-sm">
                  <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="text-muted-foreground">
                    <p>
                      Ogni documento caricato consuma{" "}
                      <strong className="text-foreground">1 token</strong>.
                    </p>
                    <p className="text-xs mt-1">
                      I dati estratti vengono salvati automaticamente nel tuo
                      vault.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    isDragOver
                      ? "border-[var(--brand-primary)] bg-(--brand-primary)/5"
                      : "border-muted-foreground/25 hover:border-[var(--brand-primary)]/50 hover:bg-muted/50",
                    isExtracting && "pointer-events-none opacity-50"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS.join(",")}
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isExtracting}
                  />

                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center",
                        isDragOver ? "bg-(--brand-primary)/20" : "bg-muted"
                      )}
                    >
                      <Upload
                        className={cn(
                          "h-5 w-5",
                          isDragOver
                            ? "text-[var(--brand-primary)]"
                            : "text-muted-foreground"
                        )}
                      />
                    </div>

                    <div>
                      <p className="font-medium text-sm">
                        {isDragOver
                          ? "Rilascia qui"
                          : "Trascina i tuoi documenti"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        oppure{" "}
                        <span className="text-[var(--brand-primary)]">
                          clicca per sfogliare
                        </span>
                      </p>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      PDF, Word • Max 10MB • Max {MAX_FILES} file
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{error}</p>
                  {extractionResult?.error_code === "INSUFFICIENT_TOKENS" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 h-7 text-xs"
                      onClick={() => {
                        /* TODO: Link to buy tokens */
                      }}
                    >
                      Acquista token
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Uploaded Files */}
            {hasFiles && !extractionResult?.success && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    File caricati ({uploadedFiles.length}/{MAX_FILES})
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground"
                    onClick={handleClearAll}
                    disabled={isExtracting}
                  >
                    Rimuovi tutti
                  </Button>
                </div>

                <div className="space-y-1.5">
                  {uploadedFiles.map((uploadedFile) => (
                    <div
                      key={uploadedFile.id}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-md border bg-background group",
                        uploadedFile.status === "error" &&
                          "border-destructive/50",
                        uploadedFile.status === "done" && "border-green-500/50"
                      )}
                    >
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        {uploadedFile.name.toLowerCase().endsWith(".pdf") ? (
                          <File className="h-4 w-4 text-red-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {uploadedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatSize(uploadedFile.size)}
                          {uploadedFile.status === "processing" && (
                            <span className="ml-2 text-[var(--brand-primary)]">
                              Elaborazione...
                            </span>
                          )}
                          {uploadedFile.status === "done" && (
                            <span className="ml-2 text-green-600">
                              Completato
                            </span>
                          )}
                          {uploadedFile.status === "error" && (
                            <span className="ml-2 text-destructive">
                              Errore
                            </span>
                          )}
                        </p>
                      </div>
                      {uploadedFile.status === "processing" ? (
                        <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-primary)]" />
                      ) : uploadedFile.status === "done" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100"
                          onClick={() => handleRemoveFile(uploadedFile.id)}
                          disabled={isExtracting}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extraction Result */}
            {extractionResult?.success && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-md bg-green-50 border border-green-200">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800">
                      Estratti {extractionResult.entries.length} dati
                    </p>
                    <p className="text-sm text-green-600">
                      Consumati {extractionResult.tokens_consumed} token •
                      Rimanenti: {extractionResult.tokens_remaining}
                    </p>
                  </div>
                </div>

                {/* Preview extracted entries */}
                {extractionResult.entries.length > 0 && (
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {extractionResult.entries.slice(0, 10).map((entry, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm p-2 rounded-md bg-muted/50 border"
                      >
                        <Database className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {entry.valueData}
                          </p>
                          {entry.nameLabel && (
                            <p className="text-xs text-muted-foreground">
                              {entry.nameLabel}
                            </p>
                          )}
                        </div>
                        {entry.nameGroup && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                            {entry.nameGroup}
                          </span>
                        )}
                      </div>
                    ))}
                    {extractionResult.entries.length > 10 && (
                      <p className="text-xs text-center text-muted-foreground py-2">
                        +{extractionResult.entries.length - 10} altri dati
                        estratti
                      </p>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setUploadedFiles([]);
                    setExtractionResult(null);
                    setError(null);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Importa altri documenti
                </Button>
              </div>
            )}

            {/* Extract Button */}
            {hasFiles && !extractionResult?.success && (
              <div className="space-y-2">
                <Button
                  onClick={handleExtract}
                  disabled={!canExtract}
                  className="w-full bg-(--brand-primary) hover:bg-[var(--brand-primary-hover)]"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analisi in corso...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Estrai dati ({tokensRequired} token)
                    </>
                  )}
                </Button>

                {userTokens < tokensRequired && (
                  <p className="text-xs text-center text-destructive">
                    Hai solo {userTokens} token disponibili
                  </p>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
