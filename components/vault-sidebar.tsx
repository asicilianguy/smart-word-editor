"use client";

import type React from "react";
import { useState } from "react";
import {
  Search,
  Building2,
  Users,
  MapPin,
  Scale,
  Award,
  Landmark,
  MousePointer2,
  Type,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import type { VaultCategory, VaultValue } from "@/lib/document-types";
import { cn } from "@/lib/utils";

interface VaultSidebarProps {
  categories: VaultCategory[];
  onValueClick?: (value: VaultValue) => void;
  /** C'è testo selezionato nell'editor */
  hasSelection?: boolean;
  /** L'editor ha il focus (cursore attivo) */
  hasCursor?: boolean;
  /** Testo attualmente selezionato (opzionale, per mostrarlo) */
  selectedText?: string;
}

const categoryIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  company: Building2,
  contacts: Users,
  addresses: MapPin,
  legal: Scale,
  certifications: Award,
  banking: Landmark,
};

export function VaultSidebar({
  categories,
  onValueClick,
  hasSelection = false,
  hasCursor = false,
  selectedText,
}: VaultSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Determina lo stato e l'azione
  const canInteract = hasSelection || hasCursor;
  const actionType: "replace" | "insert" | "none" = hasSelection
    ? "replace"
    : hasCursor
    ? "insert"
    : "none";

  // Filtra le categorie
  const filteredCategories = categories
    .map((category) => ({
      ...category,
      values: category.values.filter(
        (value) =>
          value.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          value.value.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.values.length > 0);

  /**
   * Previene che i click sulla sidebar facciano perdere il focus all'editor
   * Questo mantiene la selezione visibile nel documento
   */
  const handleMouseDown = (e: React.MouseEvent) => {
    // Permetti il focus sull'input di ricerca
    if ((e.target as HTMLElement).tagName === "INPUT") {
      return;
    }
    e.preventDefault();
  };

  return (
    <div
      className={cn(
        "h-full flex flex-col border-l transition-all duration-300",
        hasSelection
          ? "bg-green-50/50 dark:bg-green-950/20 border-green-300 dark:border-green-800 shadow-[-4px_0_20px_rgba(34,197,94,0.15)]"
          : hasCursor
          ? "bg-blue-50/30 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900"
          : "bg-muted/30 border-border"
      )}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div
        className={cn(
          "p-4 border-b transition-colors duration-300",
          hasSelection
            ? "bg-green-100/80 dark:bg-green-900/30 border-green-200 dark:border-green-800"
            : hasCursor
            ? "bg-blue-100/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
            : "bg-card border-border"
        )}
      >
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-lg font-semibold">Vault</h2>
          {hasSelection && (
            <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400 animate-pulse" />
          )}
        </div>

        {/* Status Badge */}
        <StatusBadge actionType={actionType} selectedText={selectedText} />

        {/* Search */}
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca valori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "pl-9 transition-colors",
              hasSelection &&
                "border-green-300 dark:border-green-700 focus:ring-green-500"
            )}
          />
        </div>
      </div>

      {/* Categories List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <Accordion
            type="multiple"
            defaultValue={categories.map((c) => c.id)}
            className="space-y-2"
          >
            {filteredCategories.map((category) => {
              const Icon = categoryIcons[category.id] || Building2;
              return (
                <AccordionItem
                  key={category.id}
                  value={category.id}
                  className={cn(
                    "border rounded-lg transition-all duration-200",
                    hasSelection
                      ? "bg-white dark:bg-card border-green-200 dark:border-green-800 shadow-sm"
                      : "bg-card"
                  )}
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          hasSelection
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        )}
                      />
                      <span className="font-medium">{category.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto mr-2">
                        ({category.values.length})
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3">
                    <div className="space-y-1">
                      {category.values.map((value) => (
                        <VaultValueButton
                          key={value.id}
                          value={value}
                          onClick={() => onValueClick?.(value)}
                          canInteract={canInteract}
                          actionType={actionType}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? `Nessun risultato per "${searchQuery}"`
                  : "Nessun valore disponibile"}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div
        className={cn(
          "p-4 border-t transition-colors",
          hasSelection
            ? "bg-green-100/50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            : "bg-card border-border"
        )}
      >
        <p className="text-xs text-muted-foreground text-center">
          {categories.reduce((acc, cat) => acc + cat.values.length, 0)} valori
          in {categories.length} categorie
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// STATUS BADGE
// ============================================================================

function StatusBadge({
  actionType,
  selectedText,
}: {
  actionType: "replace" | "insert" | "none";
  selectedText?: string;
}) {
  if (actionType === "replace") {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-3 py-2 rounded-md border border-green-300 dark:border-green-700 animate-in fade-in slide-in-from-top-1 duration-200">
          <Type className="h-4 w-4 shrink-0" />
          <span className="font-medium">
            Seleziona un valore per <strong>sostituire</strong>
          </span>
        </div>
        {selectedText && (
          <div className="text-xs bg-white dark:bg-card px-3 py-2 rounded border border-green-200 dark:border-green-800">
            <span className="text-muted-foreground">Testo selezionato: </span>
            <span className="font-medium text-green-700 dark:text-green-400 line-clamp-1">
              "{selectedText}"
            </span>
          </div>
        )}
      </div>
    );
  }

  if (actionType === "insert") {
    return (
      <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-3 py-2 rounded-md border border-blue-200 dark:border-blue-700">
        <MousePointer2 className="h-4 w-4 shrink-0" />
        <span>
          Cursore attivo — clicca per <strong>inserire</strong>
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-2 rounded-md">
      <MousePointer2 className="h-4 w-4 shrink-0" />
      <span>Seleziona testo nel documento per sostituirlo</span>
    </div>
  );
}

// ============================================================================
// VAULT VALUE BUTTON
// ============================================================================

interface VaultValueButtonProps {
  value: VaultValue;
  onClick: () => void;
  canInteract: boolean;
  actionType: "replace" | "insert" | "none";
}

function VaultValueButton({
  value,
  onClick,
  canInteract,
  actionType,
}: VaultValueButtonProps) {
  const isReplace = actionType === "replace";

  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start text-left h-auto py-2.5 px-3 transition-all duration-150",
        canInteract
          ? isReplace
            ? "hover:bg-green-100 dark:hover:bg-green-900/40 hover:text-green-900 dark:hover:text-green-100 hover:border-green-300 dark:hover:border-green-700 border border-transparent cursor-pointer"
            : "hover:bg-accent hover:text-accent-foreground cursor-pointer"
          : "opacity-40 cursor-not-allowed"
      )}
      onClick={canInteract ? onClick : undefined}
      disabled={!canInteract}
      title={
        actionType === "replace"
          ? `Sostituisci con: ${value.value}`
          : actionType === "insert"
          ? `Inserisci: ${value.value}`
          : "Seleziona testo nel documento per attivare"
      }
    >
      <div className="flex flex-col items-start gap-1 w-full">
        <span
          className={cn(
            "text-sm font-medium",
            isReplace && canInteract && "text-green-800 dark:text-green-300"
          )}
        >
          {value.label}
        </span>
        <span className="text-xs text-muted-foreground line-clamp-2 break-all">
          {value.value}
        </span>
      </div>
    </Button>
  );
}
