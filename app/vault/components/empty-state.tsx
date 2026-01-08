"use client";

import { Database, Plus, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-[var(--brand-primary)]/10 flex items-center justify-center mb-6">
        <Database className="h-8 w-8 text-[var(--brand-primary)]" />
      </div>

      <h2 className="text-xl font-semibold mb-2 text-center">
        Il tuo vault è vuoto
      </h2>

      <p className="text-muted-foreground text-center max-w-md mb-8">
        Aggiungi i tuoi dati personali e aziendali, oppure importali
        automaticamente da documenti esistenti.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onAddClick}
          className="gap-2 bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-white"
        >
          <Plus className="h-5 w-5" />
          Aggiungi manualmente
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-6 text-center max-w-sm">
        Suggerimento: usa la sezione &quot;Importa da documenti&quot; qui sopra
        per estrarre automaticamente i dati da fatture, contratti o altri
        documenti.
      </p>
    </div>
  );
}
