"use client";

import { CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationResult } from "./types";

interface ValidationStatusProps {
  result: ValidationResult;
}

export function ValidationStatus({ result }: ValidationStatusProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-xl border",
        result.is_valid
          ? "bg-green-50 border-green-200"
          : "bg-amber-50 border-amber-200"
      )}
    >
      {result.is_valid ? (
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
      )}

      <div className="flex-1">
        <p
          className={cn(
            "font-medium",
            result.is_valid ? "text-green-800" : "text-amber-800"
          )}
        >
          {result.is_valid
            ? `Documenti validi: ${result.total_pages} pagine totali`
            : result.error || "Validazione fallita"}
        </p>

        {result.is_valid && (
          <p className="text-sm text-green-600 mt-0.5">
            Pronto per estrarre i dati
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <span>
          {result.total_pages}/{result.max_pages} pagine
        </span>
      </div>
    </div>
  );
}
