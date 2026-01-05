/**
 * Tipi per il sistema di autenticazione e vault
 */

// ============================================================================
// REGISTRATION
// ============================================================================

export interface RegistrationStep1 {
  phone: string;
  password: string;
}

export type VaultPopulationMethod = "manual" | "upload" | "skip";

// ============================================================================
// VAULT ENTRIES
// ============================================================================

export interface VaultEntry {
  id: string;
  /** Il valore effettivo da inserire nel documento (REQUIRED) */
  valueData: string;
  /** Etichetta descrittiva, es. "IBAN Principale" */
  nameLabel?: string;
  /** Gruppo per organizzare nella sidebar, es. "Coordinate Bancarie" */
  nameGroup?: string;
  createdAt: Date;
  source: "manual" | "extracted";
}

// ============================================================================
// DOCUMENTS
// ============================================================================

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: Date;
  status: "pending" | "processing" | "completed" | "error";
  extractedEntries?: VaultEntry[];
  /** Numero di pagine del documento */
  pageCount?: number;
}

// ============================================================================
// HELPERS
// ============================================================================

export function generateEntryId(): string {
  return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function validateItalianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, "");
  const regex = /^(\+39)?[0-9]{8,12}$/;
  return regex.test(cleaned);
}

export function formatItalianPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.startsWith("+39")) {
    return cleaned;
  }
  return `+39${cleaned}`;
}
