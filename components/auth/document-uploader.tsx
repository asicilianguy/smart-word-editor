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
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UploadedDocument } from "@/lib/auth-types";
import { generateDocumentId } from "@/lib/auth-types";

// ============================================================================
// TYPES
// ============================================================================

interface DocumentUploaderProps {
  documents: UploadedDocument[];
  onDocumentsChange: (documents: UploadedDocument[]) => void;
  onComplete: () => void;
  onBack: () => void;
  isLoading?: boolean;
}

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/rtf",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".rtf", ".odt"];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;

// ============================================================================
// COMPONENT
// ============================================================================

export function DocumentUploader({
  documents,
  onDocumentsChange,
  onComplete,
  onBack,
  isLoading = false,
}: DocumentUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      setUploadError(null);
      const fileArray = Array.from(files);

      // Validazioni
      if (documents.length + fileArray.length > MAX_FILES) {
        setUploadError(`Puoi caricare massimo ${MAX_FILES} documenti`);
        return;
      }

      const validFiles: UploadedDocument[] = [];
      const errors: string[] = [];

      fileArray.forEach((file) => {
        // Check file type
        const isValidType =
          ACCEPTED_TYPES.includes(file.type) ||
          ACCEPTED_EXTENSIONS.some((ext) =>
            file.name.toLowerCase().endsWith(ext)
          );

        if (!isValidType) {
          errors.push(`${file.name}: formato non supportato`);
          return;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push(`${file.name}: dimensione massima 10MB`);
          return;
        }

        // Check duplicates
        const isDuplicate = documents.some((doc) => doc.fileName === file.name);
        if (isDuplicate) {
          errors.push(`${file.name}: file già caricato`);
          return;
        }

        validFiles.push({
          id: generateDocumentId(),
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || "application/octet-stream",
          uploadedAt: new Date(),
          status: "pending",
        });
      });

      if (errors.length > 0) {
        setUploadError(errors.join(". "));
      }

      if (validFiles.length > 0) {
        onDocumentsChange([...documents, ...validFiles]);
      }
    },
    [documents, onDocumentsChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
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
      // Reset input
      e.target.value = "";
    },
    [processFiles]
  );

  const handleRemoveDocument = useCallback(
    (id: string) => {
      onDocumentsChange(documents.filter((doc) => doc.id !== id));
    },
    [documents, onDocumentsChange]
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) {
      return <File className="h-5 w-5 text-red-500" />;
    }
    return <FileText className="h-5 w-5 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Carica documenti</h3>
        <p className="text-sm text-muted-foreground">
          Carica i documenti da cui vuoi estrarre dati. Supportiamo PDF, Word,
          TXT e RTF.
        </p>
      </div>

      {/* Coming Soon Banner */}
      <div className="flex items-start gap-3 p-4 rounded-md bg-muted/50 border border-border">
        <Sparkles className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium">Estrazione automatica in arrivo</p>
          <p className="text-xs text-muted-foreground mt-1">
            Presto estrarremo automaticamente i dati dai tuoi documenti usando
            l'intelligenza artificiale. Per ora, i documenti vengono salvati per
            l'elaborazione futura.
          </p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-md p-8 text-center cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50",
          isLoading && "pointer-events-none opacity-50"
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
              isDragOver ? "bg-primary/10" : "bg-muted"
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
              {isDragOver ? "Rilascia i file qui" : "Trascina i file qui"}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              oppure{" "}
              <span className="text-primary font-medium">
                clicca per selezionare
              </span>
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            PDF, DOC, DOCX, TXT, RTF • Max 10MB per file • Max {MAX_FILES} file
          </p>
        </div>
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{uploadError}</p>
        </div>
      )}

      {/* Uploaded Documents List */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">
            Documenti caricati ({documents.length}/{MAX_FILES})
          </h4>

          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-md border bg-card group"
              >
                {/* File Icon */}
                <div className="shrink-0">{getFileIcon(doc.fileType)}</div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.fileName}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>•</span>
                    <StatusBadge status={doc.status} />
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100"
                  onClick={() => handleRemoveDocument(doc.id)}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Indietro
        </Button>
        <Button
          type="button"
          onClick={onComplete}
          disabled={isLoading}
          className="flex-1"
        >
          {documents.length === 0 ? (
            "Salta per ora"
          ) : (
            <>
              Completa registrazione
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Hint */}
      <p className="text-xs text-center text-muted-foreground">
        I documenti verranno elaborati dopo la registrazione
      </p>
    </div>
  );
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({ status }: { status: UploadedDocument["status"] }) {
  const config = {
    pending: {
      label: "In attesa",
      icon: null,
      className: "text-muted-foreground",
    },
    processing: {
      label: "Elaborazione...",
      icon: Loader2,
      className: "text-primary",
    },
    completed: {
      label: "Completato",
      icon: CheckCircle2,
      className: "text-green-600",
    },
    error: {
      label: "Errore",
      icon: AlertCircle,
      className: "text-destructive",
    },
  };

  const { label, icon: Icon, className } = config[status];

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {Icon && (
        <Icon
          className={cn("h-3 w-3", status === "processing" && "animate-spin")}
        />
      )}
      {label}
    </span>
  );
}
