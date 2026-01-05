"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AuthLayout,
  RegistrationStep1Form,
  VaultOnboarding,
} from "@/components/auth";
import type {
  RegistrationStep1,
  VaultPopulationMethod,
  VaultEntry,
  UploadedDocument,
} from "@/lib/auth-types";

/**
 * Pagina di Registrazione - NUOVA VERSIONE
 *
 * Workflow a 2 step:
 * 1. Credenziali: numero di telefono + password (layout split)
 * 2. Vault Onboarding: fullscreen, guidato, rassicurante
 */
export default function RegisterPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<RegistrationStep1 | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Credenziali
  const handleStep1Complete = (data: RegistrationStep1) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  // Step 2: Vault onboarding
  const handleVaultComplete = async (vaultData: {
    method: VaultPopulationMethod;
    entries: VaultEntry[];
    documents: UploadedDocument[];
  }) => {
    if (!step1Data) return;

    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implementare la chiamata API per la registrazione
      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Registration complete:", {
        phone: step1Data.phone,
        password: "[HIDDEN]",
        vaultMethod: vaultData.method,
        entriesCount: vaultData.entries.length,
        documentsCount: vaultData.documents.length,
      });

      // Log dettagliato (solo in development)
      if (process.env.NODE_ENV === "development") {
        console.log("Vault entries:", vaultData.entries);
        console.log("Uploaded documents:", vaultData.documents);
      }

      // Registrazione riuscita - redirect alla home
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Errore durante la registrazione"
      );
      // In caso di errore, torna allo step 1
      setCurrentStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Torna allo step 1
  const handleBackToStep1 = () => {
    setCurrentStep(1);
  };

  // Step 1: Layout split-screen
  if (currentStep === 1) {
    return (
      <AuthLayout
        title="Crea il tuo account"
        subtitle="Inizia a gestire i tuoi documenti in modo intelligente"
      >
        <div className="space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <RegistrationStep1Form
            onSubmit={handleStep1Complete}
            initialData={step1Data || undefined}
          />

          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Hai già un account?{" "}
              <a
                href="/auth/login"
                className="text-primary font-medium hover:underline"
              >
                Accedi
              </a>
            </p>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Step 2: Fullscreen vault onboarding
  return (
    <VaultOnboarding
      onComplete={handleVaultComplete}
      onBack={handleBackToStep1}
    />
  );
}
