// components/vault-sidebar/components/not-authenticated-state.tsx

"use client";

import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotAuthenticatedStateProps {
  onAuthClick?: () => void;
}

export function NotAuthenticatedState({
  onAuthClick,
}: NotAuthenticatedStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-xs">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Accedi per usare il Vault</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Salva i tuoi dati una volta e usali per compilare qualsiasi documento.
        </p>
        {onAuthClick && (
          <Button
            onClick={onAuthClick}
            className="bg-(--brand-primary) hover:bg-(--brand-primary-hover)"
          >
            Accedi o registrati
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}
