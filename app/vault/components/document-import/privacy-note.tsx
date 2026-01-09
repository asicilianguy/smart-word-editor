"use client";

import { useTranslations } from "next-intl";
import { Shield, Lock, Eye, Trash2 } from "lucide-react";

interface PrivacyNoteProps {
  variant?: "compact" | "full";
}

export function PrivacyNote({ variant = "compact" }: PrivacyNoteProps) {
  const t = useTranslations("myData.privacyNote");

  if (variant === "compact") {
    return (
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        <span>{t("compact")}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Shield className="h-4 w-4 text-(--brand-primary)" />
        {t("title")}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
        <div className="flex items-start gap-2">
          <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-(--brand-primary)" />
          <span>{t("processed")}</span>
        </div>
        <div className="flex items-start gap-2">
          <Eye className="h-3.5 w-3.5 mt-0.5 shrink-0 text-(--brand-primary)" />
          <span>{t("control")}</span>
        </div>
        <div className="flex items-start gap-2">
          <Trash2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-(--brand-primary)" />
          <span>{t("delete")}</span>
        </div>
      </div>
    </div>
  );
}
