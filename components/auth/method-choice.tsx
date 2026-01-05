"use client";

import { useState } from "react";
import {
  PenLine,
  FolderOpen,
  ArrowRight,
  ArrowLeft,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { VaultPopulationMethod } from "@/lib/auth-types";

interface MethodChoiceProps {
  onSelect: (method: VaultPopulationMethod) => void;
  onBack: () => void;
  onSkip: () => void;
}

/**
 * Scelta del metodo di inserimento
 *
 * Solo 2 opzioni principali (manuale e upload)
 * Skip è presente ma secondario
 * Linguaggio friendly e non intimidatorio
 */
export function MethodChoice({ onSelect, onBack, onSkip }: MethodChoiceProps) {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-2xl sm:text-3xl font-bold">
          Come preferisci iniziare?
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Scegli il modo più comodo per te. Puoi sempre cambiare idea dopo.
        </p>
      </div>

      {/* Options */}
      <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {/* Opzione Manuale */}
        <MethodCard
          id="manual"
          icon={PenLine}
          title="Scrivo io"
          subtitle="Consigliato per iniziare"
          description="Inserisci i dati che usi più spesso: ragione sociale, P.IVA, indirizzi..."
          benefits={[
            "Inizi subito con i dati essenziali",
            "Aggiungi solo quello che ti serve",
          ]}
          isHovered={hoveredMethod === "manual"}
          onHover={setHoveredMethod}
          onClick={() => onSelect("manual")}
          recommended
        />

        {/* Opzione Upload */}
        <MethodCard
          id="upload"
          icon={FolderOpen}
          title="Ho già dei documenti"
          subtitle="Per chi ha tutto pronto"
          description="Carica documenti che usi spesso. Li teniamo pronti per quando ti serviranno."
          benefits={[
            "Carica PDF, Word o altri file",
            "Li ritrovi sempre qui",
          ]}
          isHovered={hoveredMethod === "upload"}
          onHover={setHoveredMethod}
          onClick={() => onSelect("upload")}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="order-2 sm:order-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Indietro
        </Button>

        <Button
          variant="link"
          onClick={onSkip}
          className="order-3 sm:order-2 text-muted-foreground"
        >
          Preferisco farlo dopo
          <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Rassicurazione */}
      <p className="text-center text-xs text-muted-foreground">
        <Clock className="h-3 w-3 inline mr-1" />
        Potrai sempre aggiungere, modificare o eliminare i tuoi dati
      </p>
    </div>
  );
}

interface MethodCardProps {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  description: string;
  benefits: string[];
  isHovered: boolean;
  onHover: (id: string | null) => void;
  onClick: () => void;
  recommended?: boolean;
}

function MethodCard({
  id,
  icon: Icon,
  title,
  subtitle,
  description,
  benefits,
  isHovered,
  onHover,
  onClick,
  recommended,
}: MethodCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => onHover(id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "relative text-left p-6 rounded-2xl border-2 transition-all duration-200",
        "hover:border-primary hover:shadow-lg hover:shadow-primary/5",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        isHovered ? "border-primary bg-primary/5" : "border-border bg-card"
      )}
    >
      {/* Badge consigliato */}
      {recommended && (
        <div className="absolute -top-3 left-6 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
          <Sparkles className="h-3 w-3" />
          Consigliato
        </div>
      )}

      <div className="space-y-4">
        {/* Icon */}
        <div
          className={cn(
            "h-14 w-14 rounded-xl flex items-center justify-center transition-colors",
            isHovered ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          <Icon className="h-6 w-6" />
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground">{description}</p>

        {/* Benefits */}
        <ul className="space-y-2">
          {benefits.map((benefit, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm"
            >
              <div className="h-5 w-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 mt-0.5">
                <svg
                  className="h-3 w-3 text-green-600 dark:text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        {/* CTA Arrow */}
        <div
          className={cn(
            "flex items-center gap-2 text-sm font-medium transition-colors",
            isHovered ? "text-primary" : "text-muted-foreground"
          )}
        >
          Scegli questo
          <ArrowRight
            className={cn(
              "h-4 w-4 transition-transform",
              isHovered && "translate-x-1"
            )}
          />
        </div>
      </div>
    </button>
  );
}
