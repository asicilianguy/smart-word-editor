"use client";

import { useState } from "react";
import {
  Zap,
  Clock,
  Shield,
  ArrowRight,
  MousePointerClick,
  FileText,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VaultWelcomeProps {
  onContinue: () => void;
  userName?: string;
}

/**
 * Schermata di benvenuto per il Vault
 *
 * Obiettivo: Spiegare il beneficio senza spaventare
 * - Linguaggio semplice e diretto
 * - Focus sul risparmio di tempo
 * - Nessun termine tecnico o intimidatorio
 */
export function VaultWelcome({ onContinue, userName }: VaultWelcomeProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleContinue = () => {
    setIsAnimating(true);
    setTimeout(onContinue, 300);
  };

  return (
    <div
      className={cn(
        "space-y-10 transition-all duration-300",
        isAnimating && "opacity-0 translate-y-4"
      )}
    >
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
          <Zap className="h-4 w-4" />
          Ultimo passaggio
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {userName ? `${userName}, creiamo` : "Creiamo"} la tua
          <br />
          <span className="text-primary">libreria personale</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Salva i dati che usi più spesso nei tuoi documenti.
          <br />
          La prossima volta, li inserisci con un click.
        </p>
      </div>

      {/* Visual Demo */}
      <div className="relative bg-card rounded-2xl border shadow-sm p-8 max-w-lg mx-auto">
        {/* Mini documento simulato */}
        <div className="bg-background rounded-lg border p-6 space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            <span>Esempio documento</span>
          </div>

          <div className="space-y-3 text-sm">
            <p>
              La società{" "}
              <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">
                Rossi S.r.l.
              </span>{" "}
              con sede in{" "}
              <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">
                Via Roma 123, Milano
              </span>
            </p>
            <p>
              P.IVA{" "}
              <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium">
                IT01234567890
              </span>
            </p>
          </div>
        </div>

        {/* Freccia e click indicator */}
        <div className="absolute -right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <div className="h-px w-8 bg-border" />
          <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
            <MousePointerClick className="h-4 w-4" />
          </div>
        </div>

        {/* Badge "1 click" */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full shadow-lg">
          Inseriti in 1 click!
        </div>
      </div>

      {/* Benefits - semplici e diretti */}
      <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
        <BenefitCard
          icon={Clock}
          title="Risparmi tempo"
          description="Non cerchi più i dati ogni volta"
        />
        <BenefitCard
          icon={CheckCircle}
          title="Zero errori"
          description="Sempre i dati giusti, sempre uguali"
        />
        <BenefitCard
          icon={Shield}
          title="Solo per te"
          description="Salvati sul tuo dispositivo"
        />
      </div>

      {/* CTA */}
      <div className="text-center space-y-4">
        <Button size="lg" className="h-14 px-8 text-base" onClick={handleContinue}>
          Iniziamo
          <ArrowRight className="h-5 w-5 ml-2" />
        </Button>

        <p className="text-sm text-muted-foreground">
          Ci vogliono 2 minuti • Puoi sempre aggiungerne altri dopo
        </p>
      </div>
    </div>
  );
}

function BenefitCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center space-y-2">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
