"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  AuthLayout,
  RegistrationStep1Form,
  VaultOnboarding,
} from "@/components/auth";
import { useAuth } from "@/lib/auth-context";
import type {
  RegistrationStep1,
  VaultPopulationMethod,
  VaultEntry,
  UploadedDocument,
} from "@/lib/auth-types";

/**
 * Pagina di Registrazione
 *
 * Workflow a 2 step:
 * 1. Credenziali: numero di telefono + password
 * 2. Vault Onboarding: configurazione dati
 */
export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    saveVault,
    isAuthenticated,
    isLoading: authLoading,
  } = useAuth();
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<RegistrationStep1 | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect se già autenticato
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  // Step 1: Credenziali
  const handleStep1Complete = (data: RegistrationStep1) => {
    setStep1Data(data);
    setError(null);
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
      // 1. Registra l'utente
      const registerResponse = await register(
        step1Data.phone,
        step1Data.password
      );

      if (!registerResponse.success) {
        setError(registerResponse.error || "Errore durante la registrazione");
        setCurrentStep(1);
        setIsLoading(false);
        return;
      }

      // 2. Salva le vault entries (se presenti)
      if (vaultData.entries.length > 0) {
        const vaultResponse = await saveVault(vaultData.entries);

        if (!vaultResponse.success) {
          console.warn("[Register] Vault save failed:", vaultResponse.error);
        }
      }

      // Registrazione riuscita - redirect alla home
      router.push("/");
    } catch (err) {
      console.error("[Register] Error:", err);
      setError(
        err instanceof Error ? err.message : "Errore durante la registrazione"
      );
      setCurrentStep(1);
    } finally {
      setIsLoading(false);
    }
  };

  // Torna allo step 1
  const handleBackToStep1 = () => {
    setCurrentStep(1);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Step 1: Layout centrato
  if (currentStep === 1) {
    return (
      <AuthLayout
        title="Crea un account"
        subtitle="Inserisci i dati per registrarti"
      >
        <div className="space-y-5">
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <RegistrationStep1Form
            onSubmit={handleStep1Complete}
            initialData={step1Data || undefined}
          />

          <p className="text-sm text-muted-foreground text-center pt-2">
            Hai già un account?{" "}
            <a
              href="/auth/login"
              className="text-primary font-medium hover:underline"
            >
              Accedi
            </a>
          </p>
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
