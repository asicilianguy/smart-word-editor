"use client";

import { useState } from "react";
import {
  Search,
  Building2,
  Users,
  MapPin,
  Scale,
  Award,
  Landmark,
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
  /** Indica se c'è una selezione attiva nel documento */
  hasActiveSelection?: boolean;
}

/**
 * Mappa delle icone per categoria
 */
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

/**
 * Sidebar del Vault
 *
 * Mostra i valori disponibili per la sostituzione, organizzati per categoria.
 * L'utente può:
 * - Cercare valori
 * - Cliccare su un valore per sostituire il testo selezionato
 */
export function VaultSidebar({
  categories,
  onValueClick,
  hasActiveSelection,
}: VaultSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filtra le categorie in base alla ricerca
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

  return (
    <div className="h-full flex flex-col bg-muted/30 border-l border-border">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <h2 className="text-lg font-semibold mb-1">Vault</h2>
        <p className="text-xs text-muted-foreground mb-3">
          {hasActiveSelection
            ? "Clicca su un valore per sostituire il testo selezionato"
            : "Seleziona del testo nel documento, poi scegli un valore"}
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca valori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Lista categorie */}
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
                  className="border rounded-lg bg-card"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
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
                          disabled={!hasActiveSelection}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {/* Nessun risultato */}
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

      {/* Footer con statistiche */}
      <div className="p-4 border-t border-border bg-card">
        <p className="text-xs text-muted-foreground text-center">
          {categories.reduce((acc, cat) => acc + cat.values.length, 0)} valori
          in {categories.length} categorie
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// VAULT VALUE BUTTON
// ============================================================================

interface VaultValueButtonProps {
  value: VaultValue;
  onClick: () => void;
  disabled?: boolean;
}

function VaultValueButton({ value, onClick, disabled }: VaultValueButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(
        "w-full justify-start text-left h-auto py-2 px-3",
        "hover:bg-accent hover:text-accent-foreground",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="flex flex-col items-start gap-1 w-full">
        <span className="text-sm font-medium">{value.label}</span>
        <span className="text-xs text-muted-foreground line-clamp-2 break-all">
          {value.value}
        </span>
      </div>
    </Button>
  );
}
