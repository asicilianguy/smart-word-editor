"use client";

import { useTranslations } from "next-intl";
import { Plus, FolderOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyAuthenticatedStateProps {
  onAddClick: () => void;
  onManageClick?: () => void;
}

export function EmptyAuthenticatedState({
  onAddClick,
  onManageClick,
}: EmptyAuthenticatedStateProps) {
  const t = useTranslations("sidebar.empty");

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-(--brand-primary-subtle) border border-(--brand-primary)/20 flex items-center justify-center mb-4">
        <FolderOpen className="h-8 w-8 text-(--brand-primary)" />
      </div>

      <h3 className="font-semibold text-lg mb-2">{t("title")}</h3>

      <p className="text-sm text-muted-foreground mb-6 max-w-[250px]">
        {t("description")}
      </p>

      <Button onClick={onAddClick} className="gap-2 mb-3">
        <Plus className="h-4 w-4" />
        {t("addButton")}
      </Button>

      {onManageClick && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onManageClick}
          className="text-xs text-muted-foreground"
        >
          {t("manageButton")}
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      )}
    </div>
  );
}
