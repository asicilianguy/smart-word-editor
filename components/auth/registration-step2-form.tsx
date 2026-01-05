"use client";

import { useState } from "react";
import {
  Keyboard,
  Upload,
  SkipForward,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VaultPopulationMethod, VaultEntry, UploadedDocument } from "@/lib/auth-types";
import { ManualEntryForm } from "./manual-entry-form";
import { DocumentUploader } from "./document-uploader";

// ============================================================================
// TYPES
// ============================================================================

interface MethodOption {
  id: VaultPopulationMethod;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  recommended?: boolean;
}

const methodOptions: MethodOption[] = [
  {
    id: "manual",
    title: "Inserimento manuale",
    description:
      "Aggiungi i tuoi dati uno alla volta. Perfetto per iniziare con pochi valori essenziali.",
    icon: Keyboard,
  },
  {
    id: "upload",
    title: "Carica documenti",
    description:
      "Carica documenti esistenti. Estrarremo automaticamente i dati rilevanti.",
    icon: Upload,
    recommended: true,
  },
  {
    id: "skip",
    title: "Salta per ora",
    description:
      "Potrai sempre aggiungere dati in seguito dalla dashboard.",
    icon: SkipForward,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

interface RegistrationStep2FormProps {
  onSubmit: (method: VaultPopulationMethod, entries: VaultEntry[], documents: UploadedDocument[]) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function RegistrationStep2Form({
  onSubmit,
  onBack,
  isLoading = false,
}: RegistrationStep2FormProps) {
  const [selectedMethod, setSelectedMethod] = useState<VaultPopulationMethod | null>(null);
  const [step, setStep] = useState<"choose" | "execute">("choose");
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  const handleMethodSelect = (method: VaultPopulationMethod) => {
    setSelectedMethod(method);
    if (method === "skip") {
      // Salta direttamente alla fine
      onSubmit("skip", [], []);
    } else {
      setStep("execute");
    }
  };

  const handleComplete = () => {
    if (selectedMethod) {
      onSubmit(selectedMethod, entries, documents);
    }
  };

  const handleBackToChoose = () => {
    setStep("choose");
    setSelectedMethod(null);
  };

  // Step: Scelta metodo
  if (step === "choose") {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Configura il tuo Vault</h3>
          <p className="text-sm text-muted-foreground">
            Il Vault contiene i dati che potrai inserire nei documenti con un
            click. Come preferisci iniziare?
          </p>
        </div>

        {/* Method Options */}
        <div className="space-y-3">
          {methodOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedMethod === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleMethodSelect(option.id)}
                disabled={isLoading}
                className={cn(
                  "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
                  "hover:border-primary/50 hover:bg-accent/50",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "h-12 w-12 rounded-lg flex items-center justify-center shrink-0",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{option.title}</h4>
                      {option.recommended && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          <Sparkles className="h-3 w-3" />
                          Consigliato
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Back Button */}
        <Button
          type="button"
          variant="ghost"
          onClick={onBack}
          disabled={isLoading}
          className="w-full"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Torna indietro
        </Button>
      </div>
    );
  }

  // Step: Esecuzione metodo selezionato
  return (
    <div className="space-y-6">
      {selectedMethod === "manual" && (
        <ManualEntryForm
          entries={entries}
          onEntriesChange={setEntries}
          onComplete={handleComplete}
          onBack={handleBackToChoose}
          isLoading={isLoading}
        />
      )}

      {selectedMethod === "upload" && (
        <DocumentUploader
          documents={documents}
          onDocumentsChange={setDocuments}
          onComplete={handleComplete}
          onBack={handleBackToChoose}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
