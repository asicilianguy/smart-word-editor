"use client";

import { Button } from "@/components/ui/button";
import type { VaultValue } from "@/lib/document-types";
import type { ActionType } from "../types";
import { cn } from "@/lib/utils";

interface VaultValueButtonProps {
  value: VaultValue;
  onClick: () => void;
  canInteract: boolean;
  actionType: ActionType;
  isDemo?: boolean;
}

export function VaultValueButton({
  value,
  onClick,
  canInteract,
  actionType,
  isDemo = false,
}: VaultValueButtonProps) {
  const isReplace = actionType === "replace";

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start text-left h-auto py-2.5 px-3 transition-all duration-150",
        canInteract
          ? isReplace
            ? "hover:bg-green-100 dark:hover:bg-green-900/40 hover:text-green-900 dark:hover:text-green-100 hover:border-green-300 dark:hover:border-green-700 border border-transparent cursor-pointer"
            : "hover:bg-accent hover:text-accent-foreground cursor-pointer"
          : "opacity-40 cursor-not-allowed",
        isDemo && "border border-dashed border-muted-foreground/30"
      )}
      onClick={canInteract ? onClick : undefined}
      disabled={!canInteract}
      title={
        isDemo
          ? "Dato di esempio - Aggiungi i tuoi dati reali!"
          : actionType === "replace"
          ? `Sostituisci con: ${value.value}`
          : actionType === "insert"
          ? `Inserisci: ${value.value}`
          : "Seleziona testo nel documento per attivare"
      }
    >
      <div className="flex flex-col items-start gap-1 w-full">
        <div className="flex items-center gap-2 w-full">
          <span
            className={cn(
              "text-sm font-medium flex-1",
              isReplace && canInteract && "text-green-800 dark:text-green-300",
              isDemo && "italic"
            )}
          >
            {value.label}
          </span>
          {isDemo && (
            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              esempio
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground line-clamp-2 break-all">
          {value.value}
        </span>
      </div>
    </Button>
  );
}
