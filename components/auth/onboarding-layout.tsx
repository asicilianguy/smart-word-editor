"use client";

import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

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
 * Design: Ampio, respirabile, rassicurante
 * - Sfondo chiaro/neutro
 * - Ampio spazio centrale per il contenuto
 * - Progress bar sottile in alto
 * - Nessun elemento che distragga
 */
export function OnboardingLayout({
  children,
  progress,
  showLogo = true,
}: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Progress Bar - sottile e discreta */}
      {progress !== undefined && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Header con logo */}
      {showLogo && (
        <header className="p-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold text-sm">Smart Word Editor</span>
          </div>
        </header>
      )}

      {/* Main Content - centrato con max-width generoso */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          {children}
        </div>
      </main>

      {/* Footer discreto */}
      <footer className="p-6 text-center">
        <p className="text-xs text-muted-foreground">
          I tuoi dati restano sul tuo dispositivo e sono protetti
        </p>
      </footer>
    </div>
  );
}
