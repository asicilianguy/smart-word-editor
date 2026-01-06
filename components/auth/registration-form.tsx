"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  RegistrationStep1,
  VaultPopulationMethod,
  VaultEntry,
  UploadedDocument,
} from "@/lib/auth-types";
import { RegistrationStep1Form } from "./registration-step1-form";
import { RegistrationStep2Form } from "./registration-step2-form";

// ============================================================================
// TYPES
// ============================================================================

interface RegistrationFormProps {
  onSubmit: (data: {
    phone: string;
    password: string;
    vaultMethod: VaultPopulationMethod;
    entries: VaultEntry[];
    documents: UploadedDocument[];
  }) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

interface Step {
  id: number;
  title: string;
}

const steps: Step[] = [
  { id: 1, title: "Credenziali" },
  { id: 2, title: "Vault" },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function RegistrationForm({
  onSubmit,
  isLoading = false,
  error,
}: RegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<RegistrationStep1 | null>(null);

  const handleStep1Submit = (data: RegistrationStep1) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const handleStep2Submit = async (
    method: VaultPopulationMethod,
    entries: VaultEntry[],
    documents: UploadedDocument[]
  ) => {
    if (!step1Data) return;

    await onSubmit({
      phone: step1Data.phone,
      password: step1Data.password,
      vaultMethod: method,
      entries,
      documents,
    });
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
  };

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Step Indicator - sobrio e funzionale */}
      <div className="flex items-center gap-3">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;

          return (
            <div key={step.id} className="flex items-center gap-3 flex-1">
              {/* Step Circle */}
              <div
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-sm font-medium border",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : isCurrent
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-muted border-border text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : step.id}
              </div>

              {/* Step Title */}
              <span
                className={cn(
                  "text-sm font-medium",
                  isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px",
                    isCompleted ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10 rounded-md">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Creazione account...
            </p>
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className="relative">
        {currentStep === 1 && (
          <RegistrationStep1Form
            onSubmit={handleStep1Submit}
            initialData={step1Data || undefined}
          />
        )}

        {currentStep === 2 && (
          <RegistrationStep2Form
            onSubmit={handleStep2Submit}
            onBack={handleBackToStep1}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Login Link - Solo nel primo step */}
      {currentStep === 1 && (
        <p className="text-sm text-muted-foreground text-center pt-2">
          Hai già un account?{" "}
          <Link
            href="/auth/login"
            className="text-primary font-medium hover:underline"
          >
            Accedi
          </Link>
        </p>
      )}
    </div>
  );
}
