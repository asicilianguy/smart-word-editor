import type { VaultCategory, VaultValue } from "@/lib/document-types";
import type { VaultEntryCreate } from "@/lib/vault-api";

export type ActionType = "replace" | "insert" | "none";

export interface VaultSidebarProps {
  categories: VaultCategory[];
  onValueClick?: (value: VaultValue) => void;
  hasSelection?: boolean;
  hasCursor?: boolean;
  selectedText?: string;
  /** True se l'utente è autenticato */
  isAuthenticated?: boolean;
  /** True se siamo in modalità demo */
  isDemo?: boolean;
  /** True se il vault è vuoto (auth ma senza dati) */
  isEmpty?: boolean;
  isLoading?: boolean;
  error?: string | null;
  /** Numero di entries aggiunte in demo mode */
  demoEntriesCount?: number;
  onAddEntry?: (entry: VaultEntryCreate) => Promise<boolean>;
  onRefresh?: () => Promise<void>;
  onAuthClick?: () => void;  // Unificato
  onManageVaultClick?: () => void;
}
