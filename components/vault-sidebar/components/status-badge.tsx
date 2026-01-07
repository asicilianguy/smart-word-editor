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
        <div className="flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 rounded-md">
          <Type className="h-4 w-4 flex-shrink-0" />
          <span>
            Clicca un valore per <strong>sostituire</strong> il testo
          </span>
        </div>
        {selectedText && (
          <div className="text-xs bg-card px-3 py-2 rounded-md border border-border">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-muted-foreground">Selezionato: </span>
                <span className="font-medium line-clamp-1">
                  &quot;{selectedText}&quot;
                </span>
              </div>
              {onSaveSelected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs shrink-0 text-[var(--brand-primary)] hover:text-[var(--brand-primary-hover)] hover:bg-[var(--brand-primary-subtle)]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSaveSelected();
                  }}
                  title={
                    isDemo
                      ? "Aggiungi questo testo ai dati demo"
                      : "Salva questo testo nel vault"
                  }
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {isDemo ? "Aggiungi" : "Salva"}
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
      <div className="flex items-center gap-2 text-xs bg-[var(--brand-primary-subtle)] text-[var(--brand-primary-hover)] px-3 py-2 rounded-md border border-[var(--brand-primary)]/20">
        <MousePointer2 className="h-4 w-4 flex-shrink-0" />
        <span>
          Cursore attivo — clicca un valore per <strong>inserirlo</strong>
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
