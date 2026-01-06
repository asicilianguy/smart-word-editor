"use client";

import { FileText } from "lucide-react";

interface OnboardingLayoutProps {
  children: React.ReactNode;
  /** Progresso da 0 a 100 */
  progress?: number;
  /** Mostra il logo in alto */
  showLogo?: boolean;
}

/**
 * Layout fullscreen per l'onboarding del Vault
 *
 * Design: Sobrio, respirabile, professionale
 * - Sfondo neutro senza gradienti
 * - Ampio spazio centrale per il contenuto
 * - Progress bar sottile in alto
 * - Nessun elemento decorativo
 */
export function OnboardingLayout({
  children,
  progress,
  showLogo = true,
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress Bar - sottile e discreta */}
      {progress !== undefined && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-border z-50">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Header con logo */}
      {showLogo && (
        <header className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center border border-border">
              <FileText className="h-4 w-4 text-foreground" />
            </div>
            <span className="font-medium text-sm text-foreground">
              Smart Word Editor
            </span>
          </div>
        </header>
      )}

      {/* Main Content - centrato con max-width generoso */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">{children}</div>
      </main>

      {/* Footer discreto */}
      <footer className="p-6 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          I tuoi dati restano sul tuo dispositivo e sono protetti
        </p>
      </footer>
    </div>
  );
}
