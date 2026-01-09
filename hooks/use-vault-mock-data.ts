"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { VaultCategory } from "@/lib/document-types";
import {
  buildVaultData,
  searchVaultValues,
  findVaultValueById,
} from "@/lib/vault-data";

/**
 * Hook per ottenere i dati mock del vault tradotti
 */
export function useVaultMockData() {
  const tCategories = useTranslations("vaultMock.categories");
  const tLabels = useTranslations("vaultMock.labels");

  const vaultData = useMemo(
    () =>
      buildVaultData(
        (key) => tCategories(key),
        (key) => tLabels(key)
      ),
    [tCategories, tLabels]
  );

  const search = useMemo(
    () => (query: string) => searchVaultValues(vaultData, query),
    [vaultData]
  );

  const findById = useMemo(
    () => (id: string) => findVaultValueById(vaultData, id),
    [vaultData]
  );

  return {
    vaultData,
    searchVaultValues: search,
    findVaultValueById: findById,
  };
}
