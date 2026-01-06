"use client";

import { useState } from "react";
import { Keyboard, Upload, SkipForward, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type {
  VaultPopulationMethod,
  VaultEntry,
  UploadedDocument,
} from "@/lib/auth-types";
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
}

const methodOptions: MethodOption[] = [
  {
    id: "manual",
    title: "Inserimento manuale",
    description: "Aggiungi i dati uno alla volta",
    icon: Keyboard,
  },
  {
    id: "upload",
    title: "Carica documenti",
    description: "Estrazione automatica dai documenti",
    icon: Upload,
  },
  {
    id: "skip",
    title: "Salta per ora",
    description: "Potrai aggiungere dati in seguito",
    icon: SkipForward,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

interface RegistrationStep2FormProps {
  onSubmit: (
    method: VaultPopulationMethod,
    entries: VaultEntry[],
    documents: UploadedDocument[]
  ) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function RegistrationStep2Form({
  onSubmit,
  onBack,
  isLoading = false,
}: RegistrationStep2FormProps) {
  const [selectedMethod, setSelectedMethod] =
    useState<VaultPopulationMethod | null>(null);
  const [step, setStep] = useState<"choose" | "execute">("choose");
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  const handleMethodSelect = (method: VaultPopulationMethod) => {
    setSelectedMethod(method);
    if (method === "skip") {
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
      <div className="space-y-5">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">Configura il Vault</h3>
          <p className="text-sm text-muted-foreground">
            Il Vault contiene i dati da inserire nei documenti
          </p>
        </div>

        {/* Method Options */}
        <div className="space-y-2">
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
                  "w-full text-left p-3 rounded-md border transition-colors",
                  "hover:border-primary hover:bg-accent",
                  "focus:outline-none focus:ring-1 focus:ring-ring",
                  isSelected
                    ? "border-primary bg-accent"
                    : "border-border bg-card",
                  isLoading && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-3">
                  {/* Icon */}
                  <div
                    className={cn(
                      "h-9 w-9 rounded-md flex items-center justify-center shrink-0 border",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "bg-muted border-border text-muted-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium">{option.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {option.description}
                    </p>
                  </div>

                  {/* Radio indicator */}
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
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
          Indietro
        </Button>
      </div>
    );
  }

  // Step: Esecuzione metodo selezionato
  return (
    <div className="space-y-5">
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
