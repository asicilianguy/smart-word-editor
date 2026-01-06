"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload,
  File,
  FileText,
  X,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FolderOpen,
  Shield,
  Sparkles,
  Loader2,
  AlertCircle,
  FileWarning,
  FileCheck,
  Wand2,
  Database,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  validateDocuments,
  extractVaultData,
  type PageCountResponse,
  type ExtractionResponse,
} from "@/lib/api-client";
import type { UploadedDocument, VaultEntry } from "@/lib/auth-types";
import { generateDocumentId, generateEntryId } from "@/lib/auth-types";

// ============================================================================
// CONSTANTS
// ============================================================================

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 3;
const MAX_TOTAL_PAGES = 20;

// ============================================================================
// TYPES
// ============================================================================

interface FriendlyDocumentUploaderProps {
  documents: UploadedDocument[];
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  onEntriesExtracted?: (entries: VaultEntry[]) => void;
  onComplete: () => void;
  onBack: () => void;
}

type WorkflowStep =
  | "upload"
  | "validated"
  | "extracting"
  | "extracted"
  | "error";

interface ExtractionError {
  message: string;
  code?: string;
  canRetry: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FriendlyDocumentUploader({
  documents,
  onDocumentsChange,
  onEntriesExtracted,
  onComplete,
  onBack,
}: FriendlyDocumentUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>("upload");
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] =
    useState<PageCountResponse | null>(null);
  const [extractionResult, setExtractionResult] =
    useState<ExtractionResponse | null>(null);
  const [extractionError, setExtractionError] =
    useState<ExtractionError | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map per tenere traccia dei File objects
  const [fileObjects, setFileObjects] = useState<Map<string, File>>(new Map());

  // ============================================================================
  // FILE PROCESSING
  // ============================================================================

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      setUploadError(null);
      setExtractionError(null);
      // Reset workflow quando si aggiungono file
      setWorkflowStep("upload");
      setValidationResult(null);
      setExtractionResult(null);

      const fileArray = Array.from(files);

      if (documents.length + fileArray.length > MAX_FILES) {
        setUploadError(`Puoi caricare al massimo ${MAX_FILES} documenti`);
        return;
      }

      const validFiles: UploadedDocument[] = [];
      const newFileObjects = new Map(fileObjects);

      for (const file of fileArray) {
        const isValidType = ACCEPTED_EXTENSIONS.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        );

        if (!isValidType) {
          setUploadError(`${file.name}: usa solo PDF, DOC o DOCX`);
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          setUploadError(`${file.name}: troppo grande (max 10MB)`);
          continue;
        }

        if (documents.some((doc) => doc.fileName === file.name)) {
          continue;
        }

        const docId = generateDocumentId();

        validFiles.push({
          id: docId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || "application/octet-stream",
          uploadedAt: new Date(),
          status: "pending",
          pageCount: undefined,
        });

        newFileObjects.set(docId, file);
      }

      if (validFiles.length > 0) {
        const newDocs = [...documents, ...validFiles];
        onDocumentsChange(newDocs);
        setFileObjects(newFileObjects);
      }
    },
    [documents, fileObjects, onDocumentsChange]
  );

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const handleValidate = async () => {
    if (fileObjects.size === 0) return;

    setIsProcessing(true);
    setUploadError(null);
    setExtractionError(null);

    try {
      const filesArray = Array.from(fileObjects.values());
      const result = await validateDocuments(filesArray);

      setValidationResult(result);

      // Aggiorna documenti con il conteggio pagine
      const updatedDocs = documents.map((doc) => {
        const fileInfo = result.files.find((f) => f.filename === doc.fileName);
        return {
          ...doc,
          pageCount: fileInfo?.pages || 0,
          status: fileInfo?.error ? ("error" as const) : ("completed" as const),
        };
      });

      onDocumentsChange(updatedDocs);
      setWorkflowStep(result.is_valid ? "validated" : "upload");

      if (!result.is_valid && result.error) {
        setUploadError(result.error);
      }
    } catch (err) {
      console.error("Validation error:", err);
      setUploadError("Errore durante la validazione. Riprova.");
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // EXTRACTION
  // ============================================================================

  const handleExtract = async () => {
    if (fileObjects.size === 0) return;

    setWorkflowStep("extracting");
    setIsProcessing(true);
    setUploadError(null);
    setExtractionError(null);

    try {
      const filesArray = Array.from(fileObjects.values());
      const result = await extractVaultData(filesArray, false);

      setExtractionResult(result);

      if (result.success && result.entries.length > 0) {
        // Converti in VaultEntry[]
        const vaultEntries: VaultEntry[] = result.entries.map((entry) => ({
          id: generateEntryId(),
          valueData: entry.valueData,
          nameLabel: entry.nameLabel || undefined,
          nameGroup: entry.nameGroup || undefined,
          createdAt: new Date(),
          source: "extracted" as const,
        }));

        onEntriesExtracted?.(vaultEntries);
        setWorkflowStep("extracted");
      } else {
        // Estrazione fallita ma con response valida dal backend
        const canRetry = result.error_code !== "NO_API_KEY";
        setExtractionError({
          message: result.error || "Nessun dato estratto dai documenti",
          code: result.error_code || undefined,
          canRetry,
        });
        setWorkflowStep("error");
      }
    } catch (err) {
      // Errore di rete o altro errore non gestito
      console.error("Extraction error:", err);
      setExtractionError({
        message:
          "Errore di connessione. Verifica la tua connessione internet e riprova.",
        canRetry: true,
      });
      setWorkflowStep("error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setExtractionError(null);
    setWorkflowStep("validated");
  };

  const handleSkipExtraction = () => {
    // Permetti all'utente di continuare senza estrarre
    onComplete();
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

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

  const handleRemove = (id: string) => {
    const newDocs = documents.filter((d) => d.id !== id);
    onDocumentsChange(newDocs);

    const newFileObjects = new Map(fileObjects);
    newFileObjects.delete(id);
    setFileObjects(newFileObjects);

    // Reset workflow
    setWorkflowStep("upload");
    setValidationResult(null);
    setExtractionResult(null);
    setExtractionError(null);
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const hasDocuments = documents.length > 0;
  const canUploadMore =
    documents.length < MAX_FILES && workflowStep === "upload";

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="h-12 w-12 rounded-md bg-muted border border-border flex items-center justify-center mx-auto">
          <FolderOpen className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">I tuoi documenti</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Carica fino a {MAX_FILES} documenti (max {MAX_TOTAL_PAGES} pagine in
          totale).
          <br />
          Estrarremo automaticamente i dati riutilizzabili.
        </p>
      </div>

      {/* Drop Zone */}
      {canUploadMore && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-md p-8 text-center cursor-pointer",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(",")}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                "h-12 w-12 rounded-md flex items-center justify-center",
                isDragOver ? "bg-primary/20" : "bg-muted"
              )}
            >
              <Upload
                className={cn(
                  "h-6 w-6",
                  isDragOver ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>

            <div>
              <p className="font-medium">
                {isDragOver ? "Rilascia qui" : "Trascina i tuoi file"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                oppure{" "}
                <span className="text-primary font-medium">
                  clicca per sfogliare
                </span>
              </p>
            </div>

            <p className="text-xs text-muted-foreground">
              PDF, Word • Max 10MB per file
            </p>
          </div>
        </div>
      )}

      {/* Upload Error */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          <FileWarning className="h-4 w-4 shrink-0" />
          {uploadError}
        </div>
      )}

      {/* Uploaded Files */}
      {hasDocuments && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium">
            Documenti caricati ({documents.length}/{MAX_FILES})
          </h3>

          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-md border bg-card group",
                  doc.status === "error" && "border-destructive/50"
                )}
              >
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                  {doc.fileType.includes("pdf") ? (
                    <File className="h-5 w-5 text-red-500" />
                  ) : (
                    <FileText className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(doc.fileSize)}
                    {doc.pageCount !== undefined && doc.pageCount > 0 && (
                      <span className="ml-2 text-green-600">
                        • {doc.pageCount} pagin{doc.pageCount === 1 ? "a" : "e"}
                      </span>
                    )}
                  </p>
                </div>
                {workflowStep === "upload" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100"
                    onClick={() => handleRemove(doc.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                {(workflowStep === "validated" ||
                  workflowStep === "extracted") &&
                  doc.pageCount !== undefined && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Result */}
      {validationResult &&
        (workflowStep === "validated" ||
          workflowStep === "extracting" ||
          workflowStep === "extracted") && (
          <div
            className={cn(
              "p-4 rounded-md border",
              validationResult.is_valid
                ? "bg-green-50 border-green-200"
                : "bg-destructive/10 border-destructive/30"
            )}
          >
            <div className="flex items-center gap-3">
              {validationResult.is_valid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive" />
              )}
              <p className="font-medium">
                {validationResult.is_valid
                  ? `Validazione completata: ${validationResult.total_pages} pagine totali`
                  : "Validazione fallita"}
              </p>
            </div>
          </div>
        )}

      {/* Extraction Error */}
      {extractionError && workflowStep === "error" && (
        <div className="p-4 rounded-md border bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-800">
                {extractionError.message}
              </p>
              <div className="flex gap-2 mt-3">
                {extractionError.canRetry && (
                  <Button variant="outline" size="sm" onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Riprova
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipExtraction}
                >
                  Continua senza estrarre
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extraction Result */}
      {extractionResult && workflowStep === "extracted" && (
        <div className="p-4 rounded-md border bg-muted/50 border-border">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="font-medium">
                Estratti {extractionResult.entries.length} dati riutilizzabili
              </p>
              <p className="text-sm text-muted-foreground">
                I dati sono stati aggiunti al tuo vault
              </p>
            </div>
          </div>

          {/* Grouped entries */}
          {extractionResult.entries.length > 0 && (
            <div className="max-h-80 overflow-y-auto space-y-4 pr-2">
              {(() => {
                // Raggruppa entries per nameGroup
                const grouped = extractionResult.entries.reduce(
                  (acc, entry) => {
                    const group = entry.nameGroup || "Altri dati";
                    if (!acc[group]) acc[group] = [];
                    acc[group].push(entry);
                    return acc;
                  },
                  {} as Record<string, typeof extractionResult.entries>
                );

                // Ordine preferito dei gruppi
                const groupOrder = [
                  "Dati Identificativi",
                  "Persone",
                  "Contatti",
                  "Indirizzi",
                  "Coordinate Bancarie",
                  "Dati Professionali",
                  "Altri dati",
                ];

                const sortedGroups = Object.keys(grouped).sort((a, b) => {
                  const indexA = groupOrder.indexOf(a);
                  const indexB = groupOrder.indexOf(b);
                  if (indexA === -1 && indexB === -1) return a.localeCompare(b);
                  if (indexA === -1) return 1;
                  if (indexB === -1) return -1;
                  return indexA - indexB;
                });

                return sortedGroups.map((groupName) => (
                  <div key={groupName}>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {groupName}
                    </h4>
                    <div className="space-y-1.5">
                      {grouped[groupName].map((entry, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 text-sm p-2.5 rounded-md bg-background border"
                        >
                          <span className="text-muted-foreground text-xs min-w-[100px] pt-0.5">
                            {entry.nameLabel || "Valore"}
                          </span>
                          <span className="font-medium break-all flex-1">
                            {entry.valueData}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {hasDocuments && workflowStep !== "error" && (
        <div className="space-y-3">
          {/* Step 1: Validate */}
          {workflowStep === "upload" && (
            <Button
              onClick={handleValidate}
              className="w-full"
              size="lg"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Validazione in corso...
                </>
              ) : (
                <>
                  <FileCheck className="h-5 w-5 mr-2" />
                  Valida documenti
                </>
              )}
            </Button>
          )}

          {/* Step 2: Extract */}
          {workflowStep === "validated" && (
            <Button
              onClick={handleExtract}
              className="w-full"
              size="lg"
              disabled={isProcessing}
            >
              <Wand2 className="h-5 w-5 mr-2" />
              Estrai dati dai documenti
            </Button>
          )}

          {/* Extracting State */}
          {workflowStep === "extracting" && (
            <Button disabled className="w-full" size="lg">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Analisi in corso...
            </Button>
          )}

          {/* Step 3: Complete */}
          {workflowStep === "extracted" && (
            <Button onClick={onComplete} className="w-full" size="lg">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Continua
            </Button>
          )}
        </div>
      )}

      {/* Helper text */}
      {!hasDocuments && (
        <p className="text-center text-sm text-muted-foreground">
          Carica almeno un documento per continuare
        </p>
      )}

      {/* Rassicurazione */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        <span>I tuoi file restano privati e al sicuro</span>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Indietro
        </Button>

        <Button variant="ghost" onClick={onComplete}>
          Salta per ora
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Tip */}
      <p className="text-center text-xs text-muted-foreground">
        <Sparkles className="h-3 w-3 inline mr-1" />
        Scegli documenti con molti dati: visure, contratti, schede cliente
      </p>
    </div>
  );
}
