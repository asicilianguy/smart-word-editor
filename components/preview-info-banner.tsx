"use client";

import {
  Info,
  CheckCircle,
  Eye,
  Download,
  Image,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PreviewInfoBannerProps {
  className?: string;
}

/**
 * Banner informativo che spiega la differenza tra preview e documento finale.
 *
 * Punti chiave:
 * - La preview è una RAPPRESENTAZIONE semplificata per l'editing
 * - Il download preserva TUTTO: formattazione, immagini, stili originali
 * - Le modifiche vengono applicate chirurgicamente al file originale
 */
export function PreviewInfoBanner({ className }: PreviewInfoBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        "bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800",
        className
      )}
    >
      {/* Banner compatto */}
      <div className="px-6 py-2.5">
        <div className="flex items-center justify-center gap-2">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <span className="font-medium">Anteprima semplificata:</span> questa
            vista serve per l'editing. Il documento scaricato manterrà{" "}
            <strong>tutta la formattazione originale</strong>, incluse immagini
            e stili.
          </p>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline shrink-0 ml-2"
          >
            {isExpanded ? "Nascondi dettagli" : "Maggiori info"}
          </button>
        </div>
      </div>

      {/* Dettagli espansi */}
      {isExpanded && (
        <div className="px-6 pb-4 pt-1 border-t border-blue-200/50 dark:border-blue-800/50">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {/* Colonna Preview */}
              <div className="bg-white/50 dark:bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    Anteprima (questa schermata)
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Testo e tabelle visibili</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Checkbox interattive</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Selezione e sostituzione testo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-4 w-4 flex items-center justify-center text-amber-600 mt-0.5 shrink-0">
                      ○
                    </span>
                    <span>Formattazione semplificata</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="h-4 w-4 flex items-center justify-center text-amber-600 mt-0.5 shrink-0">
                      ○
                    </span>
                    <span>Immagini non visualizzate</span>
                  </li>
                </ul>
              </div>

              {/* Colonna Download */}
              <div className="bg-white/50 dark:bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Download className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    Documento scaricato
                  </h3>
                </div>
                <ul className="space-y-2 text-sm text-green-800 dark:text-green-200">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Formattazione originale al 100%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Tutte le immagini preservate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Stili, font e colori intatti</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>Header, footer e margini</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <span>+ le tue modifiche applicate</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Spiegazione tecnica */}
            <div className="mt-4 p-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg">
              <p className="text-xs text-blue-700 dark:text-blue-300 text-center">
                <strong>Come funziona:</strong> Le tue modifiche vengono
                applicate direttamente al file DOCX originale in modo
                "chirurgico", senza alterare nient'altro. Il risultato è
                identico all'originale, con solo il testo e le checkbox che hai
                modificato.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
