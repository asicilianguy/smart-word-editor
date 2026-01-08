"use client";

import {
  File,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UploadedFile } from "./types";

interface FileListProps {
  files: UploadedFile[];
  onRemove: (id: string) => void;
  canRemove: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileList({ files, onRemove, canRemove }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl border bg-card group transition-colors",
            file.status === "error" && "border-destructive/50 bg-destructive/5",
            file.status === "done" && "border-green-500/50 bg-green-50/50",
            file.status === "validated" && "border-[var(--brand-primary)]/50"
          )}
        >
          {/* Icon */}
          <div
            className={cn(
              "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
              file.status === "error" ? "bg-destructive/10" : "bg-muted"
            )}
          >
            {file.name.toLowerCase().endsWith(".pdf") ? (
              <File className="h-5 w-5 text-red-500" />
            ) : (
              <FileText className="h-5 w-5 text-blue-500" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatSize(file.size)}
              {file.pageCount !== undefined && file.pageCount > 0 && (
                <span className="ml-2 text-[var(--brand-primary)]">
                  • {file.pageCount} pagin{file.pageCount === 1 ? "a" : "e"}
                </span>
              )}
              {file.error && (
                <span className="ml-2 text-destructive">• {file.error}</span>
              )}
            </p>
          </div>

          {/* Status / Actions */}
          {file.status === "validating" || file.status === "extracting" ? (
            <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-primary)]" />
          ) : file.status === "done" ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : file.status === "validated" ? (
            <CheckCircle2 className="h-5 w-5 text-[var(--brand-primary)]" />
          ) : file.status === "error" ? (
            <AlertCircle className="h-5 w-5 text-destructive" />
          ) : canRemove ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(file.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
