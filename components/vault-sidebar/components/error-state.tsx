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
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="font-semibold mb-2">Errore di caricamento</h3>
      <p className="text-sm text-muted-foreground mb-4">{error}</p>
      {onRefresh && (
        <Button variant="outline" onClick={onRefresh} className="gap-2">
          Riprova
        </Button>
      )}
    </div>
  );
}
