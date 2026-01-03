"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { X, Check, Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SelectionRef } from "@/lib/document-types";

interface ReplacePopoverProps {
  /** Riferimento alla selezione attiva */
  selection: SelectionRef;
  /** Callback quando l'utente conferma la sostituzione */
  onReplace: (newText: string) => void;
  /** Callback per chiudere il popover */
  onClose: () => void;
  /** Valore suggerito dal vault (opzionale) */
  suggestedValue?: string;
}

/**
 * Popover per la sostituzione del testo
 *
 * Appare quando l'utente seleziona del testo nel documento.
 * Permette di:
 * - Visualizzare il testo selezionato
 * - Inserire un testo personalizzato
 * - Utilizzare un valore suggerito dal vault
 */
export function ReplacePopover({
  selection,
  onReplace,
  onClose,
  suggestedValue,
}: ReplacePopoverProps) {
  const [customText, setCustomText] = useState("");
  const [position, setPosition] = useState({ x: selection.x, y: selection.y });
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Aggiusta la posizione se il popover esce dallo schermo
  useEffect(() => {
    if (popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = selection.x;
      let adjustedY = selection.y;

      // Previeni overflow orizzontale
      if (rect.right > viewportWidth - 10) {
        adjustedX = viewportWidth - rect.width - 10;
      }
      if (rect.left < 10) {
        adjustedX = rect.width / 2 + 10;
      }

      // Previeni overflow verticale
      if (rect.top < 10) {
        adjustedY = selection.y + rect.height + 30; // Mostra sotto la selezione
      }
      if (rect.bottom > viewportHeight - 10) {
        adjustedY = selection.y - rect.height - 10;
      }

      if (adjustedX < 10) adjustedX = 10;
      if (adjustedY < 10) adjustedY = 10;

      setPosition({ x: adjustedX, y: adjustedY });
    }
  }, [selection.x, selection.y]);

  // Focus sull'input all'apertura
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  /**
   * Gestisce la sostituzione
   */
  const handleReplace = (text: string) => {
    if (text.trim()) {
      onReplace(text);
      onClose();
    }
  };

  /**
   * Gestisce i tasti
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && customText.trim()) {
      e.preventDefault();
      handleReplace(customText);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  /**
   * Incolla dagli appunti
   */
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCustomText(text);
      inputRef.current?.focus();
    } catch (err) {
      console.warn("[ReplacePopover] Impossibile leggere dagli appunti:", err);
    }
  };

  return (
    <>
      {/* Overlay trasparente per chiudere cliccando fuori */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Popover */}
      <div
        ref={popoverRef}
        role="dialog"
        aria-label="Sostituisci testo"
        className={cn(
          "fixed z-50 bg-popover border border-border rounded-lg shadow-lg",
          "animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
        )}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: "translate(-50%, -100%)",
        }}
      >
        <div className="p-4 space-y-4 min-w-[360px] max-w-[440px]">
          {/* Header con testo selezionato */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Testo selezionato
              </p>
              <p className="text-sm font-medium line-clamp-3 break-words bg-muted/50 p-2 rounded">
                {selection.selectedText}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={onClose}
              aria-label="Chiudi"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Valore suggerito dal vault */}
          {suggestedValue && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Suggerimento dal vault
              </p>
              <Button
                variant="outline"
                className="w-full justify-start text-left h-auto py-2.5 px-3 bg-primary/5 border-primary/20 hover:bg-primary/10"
                onClick={() => handleReplace(suggestedValue)}
              >
                <div className="flex items-center gap-2 w-full">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm flex-1 line-clamp-2 break-words">
                    {suggestedValue}
                  </span>
                </div>
              </Button>
            </div>
          )}

          {/* Input testo personalizzato */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground">
                Sostituisci con
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={handlePasteFromClipboard}
              >
                <Clipboard className="h-3 w-3 mr-1" />
                Incolla
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Inserisci nuovo testo..."
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1"
              />
              <Button
                onClick={() => handleReplace(customText)}
                disabled={!customText.trim()}
              >
                Sostituisci
              </Button>
            </div>
          </div>

          {/* Hint */}
          <p className="text-xs text-muted-foreground text-center">
            Premi{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">
              Invio
            </kbd>{" "}
            per confermare,
            <kbd className="px-1 py-0.5 bg-muted rounded text-[10px] ml-1">
              Esc
            </kbd>{" "}
            per annullare
          </p>
        </div>
      </div>
    </>
  );
}
