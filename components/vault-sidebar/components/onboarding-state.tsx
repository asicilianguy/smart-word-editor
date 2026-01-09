"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Plus, ArrowRight, Settings, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { VaultValueButton } from "./vault-value-button";
import {
  useDemoCategories,
  useOnboardingTips,
} from "./use-translated-constants";
import { categoryIcons } from "../constants";
import type { VaultValue } from "@/lib/document-types";
import type { ActionType } from "../types";

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
  const t = useTranslations("sidebar.onboarding");

  const [currentTip, setCurrentTip] = useState(0);
  const canInteract = hasSelection || hasCursor;

  const demoCategories = useDemoCategories();
  const onboardingTips = useOnboardingTips();

  // Ruota i tips ogni 5 secondi
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % onboardingTips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [onboardingTips.length]);

  return (
    <div className="flex flex-col h-full">
      {/* Banner onboarding */}
      <div className="p-4 border-b border-border bg-muted/50">
        <h3 className="font-semibold text-sm mb-1">{t("welcome")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("welcomeDescription")}
        </p>

        {/* Tip rotante */}
        <div className="mt-3 flex items-center gap-2 text-xs bg-card px-3 py-2 rounded-md border border-border">
          <span className="text-muted-foreground">
            {onboardingTips[currentTip]}
          </span>
        </div>
      </div>

      {/* Demo categories */}
      <div className="flex-1 overflow-y-auto p-4">
        <Accordion
          type="multiple"
          defaultValue={demoCategories.map((c) => c.id)}
          className="space-y-2"
        >
          {demoCategories.map((category) => {
            const Icon =
              categoryIcons[category.id] ||
              categoryIcons[category.id.toLowerCase()] ||
              FileText;
            return (
              <AccordionItem
                key={category.id}
                value={category.id}
                className="border border-dashed border-border rounded-md bg-card/50"
              >
                <AccordionTrigger className="px-3 py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-muted-foreground">
                      {category.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto mr-2 bg-muted px-1.5 py-0.5 rounded">
                      {t("demoBadge")}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-2">
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
      <div className="p-4 border-t border-border bg-card space-y-3">
        <Button onClick={onAddClick} className="w-full gap-2" size="lg">
          <Plus className="h-4 w-4" />
          {t("addYourData")}
        </Button>

        {onManageClick && (
          <Button
            variant="outline"
            onClick={onManageClick}
            className="w-full gap-2 text-muted-foreground"
            size="sm"
          >
            <Settings className="h-4 w-4" />
            {t("manageVault")}
            <ArrowRight className="h-3 w-3 ml-auto" />
          </Button>
        )}

        <p className="text-[10px] text-center text-muted-foreground">
          {t("demoNotSaved")}
        </p>
      </div>
    </div>
  );
}
