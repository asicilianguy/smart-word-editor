/**
 * Componenti per l'autenticazione
 *
 * Esporta tutti i componenti necessari per login e registrazione
 */

// Layout
export { AuthLayout } from "./auth-layout";
export { OnboardingLayout } from "./onboarding-layout";

// Login
export { LoginForm } from "./login-form";

// Registration Step 1
export { RegistrationStep1Form } from "./registration-step1-form";

// Registration Step 2 - Vecchia versione (deprecata)
export { RegistrationForm } from "./registration-form";
export { RegistrationStep2Form } from "./registration-step2-form";
export { ManualEntryForm } from "./manual-entry-form";
export { DocumentUploader } from "./document-uploader";

// Registration Step 2 - NUOVA VERSIONE (usa questa!)
export { VaultOnboarding } from "./vault-onboarding";
export { VaultWelcome } from "./vault-welcome";
export { MethodChoice } from "./method-choice";
export { GuidedEntryWizard } from "./guided-entry-wizard";
export { FriendlyDocumentUploader } from "./friendly-document-uploader";
export { OnboardingComplete } from "./onboarding-complete";
