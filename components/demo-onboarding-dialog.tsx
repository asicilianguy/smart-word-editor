"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MousePointer2, Type, ArrowRight, Sparkles } from "lucide-react";

interface DemoOnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoOnboardingDialog({
  open,
  onOpenChange,
}: DemoOnboardingDialogProps) {
  const [step, setStep] = useState(0);

  // Reset step quando si apre
  useEffect(() => {
    if (open) {
      setStep(0);
    }
  }, [open]);

  const handleNext = () => {
    if (step < 1) {
      setStep(step + 1);
    } else {
      onOpenChange(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] gap-0">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-8 w-8 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-xl">
              {step === 0 ? "Come inserire i dati" : "Come sostituire il testo"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {step === 0
              ? "Il modo più semplice per compilare un documento"
              : "Se devi modificare del testo già presente"}
          </DialogDescription>
        </DialogHeader>

        {/* Step 0: Inserimento */}
        {step === 0 && (
          <div className="py-6 space-y-5">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[var(--brand-primary-subtle)] flex items-center justify-center">
                  <span className="text-lg font-semibold text-[var(--brand-primary)]">
                    1
                  </span>
                </div>
                <div>
                  <p className="font-medium mb-1">Clicca dove vuoi scrivere</p>
                  <p className="text-sm text-muted-foreground">
                    Posiziona il cursore nel punto del documento dove vuoi
                    aggiungere il testo
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[var(--brand-primary-subtle)] flex items-center justify-center">
                  <span className="text-lg font-semibold text-[var(--brand-primary)]">
                    2
                  </span>
                </div>
                <div>
                  <p className="font-medium mb-1">Inserisci il dato</p>
                  <p className="text-sm text-muted-foreground">
                    Scrivi con la tastiera, oppure clicca su un valore dalla
                    barra a destra per inserirlo automaticamente
                  </p>
                </div>
              </div>
            </div>

            {/* Visual hint */}
            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-md border">
                <MousePointer2 className="h-4 w-4" />
                <span>Clicca</span>
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="flex items-center gap-1.5 bg-card px-3 py-1.5 rounded-md border">
                <Type className="h-4 w-4" />
                <span>Scrivi o scegli</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Sostituzione */}
        {step === 1 && (
          <div className="py-6 space-y-5">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-lg font-semibold text-amber-700">
                    1
                  </span>
                </div>
                <div>
                  <p className="font-medium mb-1">
                    Seleziona il testo da cambiare
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Clicca e trascina con il mouse per evidenziare il testo che
                    vuoi sostituire
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-lg font-semibold text-amber-700">
                    2
                  </span>
                </div>
                <div>
                  <p className="font-medium mb-1">Sostituisci</p>
                  <p className="text-sm text-muted-foreground">
                    Scrivi il nuovo testo, oppure clicca un valore dalla barra a
                    destra per sostituirlo
                  </p>
                </div>
              </div>
            </div>

            {/* Visual hint */}
            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground pt-2">
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-md border border-amber-200">
                <MousePointer2 className="h-4 w-4" />
                <span>Seleziona</span>
              </div>
              <ArrowRight className="h-4 w-4" />
              <div className="flex items-center gap-1.5 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-md border border-amber-200">
                <Type className="h-4 w-4" />
                <span>Sostituisci</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <DialogFooter className="flex-row justify-between sm:justify-between pt-4 border-t">
          {/* Step indicators */}
          <div className="flex items-center gap-1.5">
            {[0, 1].map((i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? "w-4 bg-[var(--brand-primary)]"
                    : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Salta
            </Button>
            <Button
              size="sm"
              onClick={handleNext}
              className="bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
            >
              {step === 1 ? "Ho capito!" : "Avanti"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
