"use client";

import { PenLine, FolderOpen, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VaultPopulationMethod } from "@/lib/auth-types";
import { useState } from "react";

interface MethodChoiceProps {
  onSelect: (method: VaultPopulationMethod) => void;
  onBack: () => void;
  onSkip: () => void;
}

interface MethodOption {
  id: VaultPopulationMethod;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const options: MethodOption[] = [
  {
    id: "manual",
    icon: PenLine,
    title: "Inserimento manuale",
    description: "Aggiungi i dati uno alla volta",
  },
  {
    id: "upload",
    icon: FolderOpen,
    title: "Carica documenti",
    description: "Estrai i dati da documenti esistenti",
  },
];

/**
 * Scelta del metodo di inserimento
 *
 * Design sobrio con due opzioni principali e skip secondario
 */
export function MethodChoice({ onSelect, onBack, onSkip }: MethodChoiceProps) {
  const [selected, setSelected] = useState<VaultPopulationMethod | null>(null);

  const handleSelect = (method: VaultPopulationMethod) => {
    setSelected(method);
  };

  const handleContinue = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-xl font-semibold">Come vuoi aggiungere i dati?</h1>
        <p className="text-sm text-muted-foreground">
          Scegli il metodo che preferisci. Potrai cambiare in seguito.
        </p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {options.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              className={cn(
                "w-full text-left p-4 rounded-md border transition-colors",
                "hover:border-primary hover:bg-accent",
                "focus:outline-none focus:ring-1 focus:ring-ring",
                isSelected
                  ? "border-primary bg-accent"
                  : "border-border bg-card"
              )}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div
                  className={cn(
                    "h-10 w-10 rounded-md flex items-center justify-center shrink-0 border",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-muted border-border text-muted-foreground"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{option.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>

                {/* Radio indicator */}
                <div
                  className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
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

      {/* Actions */}
      <div className="space-y-2">
        <Button
          onClick={handleContinue}
          className="w-full"
          disabled={!selected}
        >
          Continua
        </Button>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            className="flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            className="flex-1 text-muted-foreground"
          >
            Salta per ora
          </Button>
        </div>
      </div>
    </div>
  );
}
