import type { VaultCategory, VaultValue } from "@/lib/document-types";
import type { VaultEntryCreate } from "@/lib/vault-api";

export interface VaultSidebarProps {
  categories: VaultCategory[];
  onValueClick?: (value: VaultValue) => void;
  /** C'è testo selezionato nell'editor */
  hasSelection?: boolean;
  /** L'editor ha il focus (cursore attivo) */
  hasCursor?: boolean;
  /** Testo attualmente selezionato (opzionale, per mostrarlo) */
  selectedText?: string;
  /** True se l'utente è autenticato */
  isAuthenticated?: boolean;
  /** True se il vault è vuoto (autenticato ma senza dati) */
  isEmpty?: boolean;
  /** True durante il caricamento */
  isLoading?: boolean;
  /** Errore se presente */
  error?: string | null;
  /** Callback per aggiungere una nuova entry */
  onAddEntry?: (entry: VaultEntryCreate) => Promise<boolean>;
  /** Callback per ricaricare i dati */
  onRefresh?: () => Promise<void>;
  /** Callback per navigare al login */
  onLoginClick?: () => void;
  /** Callback per navigare alla gestione vault */
  onManageVaultClick?: () => void;
}

export type ActionType = "replace" | "insert" | "none";
