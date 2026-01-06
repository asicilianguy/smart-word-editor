"use client";

import { FileText, Settings, ArrowRight } from "lucide-react";
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
import { cn } from "@/lib/utils";

interface VaultCategoryListProps {
  categories: VaultCategory[];
  filteredCategories: VaultCategory[];
  searchQuery: string;
  onValueClick?: (value: VaultValue) => void;
  onManageClick?: () => void;
  canInteract: boolean;
  actionType: ActionType;
  hasSelection: boolean;
}

export function VaultCategoryList({
  categories,
  filteredCategories,
  searchQuery,
  onValueClick,
  onManageClick,
  canInteract,
  actionType,
  hasSelection,
}: VaultCategoryListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        <Accordion
          type="multiple"
          defaultValue={categories.map((c) => c.id)}
          className="space-y-2"
        >
          {filteredCategories.map((category) => {
            const Icon =
              categoryIcons[category.id] ||
              categoryIcons[category.id.toLowerCase()] ||
              FileText;
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

        {filteredCategories.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              Nessun risultato per &quot;{searchQuery}&quot;
            </p>
          </div>
        )}
      </div>

      {/* CTA per gestire vault */}
      {onManageClick && (
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            onClick={onManageClick}
            className="w-full justify-between text-xs text-muted-foreground hover:text-foreground"
            size="sm"
          >
            <span className="flex items-center gap-2">
              <Settings className="h-3.5 w-3.5" />
              Gestisci tutti i dati
            </span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
