"use client";

import { CheckCircle2, ArrowRight, FileText, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VaultEntry, UploadedDocument } from "@/lib/auth-types";

interface OnboardingCompleteProps {
  entries: VaultEntry[];
  documents: UploadedDocument[];
  onFinish: () => void;
}

/**
 * Schermata di completamento onboarding
 *
 * Design sobrio: conferma funzionale senza celebrazioni eccessive
 */
export function OnboardingComplete({
  entries,
  documents,
  onFinish,
}: OnboardingCompleteProps) {
  const hasContent = entries.length > 0 || documents.length > 0;

  // Raggruppa entries per categoria
  const entriesByGroup = entries.reduce((acc, entry) => {
    const group = entry.nameGroup || "Altro";
    if (!acc[group]) acc[group] = [];
    acc[group].push(entry);
    return acc;
  }, {} as Record<string, VaultEntry[]>);

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">
          {hasContent ? "Configurazione completata" : "Account creato"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {hasContent
            ? "Il Vault è pronto. Puoi iniziare a lavorare sui documenti."
            : "Puoi aggiungere i dati al Vault in qualsiasi momento."}
        </p>
      </div>

      {/* Riepilogo dati (se presenti) */}
      {hasContent && (
        <div className="bg-card border border-border rounded-md p-4 space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            Riepilogo dati salvati
          </h3>

          <div className="space-y-2">
            {Object.entries(entriesByGroup).map(([group, groupEntries]) => (
              <div key={group} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{group}</span>
                <span className="font-medium">
                  {groupEntries.length}{" "}
                  {groupEntries.length === 1 ? "voce" : "voci"}
                </span>
              </div>
            ))}

            {documents.length > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  Documenti caricati
                </span>
                <span className="font-medium">{documents.length}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTA */}
      <Button onClick={onFinish} className="w-full">
        Vai all'editor
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}
