"use client";

import { useTranslations } from "next-intl";
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
  const t = useTranslations("sidebar.demo");

  return (
    <div className="flex flex-col h-full">
      {/* Intro banner */}
      <div className="p-4 border-b border-border bg-linear-to-r from-(--brand-primary-subtle) to-transparent">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-(--brand-primary)/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-(--brand-primary)" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{t("banner.title")}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("banner.description")}
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
                      <span className="text-[10px] bg-(--brand-primary-subtle) text-(--brand-primary) px-1.5 py-0.5 rounded">
                        {t("yoursBadge")}
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
              {t("noResults", { query: searchQuery })}
            </p>
          </div>
        )}
      </div>

      {/* CTA Footer */}
      <div className="shrink-0 p-4 border-t border-border bg-card space-y-3">
        {/* CTA Accesso */}
        {onAuthClick && (
          <div className="bg-linear-to-r from-(--brand-primary-subtle) to-(--bg-surface) rounded-lg p-3 border border-(--brand-primary)/20">
            <p className="text-xs text-foreground font-medium mb-2">
              {t("cta.title")}
            </p>
            <p className="text-[11px] text-muted-foreground mb-3">
              {t("cta.description")}
              {demoEntriesCount > 0 && (
                <span className="text-(--brand-primary)">
                  {" "}
                  {t("cta.includingAdded", { count: demoEntriesCount })}
                </span>
              )}
            </p>
            <Button
              onClick={onAuthClick}
              size="sm"
              className="w-full bg-(--brand-primary) hover:bg-(--brand-primary-hover)"
            >
              {t("cta.button")}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Note */}
        <p className="text-[10px] text-center text-muted-foreground">
          {t("notSavedNote")}
        </p>
      </div>
    </div>
  );
}
