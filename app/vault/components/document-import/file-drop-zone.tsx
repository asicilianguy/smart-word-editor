"use client";

import { useCallback } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  disabled?: boolean;
  maxFiles: number;
  currentFileCount: number;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];

export function FileDropZone({
  onFilesSelected,
  disabled,
  maxFiles,
  currentFileCount,
  fileInputRef,
}: FileDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (!disabled && e.dataTransfer.files.length > 0) {
        onFilesSelected(e.dataTransfer.files);
      }
    },
    [disabled, onFilesSelected]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesSelected(e.target.files);
      }
      e.target.value = "";
    },
    [onFilesSelected]
  );

  const canAddMore = currentFileCount < maxFiles;

  if (!canAddMore) return null;

  return (
    <div
      onClick={() => !disabled && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
        isDragOver
          ? "border-[var(--brand-primary)] bg-(--brand-primary)/5 scale-[1.02]"
          : "border-muted-foreground/25 hover:border-[var(--brand-primary)]/50 hover:bg-muted/50",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-3">
        <div
          className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center transition-colors",
            isDragOver ? "bg-(--brand-primary)/20" : "bg-muted"
          )}
        >
          <Upload
            className={cn(
              "h-6 w-6 transition-colors",
              isDragOver
                ? "text-[var(--brand-primary)]"
                : "text-muted-foreground"
            )}
          />
        </div>

        <div>
          <p className="font-medium">
            {isDragOver ? "Rilascia qui" : "Trascina i documenti"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            oppure{" "}
            <span className="text-[var(--brand-primary)] font-medium">
              clicca per sfogliare
            </span>
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          PDF, Word • Max 10MB • Max 3 file • Max 15 pagine/documento
        </p>
      </div>
    </div>
  );
}

import { useState } from "react";
