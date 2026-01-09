"use client";

import { useState, useRef, useCallback } from "react";
import {
  Wand2,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Coins,
  FileCheck,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

import { FileDropZone } from "./file-drop-zone";
import { FileList } from "./file-list";
import { ValidationStatus } from "./validation-status";
import { ExtractedEntriesReview } from "./extracted-entries-review";
import { PrivacyNote } from "./privacy-note";
import {
  validateDocuments,
  extractVaultData,
  saveEntriesToVault,
  fetchExistingVaultValues,
} from "./api";
import type {
  UploadedFile,
  ExtractedEntry,
  ValidationResult,
  WorkflowStep,
} from "./types";

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_FILES = 3;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PAGES_PER_FILE = 15; // Era 10
const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const MAX_TOTAL_PAGES = 30; // Aggiungi questa costante

// ============================================================================
// PROPS
// ============================================================================

interface DocumentImportSectionProps {
  userTokens: number;
  onExtractionComplete: () => void;
  onTokensUpdated: (newBalance: number) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function DocumentImportSection({
  userTokens,
  onExtractionComplete,
  onTokensUpdated,
}: DocumentImportSectionProps) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [workflowStep, setWorkflowStep] = useState<WorkflowStep>("idle");
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [extractedEntries, setExtractedEntries] = useState<ExtractedEntry[]>(
    []
  );
  const [existingVaultValues, setExistingVaultValues] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tokensConsumed, setTokensConsumed] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const hasFiles = uploadedFiles.length > 0;
  const tokensRequired = uploadedFiles.length;
  const hasEnoughTokens = userTokens >= tokensRequired;

  const isProcessing =
    workflowStep === "validating" || workflowStep === "extracting" || isSaving;

  const canRemoveFiles =
    workflowStep === "idle" ||
    workflowStep === "files_added" ||
    workflowStep === "validated";

  const isReviewMode = workflowStep === "review" || workflowStep === "saving";
  const isCompleted = workflowStep === "completed";
  const showNormalFlow = !isReviewMode && !isCompleted;

  // ============================================================================
  // HELPERS
  // ============================================================================

  const generateId = () =>
    `file-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  // ============================================================================
  // FILE HANDLING
  // ============================================================================

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      setError(null);

      const fileArray = Array.from(files);

      if (uploadedFiles.length + fileArray.length > MAX_FILES) {
        setError(`Puoi caricare al massimo ${MAX_FILES} documenti`);
        return;
      }

      const validFiles: UploadedFile[] = [];

      for (const file of fileArray) {
        const isValidType = ACCEPTED_EXTENSIONS.some((e) =>
          file.name.toLowerCase().endsWith(e)
        );

        if (!isValidType) {
          setError(`${file.name}: usa solo PDF, DOC o DOCX`);
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          setError(`${file.name}: troppo grande (max 10MB)`);
          continue;
        }

        if (uploadedFiles.some((f) => f.name === file.name)) {
          continue;
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
        setWorkflowStep("files_added");
        setValidationResult(null);
        setExtractedEntries([]);
      }
    },
    [uploadedFiles]
  );

  const handleRemoveFile = (id: string) => {
    const newFiles = uploadedFiles.filter((f) => f.id !== id);
    setUploadedFiles(newFiles);

    if (newFiles.length === 0) {
      setWorkflowStep("idle");
      setValidationResult(null);
    } else {
      // Reset to files_added so user needs to re-validate
      setWorkflowStep("files_added");
      setValidationResult(null);
    }
  };

  const handleClearAll = () => {
    setUploadedFiles([]);
    setWorkflowStep("idle");
    setValidationResult(null);
    setExtractedEntries([]);
    setExistingVaultValues([]);
    setError(null);
    setIsSaving(false);
  };

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const handleValidate = async () => {
    if (uploadedFiles.length === 0) return;

    setWorkflowStep("validating");
    setError(null);
    setUploadedFiles((prev) =>
      prev.map((f) => ({ ...f, status: "validating" as const }))
    );

    try {
      const files = uploadedFiles.map((f) => f.file);
      const result = await validateDocuments(files);

      setValidationResult(result);

      // Update files with page counts
      setUploadedFiles((prev) =>
        prev.map((f) => {
          const fileInfo = result.files.find((rf) => rf.filename === f.name);
          const pageCount = fileInfo?.pages || 0;
          const hasError = fileInfo?.error || pageCount > MAX_PAGES_PER_FILE;

          return {
            ...f,
            pageCount,
            status: hasError ? ("error" as const) : ("validated" as const),
            error:
              fileInfo?.error ||
              (pageCount > MAX_PAGES_PER_FILE
                ? `Troppe pagine (max ${MAX_PAGES_PER_FILE})`
                : undefined),
          };
        })
      );

      // Check single file page limit
      const hasFileOverLimit = result.files.some(
        (f) => f.pages > MAX_PAGES_PER_FILE
      );

      if (hasFileOverLimit) {
        setError(
          `Alcuni file superano il limite di ${MAX_PAGES_PER_FILE} pagine per documento`
        );
        setWorkflowStep("files_added");
      } else if (result.is_valid) {
        setWorkflowStep("validated");
      } else {
        setError(result.error || "Validazione fallita");
        setWorkflowStep("files_added");
      }
    } catch (err) {
      console.error("Validation error:", err);
      setError("Errore durante la validazione. Riprova.");
      setWorkflowStep("files_added");
      setUploadedFiles((prev) =>
        prev.map((f) => ({ ...f, status: "error" as const }))
      );
    }
  };

  // ============================================================================
  // EXTRACTION
  // ============================================================================

  const handleExtract = async () => {
    if (uploadedFiles.length === 0) return;

    if (userTokens < tokensRequired) {
      setError(`Servono ${tokensRequired} token, ne hai ${userTokens}`);
      return;
    }

    setWorkflowStep("extracting");
    setError(null);
    setUploadedFiles((prev) =>
      prev.map((f) => ({ ...f, status: "extracting" as const }))
    );

    try {
      const files = uploadedFiles.map((f) => f.file);
      const result = await extractVaultData(files, false);

      if (result.success && result.entries.length > 0) {
        // Carica i dati esistenti del vault per calcolare i duplicati
        const existingValues = await fetchExistingVaultValues();
        setExistingVaultValues(existingValues);

        const entries: ExtractedEntry[] = result.entries.map((e, i) => ({
          id: `entry-${Date.now()}-${i}`,
          valueData: e.valueData,
          nameLabel: e.nameLabel || "",
          nameGroup: e.nameGroup || "Altri dati",
          confidence: e.confidence || undefined,
          selected: true,
          isEditing: false,
        }));

        setExtractedEntries(entries);
        setTokensConsumed(result.tokens_consumed);
        onTokensUpdated(result.tokens_remaining);
        setUploadedFiles((prev) =>
          prev.map((f) => ({ ...f, status: "done" as const }))
        );
        setWorkflowStep("review");
      } else {
        setError(result.error || "Nessun dato estratto");
        setWorkflowStep("validated");
        setUploadedFiles((prev) =>
          prev.map((f) => ({ ...f, status: "validated" as const }))
        );
      }
    } catch (err) {
      console.error("Extraction error:", err);
      setError("Errore durante l'estrazione. Riprova.");
      setWorkflowStep("validated");
    }
  };

  // ============================================================================
  // SAVE
  // ============================================================================

  const handleSaveSelected = async () => {
    const selected = extractedEntries.filter((e) => e.selected);
    if (selected.length === 0) return;

    setIsSaving(true);
    setWorkflowStep("saving");
    setError(null);

    const entriesToSave = selected.map((e) => ({
      valueData: e.valueData,
      nameLabel: e.nameLabel || undefined,
      nameGroup: e.nameGroup,
    }));

    const result = await saveEntriesToVault(entriesToSave);

    if (result.success) {
      setWorkflowStep("completed");
      setIsSaving(false);

      // Mostra messaggio appropriato
      if (result.savedCount === 0) {
        // Tutti duplicati - mostra warning ma considera completato
        setError(result.error || null);
      }

      onExtractionComplete();
    } else {
      setError(result.error || "Errore nel salvataggio");
      setWorkflowStep("review");
      setIsSaving(false);
    }
  };

  const handleCancelReview = () => {
    setExtractedEntries([]);
    setExistingVaultValues([]);
    setWorkflowStep("validated");
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Header / Trigger */}
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-(--brand-primary)/10 flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-(--brand-primary)" />
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
                <span className="text-xs px-2.5 py-1 rounded-full bg-(--brand-primary)/10 text-(--brand-primary) font-medium">
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
            {/* ============================================================ */}
            {/* REVIEW MODE (review or saving) */}
            {/* ============================================================ */}
            {isReviewMode && (
              <>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-(--brand-primary)/5 border border-(--brand-primary)/20 text-sm">
                  <Info className="h-4 w-4 text-(--brand-primary) shrink-0" />
                  <p className="text-(--brand-primary)">
                    {isSaving
                      ? "Salvataggio in corso..."
                      : `Consumati ${tokensConsumed} token. Seleziona i dati da importare nel vault.`}
                  </p>
                </div>

                <ExtractedEntriesReview
                  entries={extractedEntries}
                  existingVaultValues={existingVaultValues}
                  onEntriesChange={setExtractedEntries}
                  onConfirm={handleSaveSelected}
                  onCancel={handleCancelReview}
                  isSubmitting={isSaving}
                />
              </>
            )}

            {/* ============================================================ */}
            {/* COMPLETED */}
            {/* ============================================================ */}
            {isCompleted && (
              <div className="text-center py-6">
                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Wand2 className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-medium text-green-800">
                  Importazione completata!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  I dati sono stati aggiunti al tuo vault
                </p>

                {/* Warning se c'erano duplicati */}
                {error && (
                  <p className="text-xs text-amber-600 mt-2">{error}</p>
                )}

                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleClearAll}
                >
                  Importa altri documenti
                </Button>
              </div>
            )}
            {/* ============================================================ */}
            {/* NORMAL FLOW (idle, files_added, validating, validated, extracting) */}
            {/* ============================================================ */}
            {showNormalFlow && (
              <>
                {/* Privacy note */}
                <PrivacyNote variant="full" />

                {/* Token info */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                  <Coins className="h-4 w-4 text-muted-foreground shrink-0" />
                  <p className="text-muted-foreground">
                    Ogni documento consuma{" "}
                    <strong className="text-foreground">1 token</strong>. Hai{" "}
                    <strong
                      className={cn(
                        userTokens > 5
                          ? "text-(--brand-primary)"
                          : userTokens > 0
                          ? "text-amber-600"
                          : "text-destructive"
                      )}
                    >
                      {userTokens} token
                    </strong>{" "}
                    disponibili.
                  </p>
                </div>

                {/* Drop zone */}
                <FileDropZone
                  onFilesSelected={processFiles}
                  disabled={isProcessing}
                  maxFiles={MAX_FILES}
                  currentFileCount={uploadedFiles.length}
                  fileInputRef={
                    fileInputRef as React.RefObject<HTMLInputElement>
                  }
                />

                {/* Error */}
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}

                {/* File list */}
                {hasFiles && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">
                        Documenti ({uploadedFiles.length}/{MAX_FILES})
                      </h4>
                      {canRemoveFiles && uploadedFiles.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs text-muted-foreground"
                          onClick={handleClearAll}
                        >
                          Rimuovi tutti
                        </Button>
                      )}
                    </div>

                    <FileList
                      files={uploadedFiles}
                      onRemove={handleRemoveFile}
                      canRemove={canRemoveFiles}
                    />
                  </div>
                )}

                {/* Validation result */}
                {validationResult && workflowStep === "validated" && (
                  <ValidationStatus result={validationResult} />
                )}

                {/* Action buttons */}
                {hasFiles && (
                  <div className="space-y-2">
                    {/* IDLE or FILES_ADDED: Show validate button */}
                    {(workflowStep === "idle" ||
                      workflowStep === "files_added") && (
                      <Button onClick={handleValidate} className="w-full">
                        <FileCheck className="h-4 w-4 mr-2" />
                        Valida documenti
                      </Button>
                    )}

                    {/* VALIDATING: Show loading */}
                    {workflowStep === "validating" && (
                      <Button className="w-full" disabled>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validazione in corso...
                      </Button>
                    )}

                    {/* VALIDATED: Show extract button */}
                    {workflowStep === "validated" && (
                      <Button
                        onClick={handleExtract}
                        className="w-full bg-(--brand-primary) hover:bg-(--brand-primary-hover)"
                        disabled={!hasEnoughTokens}
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        Estrai dati ({tokensRequired} token)
                      </Button>
                    )}

                    {/* EXTRACTING: Show loading */}
                    {workflowStep === "extracting" && (
                      <Button className="w-full" disabled>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analisi in corso...
                      </Button>
                    )}

                    {/* Token warning */}
                    {!hasEnoughTokens && workflowStep === "validated" && (
                      <p className="text-xs text-center text-destructive">
                        Token insufficienti. Servono {tokensRequired} token.
                      </p>
                    )}
                  </div>
                )}

                {/* Privacy note compact when no files */}
                {!hasFiles && <PrivacyNote variant="compact" />}
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
