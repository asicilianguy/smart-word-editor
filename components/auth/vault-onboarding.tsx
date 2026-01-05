"use client";

import { useState } from "react";
import { OnboardingLayout } from "./onboarding-layout";
import { VaultWelcome } from "./vault-welcome";
import { MethodChoice } from "./method-choice";
import { GuidedEntryWizard } from "./guided-entry-wizard";
import { FriendlyDocumentUploader } from "./friendly-document-uploader";
import { OnboardingComplete } from "./onboarding-complete";
import type {
  VaultEntry,
  UploadedDocument,
  VaultPopulationMethod,
} from "@/lib/auth-types";

// ============================================================================
// TYPES
// ============================================================================

type OnboardingStep =
  | "welcome"
  | "choose-method"
  | "manual-entry"
  | "document-upload"
  | "complete";

interface VaultOnboardingProps {
  onComplete: (data: {
    method: VaultPopulationMethod;
    entries: VaultEntry[];
    documents: UploadedDocument[];
  }) => void;
  onBack: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Onboarding completo per il Vault
 *
 * Flusso:
 * 1. Welcome - Spiega il concetto
 * 2. Choose Method - Manuale o Upload
 * 3a. Manual Entry - Wizard guidato per categoria
 * 3b. Document Upload - Upload friendly
 * 4. Complete - Celebrazione e riepilogo
 */
export function VaultOnboarding({ onComplete, onBack }: VaultOnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [selectedMethod, setSelectedMethod] = useState<VaultPopulationMethod | null>(null);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  // Calcola il progresso per la progress bar
  const getProgress = (): number => {
    switch (step) {
      case "welcome":
        return 10;
      case "choose-method":
        return 30;
      case "manual-entry":
      case "document-upload":
        return 60;
      case "complete":
        return 100;
      default:
        return 0;
    }
  };

  // Handlers per la navigazione
  const handleWelcomeContinue = () => {
    setStep("choose-method");
  };

  const handleMethodSelect = (method: VaultPopulationMethod) => {
    setSelectedMethod(method);
    if (method === "manual") {
      setStep("manual-entry");
    } else if (method === "upload") {
      setStep("document-upload");
    }
  };

  const handleSkip = () => {
    setSelectedMethod("skip");
    setStep("complete");
  };

  const handleManualComplete = () => {
    setStep("complete");
  };

  const handleUploadComplete = () => {
    setStep("complete");
  };

  const handleBackToMethod = () => {
    setStep("choose-method");
  };

  const handleBackToWelcome = () => {
    setStep("welcome");
  };

  const handleFinish = () => {
    onComplete({
      method: selectedMethod || "skip",
      entries,
      documents,
    });
  };

  // Render del contenuto basato sullo step
  const renderContent = () => {
    switch (step) {
      case "welcome":
        return <VaultWelcome onContinue={handleWelcomeContinue} />;

      case "choose-method":
        return (
          <MethodChoice
            onSelect={handleMethodSelect}
            onBack={handleBackToWelcome}
            onSkip={handleSkip}
          />
        );

      case "manual-entry":
        return (
          <GuidedEntryWizard
            entries={entries}
            onEntriesChange={setEntries}
            onComplete={handleManualComplete}
            onBack={handleBackToMethod}
          />
        );

      case "document-upload":
        return (
          <FriendlyDocumentUploader
            documents={documents}
            onDocumentsChange={setDocuments}
            onComplete={handleUploadComplete}
            onBack={handleBackToMethod}
          />
        );

      case "complete":
        return (
          <OnboardingComplete
            entries={entries}
            documents={documents}
            onFinish={handleFinish}
          />
        );

      default:
        return null;
    }
  };

  return (
    <OnboardingLayout progress={getProgress()} showLogo={step !== "complete"}>
      {renderContent()}
    </OnboardingLayout>
  );
}
