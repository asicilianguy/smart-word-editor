/**
 * useVaultData Hook
 *
 * Gestisce il caricamento dei dati vault dall'API.
 *
 * Comportamento:
 * - Se utente autenticato: carica dati dall'API
 * - Se utente NON autenticato: mostra dati DEMO interattivi in memoria locale
 *
 * UPDATED: Supporto completo per demo mode con dati mock modificabili
 */

import { useState, useEffect, useCallback } from "react";
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
// DEMO DATA
// Le demo entries usano ID che iniziano con "demo-" per identificarle
// source è undefined per evitare conflitti di tipo
// ============================================================================

const DEMO_ENTRIES: VaultEntryBackend[] = [
  // Dati Identificativi
  {
    id: "demo-1",
    valueData: "Rossi S.r.l.",
    nameLabel: "Ragione Sociale",
    nameGroup: "Dati Identificativi",
  },
  {
    id: "demo-2",
    valueData: "IT01234567890",
    nameLabel: "Partita IVA",
    nameGroup: "Dati Identificativi",
  },
  {
    id: "demo-3",
    valueData: "RSSMRA80A01H501Z",
    nameLabel: "Codice Fiscale",
    nameGroup: "Dati Identificativi",
  },
  // Persone
  {
    id: "demo-4",
    valueData: "Mario Rossi",
    nameLabel: "Legale Rappresentante",
    nameGroup: "Persone",
  },
  // Contatti
  {
    id: "demo-5",
    valueData: "info@rossisrl.it",
    nameLabel: "Email",
    nameGroup: "Contatti",
  },
  {
    id: "demo-6",
    valueData: "rossisrl@pec.it",
    nameLabel: "PEC",
    nameGroup: "Contatti",
  },
  {
    id: "demo-7",
    valueData: "+39 02 1234567",
    nameLabel: "Telefono",
    nameGroup: "Contatti",
  },
  // Indirizzi
  {
    id: "demo-8",
    valueData: "Via Roma 123, 20100 Milano (MI)",
    nameLabel: "Sede Legale",
    nameGroup: "Indirizzi",
  },
  // Coordinate Bancarie
  {
    id: "demo-9",
    valueData: "IT60X0542811101000000123456",
    nameLabel: "IBAN",
    nameGroup: "Coordinate Bancarie",
  },
];

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_GROUPS: Record<string, { name: string; icon: string }> = {
  "Dati Identificativi": { name: "Dati Identificativi", icon: "building" },
  Persone: { name: "Persone", icon: "users" },
  Contatti: { name: "Contatti", icon: "mail" },
  Indirizzi: { name: "Indirizzi", icon: "map-pin" },
  "Coordinate Bancarie": { name: "Coordinate Bancarie", icon: "landmark" },
  "Dati Professionali": { name: "Dati Professionali", icon: "briefcase" },
  Certificazioni: { name: "Certificazioni", icon: "award" },
  "Altri dati": { name: "Altri dati", icon: "file-text" },
};

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
function transformToCategories(entries: VaultEntryBackend[]): VaultCategory[] {
  const grouped: Record<string, VaultEntryBackend[]> = {};

  for (const entry of entries) {
    const group = entry.nameGroup || "Altri dati";
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(entry);
  }

  const categories: VaultCategory[] = [];

  const preferredOrder = [
    "Dati Identificativi",
    "Persone",
    "Contatti",
    "Indirizzi",
    "Coordinate Bancarie",
    "Dati Professionali",
    "Certificazioni",
    "Altri dati",
  ];

  for (const groupName of preferredOrder) {
    if (grouped[groupName]) {
      const groupInfo = DEFAULT_GROUPS[groupName] || {
        name: groupName,
        icon: "file-text",
      };
      categories.push({
        id: groupName.toLowerCase().replace(/\s+/g, "-"),
        name: groupInfo.name,
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

  for (const [groupName, groupEntries] of Object.entries(grouped)) {
    categories.push({
      id: groupName.toLowerCase().replace(/\s+/g, "-"),
      name: groupName,
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
  const [rawEntries, setRawEntries] = useState<VaultEntryBackend[]>([]);
  const [demoEntries, setDemoEntries] = useState<VaultEntryBackend[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setDemoEntries((prev) => (prev.length === 0 ? [...DEMO_ENTRIES] : prev));
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
      setError("Errore nel caricamento dei dati");
    } finally {
      setIsLoading(false);
    }
  }, []);

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
          setError(response.error || "Errore nell'aggiunta");
          return false;
        }

        if (response.entry) {
          setRawEntries((prev) => [...prev, response.entry!]);
        }
        setError(null);
        return true;
      } catch (err) {
        console.error("[useVaultData] Add failed:", err);
        setError("Errore nell'aggiunta del dato");
        return false;
      }
    },
    []
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
          setError(response.error || "Errore nell'aggiornamento");
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
        setError("Errore nell'aggiornamento del dato");
        return false;
      }
    },
    []
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
          setError(response.error || "Errore nell'eliminazione");
          return false;
        }

        setRawEntries((prev) => prev.filter((entry) => entry.id !== entryId));
        setError(null);
        return true;
      } catch (err) {
        console.error("[useVaultData] Delete failed:", err);
        setError("Errore nell'eliminazione del dato");
        return false;
      }
    },
    []
  );

  // Calcola le categorie da visualizzare
  const isDemo = !isAuthenticated;
  const activeEntries = isDemo ? demoEntries : rawEntries;
  const categories = transformToCategories(activeEntries);
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
