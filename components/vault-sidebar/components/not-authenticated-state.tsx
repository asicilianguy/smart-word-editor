"use client";

import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotAuthenticatedStateProps {
  onLoginClick?: () => void;
}

export function NotAuthenticatedState({
  onLoginClick,
}: NotAuthenticatedStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <LogIn className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold mb-2">Accesso richiesto</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Effettua l&apos;accesso per visualizzare e gestire i tuoi dati salvati
        nel vault.
      </p>
      {onLoginClick && (
        <Button onClick={onLoginClick} className="gap-2">
          <LogIn className="h-4 w-4" />
          Accedi
        </Button>
      )}
    </div>
  );
}
