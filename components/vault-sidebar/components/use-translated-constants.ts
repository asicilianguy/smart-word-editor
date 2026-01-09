"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { VaultCategory } from "@/lib/document-types";
import {
  GROUP_OPTION_KEYS,
  GROUP_KEY_TO_VALUE,
  DEMO_CATEGORY_KEYS,
  ONBOARDING_TIP_KEYS,
} from "../constants";

/**
 * Hook per ottenere le GROUP_OPTIONS tradotte
 */
export function useGroupOptions() {
  const t = useTranslations("sidebar.constants.groups");

  return useMemo(
    () =>
      GROUP_OPTION_KEYS.map((key) => ({
        value: GROUP_KEY_TO_VALUE[key],
        label: t(key),
      })),
    [t]
  );
}

/**
 * Hook per ottenere le DEMO_CATEGORIES tradotte
 */
export function useDemoCategories(): VaultCategory[] {
  const tGroups = useTranslations("sidebar.constants.groups");
  const tLabels = useTranslations("sidebar.constants.demoLabels");

  return useMemo(
    () =>
      DEMO_CATEGORY_KEYS.map((cat) => ({
        id: cat.id,
        name: tGroups(cat.nameKey),
        icon: cat.icon,
        values: cat.values.map((val) => ({
          id: val.id,
          label: tLabels(val.labelKey),
          value: val.value,
        })),
      })),
    [tGroups, tLabels]
  );
}

/**
 * Hook per ottenere gli ONBOARDING_TIPS tradotti
 */
export function useOnboardingTips(): string[] {
  const t = useTranslations("sidebar.constants.onboardingTips");

  return useMemo(() => ONBOARDING_TIP_KEYS.map((key) => t(key)), [t]);
}
