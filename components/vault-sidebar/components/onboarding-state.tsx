"use client";

import { useState, useEffect } from "react";
import { Sparkles, Plus, ArrowRight, Lightbulb, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { VaultValueButton } from "./vault-value-button";
import { categoryIcons, DEMO_CATEGORIES, ONBOARDING_TIPS } from "../constants";
import type { VaultValue } from "@/lib/document-types";
import type { ActionType } from "../types";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

interface OnboardingStateProps {
  onAddClick: () => void;
  onManageClick?: () => void;
  onDemoValueClick?: (value: VaultValue) => void;
  hasSelection: boolean;
  hasCursor: boolean;
  actionType: ActionType;
}

export function OnboardingState({
  onAddClick,
  onManageClick,
  onDemoValueClick,
  hasSelection,
  hasCursor,
  actionType,
}: OnboardingStateProps) {
  const [currentTip, setCurrentTip] = useState(0);
  const canInteract = hasSelection || hasCursor;

  // Ruota i tips ogni 5 secondi
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % ONBOARDING_TIPS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Banner onboarding */}
      <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/20">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              Benvenuto nel tuo Vault!
            </h3>
            <p className="text-xs text-muted-foreground">
              Questi sono dati di esempio. Prova a usarli nel documento, poi
              aggiungi i tuoi dati reali.
            </p>
          </div>
        </div>

        {/* Tip rotante */}
        <div className="mt-3 flex items-center gap-2 text-xs bg-white/50 dark:bg-black/20 px-3 py-2 rounded-md">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
          <span className="text-muted-foreground animate-in fade-in duration-300">
            {ONBOARDING_TIPS[currentTip]}
          </span>
        </div>
      </div>

      {/* Demo categories */}
      <div className="flex-1 overflow-y-auto p-4">
        <Accordion
          type="multiple"
          defaultValue={DEMO_CATEGORIES.map((c) => c.id)}
          className="space-y-2"
        >
          {DEMO_CATEGORIES.map((category) => {
            const Icon =
              categoryIcons[category.id] ||
              categoryIcons[category.id.toLowerCase()] ||
              FileText;
            return (
              <AccordionItem
                key={category.id}
                value={category.id}
                className={cn(
                  "border rounded-lg transition-all duration-200 border-dashed",
                  hasSelection
                    ? "bg-white/50 dark:bg-card/50 border-green-300/50 dark:border-green-800/50"
                    : "bg-card/50 border-muted-foreground/20"
                )}
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        "h-4 w-4",
                        hasSelection
                          ? "text-green-600/70 dark:text-green-400/70"
                          : "text-muted-foreground/70"
                      )}
                    />
                    <span className="font-medium text-muted-foreground">
                      {category.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70 ml-auto mr-2 bg-muted px-1.5 py-0.5 rounded">
                      demo
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-3">
                  <div className="space-y-1">
                    {category.values.map((value) => (
                      <VaultValueButton
                        key={value.id}
                        value={value}
                        onClick={() => onDemoValueClick?.(value)}
                        canInteract={canInteract}
                        actionType={actionType}
                        isDemo
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>

      {/* CTA Footer */}
      <div className="p-4 border-t bg-card space-y-3">
        <Button onClick={onAddClick} className="w-full gap-2" size="lg">
          <Plus className="h-4 w-4" />
          Aggiungi i tuoi dati
        </Button>

        {onManageClick && (
          <Button
            variant="outline"
            onClick={onManageClick}
            className="w-full gap-2 text-muted-foreground"
            size="sm"
          >
            <Settings className="h-4 w-4" />
            Gestisci Vault
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>
        )}

        <p className="text-[10px] text-center text-muted-foreground">
          I dati demo non vengono salvati. Aggiungi i tuoi per usarli ovunque.
        </p>
      </div>
    </div>
  );
}
