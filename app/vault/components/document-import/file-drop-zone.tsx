"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("myData.fileDropZone");
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
          ? "border-(--brand-primary) bg-(--brand-primary)/5 scale-[1.02]"
          : "border-muted-foreground/25 hover:border-(--brand-primary)/50 hover:bg-muted/50",
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
              isDragOver ? "text-(--brand-primary)" : "text-muted-foreground"
            )}
          />
        </div>

        <div>
          <p className="font-medium">
            {isDragOver ? t("dropHere") : t("dragDocuments")}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("or")}{" "}
            <span className="text-(--brand-primary) font-medium">
              {t("clickToBrowse")}
            </span>
          </p>
        </div>

        <p className="text-xs text-muted-foreground">{t("constraints")}</p>
      </div>
    </div>
  );
}
