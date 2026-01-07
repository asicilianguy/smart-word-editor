"use client";

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
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--brand-primary-subtle)] border border-[var(--brand-primary)]/20 flex items-center justify-center mb-4">
        <FolderOpen className="h-8 w-8 text-[var(--brand-primary)]" />
      </div>

      <h3 className="font-semibold text-lg mb-2">Il tuo vault è vuoto</h3>

      <p className="text-sm text-muted-foreground mb-6 max-w-[250px]">
        Aggiungi i tuoi dati per compilare i documenti in un attimo. Basta
        inserirli una volta sola.
      </p>

      <Button onClick={onAddClick} className="gap-2 mb-3">
        <Plus className="h-4 w-4" />
        Aggiungi il primo dato
      </Button>

      {onManageClick && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onManageClick}
          className="text-xs text-muted-foreground"
        >
          Gestisci vault
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      )}
    </div>
  );
}
