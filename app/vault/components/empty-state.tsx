"use client";

import { useTranslations } from "next-intl";
import { Database, Plus, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  const t = useTranslations("myData.emptyState");

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-(--brand-primary)/10 flex items-center justify-center mb-6">
        <Database className="h-8 w-8 text-(--brand-primary)" />
      </div>

      <h2 className="text-xl font-semibold mb-2 text-center">{t("title")}</h2>

      <p className="text-muted-foreground text-center max-w-md mb-8">
        {t("description")}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onAddClick}
          className="gap-2 bg-(--brand-primary) hover:bg-(--brand-primary-hover) text-white"
        >
          <Plus className="h-5 w-5" />
          {t("addManually")}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center max-w-sm">
        {t("tip")}
      </p>
    </div>
  );
}
