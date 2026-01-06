"use client";

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
  if (actionType === "replace") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-3 py-2 rounded-md border border-green-300 dark:border-green-700 animate-in fade-in slide-in-from-top-1 duration-200">
          <Type className="h-4 w-4 flex-shrink-0" />
          <span className="font-medium">
            Clicca un valore per <strong>sostituire</strong>
          </span>
        </div>
        {selectedText && (
          <div className="text-xs bg-white dark:bg-card px-3 py-2 rounded border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground">Selezionato: </span>
                <span className="font-medium text-green-700 dark:text-green-400 line-clamp-1">
                  &quot;{selectedText}&quot;
                </span>
              </div>
              {onSaveSelected && !isDemo && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs shrink-0 text-primary hover:text-primary/80 hover:bg-primary/10"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSaveSelected();
                  }}
                  title="Salva questo testo nel vault"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Salva
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
      <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-md border border-blue-200 dark:border-blue-700">
        <MousePointer2 className="h-4 w-4 flex-shrink-0" />
        <span>
          Cursore attivo — clicca per <strong>inserire</strong>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md">
      <MousePointer2 className="h-4 w-4 flex-shrink-0" />
      <span>Seleziona testo nel documento per sostituirlo</span>
    </div>
  );
}
