"use client";

import { ArrowRight, Sparkles, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { VaultValueButton } from "./vault-value-button";
import { categoryIcons } from "../constants";
import type { VaultCategory, VaultValue } from "@/lib/document-types";
import type { ActionType } from "../types";

interface DemoStateProps {
  categories: VaultCategory[];
  filteredCategories: VaultCategory[];
  searchQuery: string;
  onValueClick?: (value: VaultValue) => void;
  onAddClick: () => void;
  onAuthClick?: () => void;
  canInteract: boolean;
  actionType: ActionType;
  demoEntriesCount: number;
}

export function DemoState({
  categories,
  filteredCategories,
  searchQuery,
  onValueClick,
  onAddClick,
  onAuthClick,
  canInteract,
  actionType,
  demoEntriesCount,
}: DemoStateProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Intro banner */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-[var(--brand-primary-subtle)] to-transparent">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-[var(--brand-primary)]/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Prova subito!</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Questi sono dati di esempio. Carica un documento e clicca su un
              valore per inserirlo.
            </p>
          </div>
        </div>
      </div>

      {/* Lista categorie */}
      <div className="flex-1 overflow-y-auto p-4">
        <Accordion
          type="multiple"
          defaultValue={categories.map((c) => c.id)}
          className="space-y-2"
        >
          {filteredCategories.map((category) => {
            const Icon =
              categoryIcons[category.id] ||
              categoryIcons[category.name.toLowerCase()] ||
              FileText;

            // Controlla se ci sono valori aggiunti dall'utente
            const hasUserValues = category.values.some((v) =>
              v.id.startsWith("user-demo-")
            );

            return (
              <AccordionItem
                key={category.id}
                value={category.id}
                className="border border-border rounded-md bg-card"
              >
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex items-center gap-2 flex-1">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{category.name}</span>
                    {hasUserValues && (
                      <span className="text-[10px] bg-[var(--brand-primary-subtle)] text-[var(--brand-primary)] px-1.5 py-0.5 rounded">
                        + tuoi
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto mr-2">
                      ({category.values.length})
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-2">
                  <div className="space-y-1">
                    {category.values.map((value) => {
                      const isUserAdded = value.id.startsWith("user-demo-");
                      return (
                        <VaultValueButton
                          key={value.id}
                          value={value}
                          onClick={() => onValueClick?.(value)}
                          canInteract={canInteract}
                          actionType={actionType}
                          isDemo={!isUserAdded}
                          isUserAdded={isUserAdded}
                        />
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>

        {filteredCategories.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              Nessun risultato per &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </div>

      {/* CTA Footer */}
      <div className="flex-shrink-0 p-4 border-t border-border bg-card space-y-3">
        {/* CTA Accesso */}
        {onAuthClick && (
          <div className="bg-gradient-to-r from-[var(--brand-primary-subtle)] to-[var(--bg-surface)] rounded-lg p-3 border border-[var(--brand-primary)]/20">
            <p className="text-xs text-foreground font-medium mb-2">
              Ti piace? Salva i tuoi dati reali
            </p>
            <p className="text-[11px] text-muted-foreground mb-3">
              Accedi per salvare i tuoi dati e usarli su qualsiasi documento
              {demoEntriesCount > 0 && (
                <span className="text-[var(--brand-primary)]">
                  {" "}
                  (inclusi i {demoEntriesCount} che hai aggiunto)
                </span>
              )}
            </p>
            <Button
              onClick={onAuthClick}
              size="sm"
              className="w-full bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]"
            >
              Accedi o registrati
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Note */}
        <p className="text-[10px] text-center text-muted-foreground">
          I dati demo non vengono salvati. Accedi per conservarli.
        </p>
      </div>
    </div>
  );
}
