/**
 * useVaultData Hook
 *
 * Gestisce il caricamento dei dati vault dall'API.
 *
 * Comportamento:
 * - Se utente autenticato: carica dati dall'API
 * - Se utente NON autenticato: mostra dati DEMO interattivi in memoria locale
 *
 * UPDATED: Supporto completo per demo mode con dati mock modificabili + i18n
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import type { VaultCategory } from "@/lib/document-types";
import {
  getVaultEntries,
  createVaultEntry,
  updateVaultEntry,
  deleteVaultEntry,
  type VaultEntryBackend,
  type VaultEntryCreate,
  type VaultEntryUpdate,
} from "@/lib/vault-api";

// ============================================================================
// TYPES
// ============================================================================

interface UseVaultDataResult {
  /** Categorie formattate per la sidebar */
  categories: VaultCategory[];
  /** True se l'utente è autenticato */
  isAuthenticated: boolean;
  /** True se siamo in modalità demo (non autenticato) */
  isDemo: boolean;
  /** True se il vault è vuoto (utente autenticato ma senza dati) */
  isEmpty: boolean;
  /** True durante il caricamento */
  isLoading: boolean;
  /** Errore se presente */
  error: string | null;
  /** Numero totale di entries */
  totalEntries: number;
  /** Entries demo aggiunte dall'utente (non salvate) */
  demoEntriesCount: number;
  /** Ricarica i dati dall'API */
  refresh: () => Promise<void>;
  /** Aggiunge una nuova entry */
  addEntry: (entry: VaultEntryCreate) => Promise<boolean>;
  /** Aggiorna un'entry esistente */
  updateEntry: (entryId: string, updates: VaultEntryUpdate) => Promise<boolean>;
  /** Elimina un'entry */
  deleteEntry: (entryId: string) => Promise<boolean>;
}

// ============================================================================
// DEMO DATA CONFIGURATION
// Le demo entries usano chiavi di traduzione per label
// nameGroup resta in italiano perché è il valore usato per raggruppare
// ============================================================================

interface DemoEntryConfig {
  id: string;
  valueData: string;
  labelKey: string;
  nameGroup: string;
}

const DEMO_ENTRY_CONFIGS: DemoEntryConfig[] = [
  // Dati Identificativi
  {
    id: "demo-1",
    valueData: "Rossi S.r.l.",
    labelKey: "companyName",
    nameGroup: "Dati Identificativi",
  },
  {
    id: "demo-2",
    valueData: "IT01234567890",
    labelKey: "vatNumber",
    nameGroup: "Dati Identificativi",
  },
  {
    id: "demo-3",
    valueData: "RSSMRA80A01H501Z",
    labelKey: "taxCode",
    nameGroup: "Dati Identificativi",
  },
  // Persone
  {
    id: "demo-4",
    valueData: "Mario Rossi",
    labelKey: "legalRepresentative",
    nameGroup: "Persone",
  },
  // Contatti
  {
    id: "demo-5",
    valueData: "info@rossisrl.it",
    labelKey: "email",
    nameGroup: "Contatti",
  },
  {
    id: "demo-6",
    valueData: "rossisrl@pec.it",
    labelKey: "pec",
    nameGroup: "Contatti",
  },
  {
    id: "demo-7",
    valueData: "+39 02 1234567",
    labelKey: "phone",
    nameGroup: "Contatti",
  },
  // Indirizzi
  {
    id: "demo-8",
    valueData: "Via Roma 123, 20100 Milano (MI)",
    labelKey: "registeredOffice",
    nameGroup: "Indirizzi",
  },
  // Coordinate Bancarie
  {
    id: "demo-9",
    valueData: "IT60X0542811101000000123456",
    labelKey: "iban",
    nameGroup: "Coordinate Bancarie",
  },
];

// ============================================================================
// GROUP TRANSLATION MAPPING
// Mappa da nome gruppo italiano a chiave di traduzione
// ============================================================================

const GROUP_NAME_TO_KEY: Record<string, string> = {
  "Dati Identificativi": "identification",
  Persone: "people",
  Contatti: "contacts",
  Indirizzi: "addresses",
  "Coordinate Bancarie": "banking",
  "Dati Professionali": "professional",
  Certificazioni: "certifications",
  "Altri dati": "other",
};

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_GROUPS: Record<string, { icon: string }> = {
  "Dati Identificativi": { icon: "building" },
  Persone: { icon: "users" },
  Contatti: { icon: "mail" },
  Indirizzi: { icon: "map-pin" },
  "Coordinate Bancarie": { icon: "landmark" },
  "Dati Professionali": { icon: "briefcase" },
  Certificazioni: { icon: "award" },
  "Altri dati": { icon: "file-text" },
};

const PREFERRED_ORDER = [
  "Dati Identificativi",
  "Persone",
  "Contatti",
  "Indirizzi",
  "Coordinate Bancarie",
  "Dati Professionali",
  "Certificazioni",
  "Altri dati",
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verifica se un'entry è una demo entry (non dell'utente)
 */
function isDemoEntry(id: string): boolean {
  return id.startsWith("demo-");
}

/**
 * Verifica se un'entry è stata aggiunta dall'utente in demo mode
 */
function isUserDemoEntry(id: string): boolean {
  return id.startsWith("user-demo-");
}

/**
 * Trasforma le entries flat del backend in categorie per la sidebar
 */
function transformToCategories(
  entries: VaultEntryBackend[],
  translateGroup: (groupName: string) => string
): VaultCategory[] {
  const grouped: Record<string, VaultEntryBackend[]> = {};

  for (const entry of entries) {
    const group = entry.nameGroup || "Altri dati";
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(entry);
  }

  const categories: VaultCategory[] = [];

  for (const groupName of PREFERRED_ORDER) {
    if (grouped[groupName]) {
      const groupInfo = DEFAULT_GROUPS[groupName] || { icon: "file-text" };
      categories.push({
        id: groupName.toLowerCase().replace(/\s+/g, "-"),
        name: translateGroup(groupName),
        icon: groupInfo.icon,
        values: grouped[groupName].map((entry) => ({
          id: entry.id,
          label: entry.nameLabel || entry.valueData,
          value: entry.valueData,
        })),
      });
      delete grouped[groupName];
    }
  }

  // Gruppi custom non nell'ordine predefinito
  for (const [groupName, groupEntries] of Object.entries(grouped)) {
    categories.push({
      id: groupName.toLowerCase().replace(/\s+/g, "-"),
      name: translateGroup(groupName),
      icon: "file-text",
      values: groupEntries.map((entry) => ({
        id: entry.id,
        label: entry.nameLabel || entry.valueData,
        value: entry.valueData,
      })),
    });
  }

  return categories;
}

const TOKEN_KEY = "smart_word_editor_token";

function checkAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem(TOKEN_KEY);
  return !!token;
}

// ============================================================================
// HOOK
// ============================================================================

export function useVaultData(): UseVaultDataResult {
  const tGroups = useTranslations("sidebar.constants.groups");
  const tLabels = useTranslations("sidebar.vaultData.demoLabels");
  const tErrors = useTranslations("sidebar.vaultData.errors");

  const [rawEntries, setRawEntries] = useState<VaultEntryBackend[]>([]);
  const [demoEntries, setDemoEntries] = useState<VaultEntryBackend[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Crea le demo entries tradotte
   */
  const translatedDemoEntries = useMemo((): VaultEntryBackend[] => {
    return DEMO_ENTRY_CONFIGS.map((config) => ({
      id: config.id,
      valueData: config.valueData,
      nameLabel: tLabels(config.labelKey),
      nameGroup: config.nameGroup,
    }));
  }, [tLabels]);

  /**
   * Funzione per tradurre i nomi dei gruppi
   */
  const translateGroup = useCallback(
    (groupName: string): string => {
      const key = GROUP_NAME_TO_KEY[groupName];
      return key ? tGroups(key) : groupName;
    },
    [tGroups]
  );

  /**
   * Carica i dati vault dall'API o inizializza demo
   */
  const loadVaultData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const authenticated = checkAuthenticated();
    setIsAuthenticated(authenticated);

    // Se non autenticato, usa dati demo
    if (!authenticated) {
      setRawEntries([]);
      // Inizializza demo entries solo se vuote
      setDemoEntries((prev) =>
        prev.length === 0 ? [...translatedDemoEntries] : prev
      );
      setIsLoading(false);
      return;
    }

    // Se autenticato, carica da API
    try {
      const response = await getVaultEntries();

      if (!response.success) {
        console.warn("[useVaultData] API error:", response.error);
        setRawEntries([]);
        setError(response.error || null);
      } else {
        setRawEntries(response.entries);
        // Pulisci dati demo quando si autentica
        setDemoEntries([]);
      }
    } catch (err) {
      console.error("[useVaultData] Load failed:", err);
      setRawEntries([]);
      setError(tErrors("loadFailed"));
    } finally {
      setIsLoading(false);
    }
  }, [translatedDemoEntries, tErrors]);

  useEffect(() => {
    loadVaultData();
  }, [loadVaultData]);

  /**
   * Aggiunge una nuova entry
   * - Se autenticato: salva su API
   * - Se non autenticato: aggiunge in memoria locale (demo)
   */
  const addEntry = useCallback(
    async (entry: VaultEntryCreate): Promise<boolean> => {
      const authenticated = checkAuthenticated();

      // DEMO MODE: aggiungi in memoria locale
      if (!authenticated) {
        const newEntry: VaultEntryBackend = {
          id: `user-demo-${Date.now()}`,
          valueData: entry.valueData,
          nameLabel: entry.nameLabel,
          nameGroup: entry.nameGroup,
          source: "manual",
        };
        setDemoEntries((prev) => [...prev, newEntry]);
        return true;
      }

      // AUTHENTICATED: salva su API
      try {
        const response = await createVaultEntry(entry);

        if (!response.success) {
          setError(response.error || tErrors("addFailed"));
          return false;
        }

        if (response.entry) {
          setRawEntries((prev) => [...prev, response.entry!]);
        }
        setError(null);
        return true;
      } catch (err) {
        console.error("[useVaultData] Add failed:", err);
        setError(tErrors("addFailed"));
        return false;
      }
    },
    [tErrors]
  );

  /**
   * Aggiorna un'entry esistente
   */
  const updateEntryFn = useCallback(
    async (entryId: string, updates: VaultEntryUpdate): Promise<boolean> => {
      const authenticated = checkAuthenticated();

      // DEMO MODE: aggiorna in memoria locale
      if (!authenticated) {
        setDemoEntries((prev) =>
          prev.map((entry) =>
            entry.id === entryId ? { ...entry, ...updates } : entry
          )
        );
        return true;
      }

      // AUTHENTICATED: aggiorna su API
      try {
        const response = await updateVaultEntry(entryId, updates);

        if (!response.success) {
          setError(response.error || tErrors("updateFailed"));
          return false;
        }

        if (response.entry) {
          setRawEntries((prev) =>
            prev.map((entry) =>
              entry.id === entryId ? response.entry! : entry
            )
          );
        }

        setError(null);
        return true;
      } catch (err) {
        console.error("[useVaultData] Update failed:", err);
        setError(tErrors("updateFailed"));
        return false;
      }
    },
    [tErrors]
  );

  /**
   * Elimina un'entry
   */
  const deleteEntryFn = useCallback(
    async (entryId: string): Promise<boolean> => {
      const authenticated = checkAuthenticated();

      // DEMO MODE: elimina da memoria locale
      if (!authenticated) {
        setDemoEntries((prev) => prev.filter((entry) => entry.id !== entryId));
        return true;
      }

      // AUTHENTICATED: elimina da API
      try {
        const response = await deleteVaultEntry(entryId);

        if (!response.success) {
          setError(response.error || tErrors("deleteFailed"));
          return false;
        }

        setRawEntries((prev) => prev.filter((entry) => entry.id !== entryId));
        setError(null);
        return true;
      } catch (err) {
        console.error("[useVaultData] Delete failed:", err);
        setError(tErrors("deleteFailed"));
        return false;
      }
    },
    [tErrors]
  );

  // Calcola le categorie da visualizzare
  const isDemo = !isAuthenticated;
  const activeEntries = isDemo ? demoEntries : rawEntries;
  const categories = useMemo(
    () => transformToCategories(activeEntries, translateGroup),
    [activeEntries, translateGroup]
  );
  const totalEntries = activeEntries.length;
  const isEmpty = isAuthenticated && rawEntries.length === 0 && !isLoading;

  // Conta le entries aggiunte dall'utente in demo mode
  const demoEntriesCount = demoEntries.filter((e) =>
    isUserDemoEntry(e.id)
  ).length;

  return {
    categories,
    isAuthenticated,
    isDemo,
    isEmpty,
    isLoading,
    error,
    totalEntries,
    demoEntriesCount,
    refresh: loadVaultData,
    addEntry,
    updateEntry: updateEntryFn,
    deleteEntry: deleteEntryFn,
  };
}

// Esporta le funzioni helper per usarle nei componenti
export { isDemoEntry, isUserDemoEntry };
