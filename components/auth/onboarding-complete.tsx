"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  FileText,
  Database,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VaultEntry, UploadedDocument } from "@/lib/auth-types";

interface OnboardingCompleteProps {
  entries: VaultEntry[];
  documents: UploadedDocument[];
  onFinish: () => void;
}

/**
 * Schermata di completamento onboarding
 *
 * Celebra il successo e mostra un riepilogo
 */
export function OnboardingComplete({
  entries,
  documents,
  onFinish,
}: OnboardingCompleteProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // Attiva animazione dopo un breve delay
    const timer = setTimeout(() => setShowConfetti(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const hasContent = entries.length > 0 || documents.length > 0;

  // Raggruppa entries per categoria
  const entriesByGroup = entries.reduce(
    (acc, entry) => {
      const group = entry.nameGroup || "Altro";
      if (!acc[group]) acc[group] = [];
      acc[group].push(entry);
      return acc;
    },
    {} as Record<string, VaultEntry[]>
  );

  return (
    <div className="space-y-8 text-center">
      {/* Success Icon */}
      <div
        className={cn(
          "relative inline-block transition-all duration-700",
          showConfetti ? "scale-100 opacity-100" : "scale-50 opacity-0"
        )}
      >
        <div className="h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
        </div>

        {/* Sparkles decoration */}
        {showConfetti && (
          <>
            <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500 animate-pulse" />
            <Sparkles className="absolute -bottom-1 -left-3 h-5 w-5 text-primary animate-pulse delay-100" />
          </>
        )}
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold">
          {hasContent ? "Perfetto, sei pronto!" : "Account creato!"}
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          {hasContent
            ? "La tua libreria è pronta. Ora puoi iniziare a lavorare sui tuoi documenti."
            : "Puoi iniziare subito. Quando vorrai, aggiungi i tuoi dati dalla dashboard."}
        </p>
      </div>

      {/* Summary */}
      {hasContent && (
        <div className="max-w-md mx-auto space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Ecco cosa hai aggiunto:
          </h3>

          <div className="grid gap-3">
            {/* Entries Summary */}
            {entries.length > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card border text-left">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Database className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {entries.length} dat{entries.length === 1 ? "o" : "i"} salvat
                    {entries.length === 1 ? "o" : "i"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {Object.keys(entriesByGroup).join(", ")}
                  </p>
                </div>
              </div>
            )}

            {/* Documents Summary */}
            {documents.length > 0 && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-card border text-left">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <FolderOpen className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    {documents.length} document
                    {documents.length === 1 ? "o" : "i"} caricat
                    {documents.length === 1 ? "o" : "i"}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {documents.map((d) => d.fileName).join(", ")}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* What's next */}
      <div className="max-w-md mx-auto p-4 rounded-xl bg-muted/50 space-y-2">
        <p className="text-sm font-medium">Cosa puoi fare ora:</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Carica un documento e inizia a modificarlo
          </li>
          <li className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Aggiungi altri dati quando ti servono
          </li>
        </ul>
      </div>

      {/* CTA */}
      <Button size="lg" className="h-14 px-8 text-base" onClick={onFinish}>
        Inizia a usare l'editor
        <ArrowRight className="h-5 w-5 ml-2" />
      </Button>
    </div>
  );
}
