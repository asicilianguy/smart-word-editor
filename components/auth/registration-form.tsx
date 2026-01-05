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
  description: string;
}

const steps: Step[] = [
  {
    id: 1,
    title: "Credenziali",
    description: "Numero e password",
  },
  {
    id: 2,
    title: "Vault",
    description: "Configura i tuoi dati",
  },
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
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in slide-in-from-top-2 duration-200">
          {error}
        </div>
      )}

      {/* Step Indicator */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div
                key={step.id}
                className={cn("flex-1", index < steps.length - 1 && "pr-4")}
              >
                <div className="flex items-center">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center shrink-0 text-sm font-medium transition-all",
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.id
                    )}
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "flex-1 h-1 mx-3 rounded-full transition-colors",
                        isCompleted ? "bg-primary" : "bg-muted"
                      )}
                    />
                  )}
                </div>

                {/* Step Label */}
                <div className="mt-2">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCurrent
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Creazione account in corso...
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
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Hai già un account?{" "}
            <Link
              href="/auth/login"
              className="text-primary font-medium hover:underline"
            >
              Accedi
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
