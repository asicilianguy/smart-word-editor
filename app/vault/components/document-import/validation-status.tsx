"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ValidationResult } from "./types";

interface ValidationStatusProps {
  result: ValidationResult;
}

export function ValidationStatus({ result }: ValidationStatusProps) {
  const t = useTranslations("myData.validationStatus");

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
            ? t("valid", { pages: result.total_pages })
            : result.error || t("failed")}
        </p>

        {result.is_valid && (
          <p className="text-sm text-green-600 mt-0.5">{t("readyToExtract")}</p>
        )}
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <FileText className="h-3.5 w-3.5" />
        <span>
          {t("pagesCount", {
            current: result.total_pages,
            max: result.max_pages,
          })}
        </span>
      </div>
    </div>
  );
}
