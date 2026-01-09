"use client";

import { useTranslations } from "next-intl";
import { MousePointer2, Type, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionType } from "../types";

interface StatusBadgeProps {
  actionType: ActionType;
  selectedText?: string;
  onSaveSelected?: () => void;
  isDemo?: boolean;
}

export function StatusBadge({
  actionType,
  selectedText,
  onSaveSelected,
  isDemo = false,
}: StatusBadgeProps) {
  const t = useTranslations("sidebar.status");

  if (actionType === "replace") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-md">
          <Type className="h-4 w-4 shrink-0" />
          <span dangerouslySetInnerHTML={{ __html: t.raw("replaceHint") }} />
        </div>
        {selectedText && (
          <div className="text-xs bg-card px-3 py-2 rounded-md border border-border">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground">{t("selected")} </span>
                <span className="font-medium line-clamp-1">
                  &quot;{selectedText}&quot;
                </span>
              </div>
              {onSaveSelected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs shrink-0 text-(--brand-primary) hover:text-(--brand-primary-hover) hover:bg-(--brand-primary-subtle)"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSaveSelected();
                  }}
                  title={isDemo ? t("saveTooltipDemo") : t("saveTooltip")}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {isDemo ? t("addButton") : t("saveButton")}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (actionType === "insert") {
    return (
      <div className="flex items-center gap-2 text-xs bg-(--brand-primary-subtle) text-(--brand-primary-hover) px-3 py-2 rounded-md border border-(--brand-primary)/20">
        <MousePointer2 className="h-4 w-4 shrink-0" />
        <span dangerouslySetInnerHTML={{ __html: t.raw("insertHint") }} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md">
      <MousePointer2 className="h-4 w-4 shrink-0" />
      <span>{t("defaultHint")}</span>
    </div>
  );
}
