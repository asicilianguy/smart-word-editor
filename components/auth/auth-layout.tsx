"use client";

import { FileText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

/**
 * Layout per le pagine di autenticazione
 *
 * Design: Minimalista con accenti bold
 * - Split layout con branding a sinistra
 * - Form content a destra
 * - Gradient sottile e pattern geometrico
 */
export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Pattern geometrico sottile */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Decorative shapes */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Smart Word Editor
              </h1>
              <p className="text-sm text-white/60">Editing controllato</p>
            </div>
          </div>

          {/* Main content */}
          <div className="max-w-md">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                Produttività amplificata
              </span>
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-4">
              Modifica i tuoi documenti
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-cyan-400">
                in modo intelligente
              </span>
            </h2>
            <p className="text-lg text-white/70 leading-relaxed">
              Crea il tuo vault personale di dati e inseriscili nei documenti
              con un click. Nessuna automazione invasiva, controllo totale.
            </p>
          </div>

          {/* Features list */}
          <div className="grid grid-cols-2 gap-6">
            <FeatureItem
              title="Zero automazione"
              description="Tu decidi ogni modifica"
            />
            <FeatureItem
              title="Preservazione totale"
              description="Layout e stili intatti"
            />
            <FeatureItem
              title="Preview live"
              description="Vedi subito i cambiamenti"
            />
            <FeatureItem
              title="Vault personale"
              description="I tuoi dati sempre pronti"
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold">Smart Word Editor</h1>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-muted-foreground mt-2">{subtitle}</p>
            )}
          </div>

          {/* Form Content */}
          {children}
        </div>
      </div>
    </div>
  );
}

function FeatureItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="group">
      <div className="flex items-center gap-2 mb-1">
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        <h3 className="font-medium text-white">{title}</h3>
      </div>
      <p className="text-sm text-white/50 ml-3.5">{description}</p>
    </div>
  );
}
