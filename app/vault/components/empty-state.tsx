"use client";

import { FolderOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-md bg-muted border border-border flex items-center justify-center mb-6">
        <FolderOpen className="h-6 w-6 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Il tuo vault è vuoto</h2>
      <p className="text-muted-foreground max-w-md mb-6">
        Inizia ad aggiungere i tuoi dati personali e aziendali. Potrai usarli
        per compilare rapidamente i tuoi documenti.
      </p>
      <Button onClick={onAddClick} size="lg" className="gap-2">
        <Plus className="h-5 w-5" />
        Aggiungi il primo valore
      </Button>
    </div>
  );
}
