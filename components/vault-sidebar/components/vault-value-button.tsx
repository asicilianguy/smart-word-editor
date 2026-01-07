"use client";

import { cn } from "@/lib/utils";
import type { VaultValue } from "@/lib/document-types";
import type { ActionType } from "../types";

interface VaultValueButtonProps {
  value: VaultValue;
  onClick: () => void;
  canInteract: boolean;
  actionType: ActionType;
  isDemo?: boolean;
  isUserAdded?: boolean;
}

export function VaultValueButton({
  value,
  onClick,
  canInteract,
  actionType,
  isDemo = false,
  isUserAdded = false,
}: VaultValueButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={!canInteract}
      className={cn(
        "w-full text-left px-3 py-2 rounded-md text-sm transition-all",
        "border border-transparent",
        "group relative",
        canInteract
          ? [
              "hover:bg-[var(--brand-primary-subtle)] hover:border-[var(--brand-primary)]/30",
              "cursor-pointer",
              actionType === "replace" &&
                "hover:ring-2 hover:ring-[var(--brand-primary)]/20",
            ]
          : "opacity-60 cursor-not-allowed",
        isUserAdded && "bg-[var(--brand-primary-subtle)]/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Label */}
          <div className="flex items-center gap-1.5">
            <span className="font-medium text-foreground truncate">
              {value.label}
            </span>
            {isDemo && !isUserAdded && (
              <span className="text-[9px] text-muted-foreground bg-muted px-1 py-0.5 rounded flex-shrink-0">
                demo
              </span>
            )}
            {isUserAdded && (
              <span className="text-[9px] text-[var(--brand-primary)] bg-[var(--brand-primary-subtle)] px-1 py-0.5 rounded flex-shrink-0">
                tuo
              </span>
            )}
          </div>

          {/* Value (se diverso da label) */}
          {value.value !== value.label && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {value.value}
            </p>
          )}
        </div>

        {/* Azione indicator */}
        {canInteract && (
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0",
              actionType === "replace"
                ? "bg-amber-100 text-amber-700"
                : "bg-muted text-muted-foreground"
            )}
          >
            {actionType === "replace" ? "sostituisci" : "inserisci"}
          </span>
        )}
      </div>
    </button>
  );
}
