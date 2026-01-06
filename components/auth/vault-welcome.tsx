"use client";

import { ArrowRight, FileText, Database } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VaultWelcomeProps {
  onContinue: () => void;
  userName?: string;
}

/**
 * Schermata di benvenuto per il Vault
 *
 * Design sobrio: spiegazione funzionale senza linguaggio entusiasta
 */
export function VaultWelcome({ onContinue }: VaultWelcomeProps) {
  return (
    <div className="space-y-8 max-w-lg mx-auto">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-12 w-12 rounded-md bg-muted border border-border flex items-center justify-center">
          <Database className="h-6 w-6 text-foreground" />
        </div>

        <h1 className="text-2xl font-semibold">Configura il Vault</h1>

        <p className="text-muted-foreground">
          Il Vault è lo spazio dove salvare i dati che usi frequentemente nei
          documenti: ragione sociale, P.IVA, indirizzi, coordinate bancarie.
        </p>
      </div>

      {/* Come funziona */}
      <div className="bg-card border border-border rounded-md p-5 space-y-4">
        <h2 className="text-sm font-medium">Come funziona</h2>

        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 text-xs font-medium">
              1
            </div>
            <p className="text-sm text-muted-foreground">
              Inserisci i dati una sola volta nel Vault
            </p>
          </div>

          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 text-xs font-medium">
              2
            </div>
            <p className="text-sm text-muted-foreground">
              Quando modifichi un documento, seleziona il testo da sostituire
            </p>
          </div>

          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0 text-xs font-medium">
              3
            </div>
            <p className="text-sm text-muted-foreground">
              Scegli il valore dal Vault per inserirlo nel documento
            </p>
          </div>
        </div>
      </div>

      {/* Esempio visivo semplice */}
      <div className="bg-muted/50 border border-border rounded-md p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
          <FileText className="h-3.5 w-3.5" />
          Esempio
        </div>
        <div className="text-sm space-y-1">
          <p>
            La società{" "}
            <span className="bg-primary/20 text-primary px-1 rounded">
              Rossi S.r.l.
            </span>{" "}
            con sede in{" "}
            <span className="bg-primary/20 text-primary px-1 rounded">
              Via Roma 1, Milano
            </span>
            ...
          </p>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          I valori evidenziati vengono inseriti dal Vault
        </p>
      </div>

      {/* CTA */}
      <Button onClick={onContinue} className="w-full">
        Continua
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
