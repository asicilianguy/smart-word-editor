"use client";

import { Info, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PreviewInfoBannerProps {
  className?: string;
}

/**
 * Banner informativo discreto che spiega che l'anteprima è semplificata per facilitare l'editing.
 * Può essere chiuso dall'utente (ricordato in localStorage).
 */
export function PreviewInfoBanner({ className }: PreviewInfoBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  // Controlla se l'utente ha già chiuso il banner
  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("preview_banner_dismissed");
      setIsVisible(!dismissed);
      setIsLoaded(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("preview_banner_dismissed", "true");
    }
  };

  // Non mostrare nulla durante il caricamento per evitare flash
  if (!isLoaded || !isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        "bg-(--brand-primary-subtle) border-b border-(--brand-primary)/20",
        className
      )}
    >
      <div className="px-4 py-2 flex items-center justify-center gap-3">
        <Info className="h-4 w-4 text-(--brand-primary) shrink-0" />
        <p className="text-sm text-[var(--brand-primary-hover)]">
          <span className="font-medium">Vista semplificata</span>
          <span className="hidden sm:inline">
            {" "}
            per facilitare la modifica. Il documento scaricato sarà identico
            all'originale.
          </span>
          <span className="sm:hidden"> per facilitare la modifica</span>
        </p>
        <button
          onClick={handleDismiss}
          className="ml-auto p-1 rounded-md hover:bg-(--brand-primary)/10 text-(--brand-primary) transition-colors"
          aria-label="Chiudi banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
