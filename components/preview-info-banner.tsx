"use client";

import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PreviewInfoBannerProps {
  className?: string;
}

/**
 * Banner informativo che spiega la differenza tra preview e documento finale.
 *
 * Design: visibile ma professionale, espandibile per chi vuole dettagli.
 */
export function PreviewInfoBanner({ className }: PreviewInfoBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={cn("bg-amber-50 border-b border-amber-200", className)}>
      {/* Banner compatto */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-center gap-3 hover:bg-amber-100/50 transition-colors"
      >
        <Info className="h-4 w-4 text-amber-600 shrink-0" />
        <span className="text-sm text-amber-800">
          <strong>Anteprima semplificata</strong> — il documento scaricato
          manterrà tutta la formattazione originale
        </span>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-amber-600 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-600 shrink-0" />
        )}
      </button>

      {/* Dettagli espansi */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-amber-200">
          <div className="max-w-2xl mx-auto space-y-3">
            {/* Spiegazione principale */}
            <div className="text-sm text-amber-900 space-y-2">
              <p>
                <strong>
                  Perché l'anteprima è diversa dal documento originale?
                </strong>
              </p>
              <p className="text-amber-800">
                Per permetterti di modificare il testo in modo semplice,
                mostriamo una versione semplificata del documento. Immagini,
                intestazioni, piè di pagina e alcune formattazioni complesse non
                sono visibili qui, ma sono preservate nel file.
              </p>
            </div>

            {/* Due colonne: cosa vedi / cosa ottieni */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <div className="font-medium text-amber-700">
                  In questa anteprima:
                </div>
                <ul className="space-y-1 text-amber-800">
                  <li>• Testo e tabelle</li>
                  <li>• Checkbox modificabili</li>
                  <li>• Formattazione base</li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <div className="font-medium text-amber-900">
                  Nel documento scaricato:
                </div>
                <ul className="space-y-1 text-amber-800">
                  <li>• Tutto l'originale intatto</li>
                  <li>• Immagini, header, footer</li>
                  <li>• Le tue modifiche applicate</li>
                </ul>
              </div>
            </div>

            {/* Rassicurazione finale */}
            <p className="text-xs text-amber-700 pt-2 border-t border-amber-200">
              Le modifiche che fai qui vengono applicate al file originale senza
              alterare nient'altro.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
