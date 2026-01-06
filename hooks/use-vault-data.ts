/**
 * useVaultData Hook
 *
 * Gestisce il caricamento dei dati vault dall'API.
 *
 * Comportamento:
 * - Se utente autenticato: carica dati dall'API
 * - Se utente autenticato ma vault vuoto: mostra vault vuoto (NON dati mock)
 * - Se utente non autenticato: mostra vault vuoto con flag isAuthenticated=false
 *
 * UPDATED: Usa la risposta del server per gli update invece di merge manuali
 */

import { useState, useEffect, useCallback } from "react";
import type { VaultCategory, VaultValue } from "@/lib/document-types";
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
  /** True se il vault è vuoto (utente autenticato ma senza dati) */
  isEmpty: boolean;
  /** True durante il caricamento */
  isLoading: boolean;
  /** Errore se presente */
  error: string | null;
  /** Numero totale di entries */
  totalEntries: number;
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
 * Trasforma le entries flat del backend in categorie per la sidebar
 */
function transformToCategories(entries: VaultEntryBackend[]): VaultCategory[] {
  // Raggruppa per nameGroup
  const grouped: Record<string, VaultEntryBackend[]> = {};

  for (const entry of entries) {
    const group = entry.nameGroup || "Altri dati";
    if (!grouped[group]) {
      grouped[group] = [];
    }
    grouped[group].push(entry);
  }

  // Converti in categorie
  const categories: VaultCategory[] = [];

  // Ordine preferito
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

  // Prima aggiungi i gruppi nell'ordine preferito
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

  // Poi aggiungi eventuali gruppi non previsti (custom groups)
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

/**
 * Token key - MUST match auth-service.ts
 */
const TOKEN_KEY = "smart_word_editor_token";

/**
 * Verifica se l'utente è autenticato
 */
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carica i dati vault dall'API
   */
  const loadVaultData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const authenticated = checkAuthenticated();
    setIsAuthenticated(authenticated);

    // Se non autenticato, non caricare nulla
    if (!authenticated) {
      setRawEntries([]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await getVaultEntries();

      if (!response.success) {
        console.warn("[useVaultData] API error:", response.error);
        setRawEntries([]);
        setError(response.error || null);
      } else {
        // Dati dall'API (può essere vuoto)
        setRawEntries(response.entries);
      }
    } catch (err) {
      console.error("[useVaultData] Load failed:", err);
      setRawEntries([]);
      setError("Errore nel caricamento dei dati");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carica i dati all'avvio
  useEffect(() => {
    loadVaultData();
  }, [loadVaultData]);

  /**
   * Aggiunge una nuova entry (usa POST /vault/entry per singola entry)
   */
  const addEntry = useCallback(
    async (entry: VaultEntryCreate): Promise<boolean> => {
      if (!checkAuthenticated()) {
        setError("Devi effettuare l'accesso per salvare i dati");
        return false;
      }

      try {
        const response = await createVaultEntry(entry);

        if (!response.success) {
          setError(response.error || "Errore nell'aggiunta");
          return false;
        }

        // Usa l'entry dalla risposta del server
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
   * IMPORTANT: Usa la risposta del server per garantire consistenza
   */
  const updateEntryFn = useCallback(
    async (entryId: string, updates: VaultEntryUpdate): Promise<boolean> => {
      if (!checkAuthenticated()) {
        setError("Devi effettuare l'accesso per modificare i dati");
        return false;
      }

      try {
        console.log(`[useVaultData] Updating entry ${entryId}:`, updates);

        const response = await updateVaultEntry(entryId, updates);

        if (!response.success) {
          console.error(`[useVaultData] Update failed:`, response.error);
          setError(response.error || "Errore nell'aggiornamento");
          return false;
        }

        // IMPORTANTE: Usa l'entry dalla risposta del server
        // Questo garantisce che lo stato locale sia sincronizzato col DB
        if (response.entry) {
          console.log(
            `[useVaultData] Update successful, new entry:`,
            response.entry
          );
          setRawEntries((prev) =>
            prev.map((entry) =>
              entry.id === entryId ? response.entry! : entry
            )
          );
        } else {
          // Fallback: se il server non ritorna l'entry, fai merge manuale
          console.warn(
            `[useVaultData] Server did not return entry, using manual merge`
          );
          setRawEntries((prev) =>
            prev.map((entry) =>
              entry.id === entryId ? { ...entry, ...updates } : entry
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
      if (!checkAuthenticated()) {
        setError("Devi effettuare l'accesso per eliminare i dati");
        return false;
      }

      try {
        const response = await deleteVaultEntry(entryId);

        if (!response.success) {
          setError(response.error || "Errore nell'eliminazione");
          return false;
        }

        // Aggiorna lo stato locale
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
  const categories = transformToCategories(rawEntries);
  const totalEntries = rawEntries.length;
  const isEmpty = isAuthenticated && rawEntries.length === 0 && !isLoading;

  return {
    categories,
    isAuthenticated,
    isEmpty,
    isLoading,
    error,
    totalEntries,
    refresh: loadVaultData,
    addEntry,
    updateEntry: updateEntryFn,
    deleteEntry: deleteEntryFn,
  };
}
