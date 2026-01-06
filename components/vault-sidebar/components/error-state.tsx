"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: string;
  onRefresh?: () => Promise<void>;
}

export function ErrorState({ error, onRefresh }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-12 h-12 rounded-md bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <h3 className="font-semibold mb-2">Errore di caricamento</h3>
      <p className="text-sm text-muted-foreground mb-4">{error}</p>
      {onRefresh && (
        <Button variant="outline" onClick={onRefresh}>
          Riprova
        </Button>
      )}
    </div>
  );
}
