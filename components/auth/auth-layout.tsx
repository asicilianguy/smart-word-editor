"use client";

import { FileText } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * Layout per le pagine di autenticazione
 *
 * Design: Sobrio, professionale, da gestionale
 * - Layout centrato senza split
 * - Sfondo neutro (#FAFAFA)
 * - Niente gradienti, pattern o decorazioni
 * - Linguaggio neutro e tecnico
 */
export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header con logo */}
      <header className="p-6 border-b border-border">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center border border-border">
            <FileText className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-foreground">
              Smart Word Editor
            </h1>
            <p className="text-xs text-muted-foreground">
              Editor documenti controllato
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Card container */}
          <div className="bg-card border border-border rounded-lg p-8">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">{title}</h2>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>

            {/* Form Content */}
            {children}
          </div>

          {/* Footer info */}
          <p className="text-xs text-muted-foreground text-center mt-6">
            I dati inseriti sono protetti e non condivisi con terze parti
          </p>
        </div>
      </main>
    </div>
  );
}
