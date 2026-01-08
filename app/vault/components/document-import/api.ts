import { getAuthHeaders } from "@/lib/auth";
import type { ValidationResult, ExtractionResult } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Valida documenti (conteggio pagine)
 * PUBLIC endpoint
 */
export async function validateDocuments(
  files: File[]
): Promise<ValidationResult> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  const response = await fetch(
    `${API_BASE_URL}/api/documents/validate-documents`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Errore durante la validazione");
  }

  return response.json();
}

// ============================================================================
// EXTRACTION
// ============================================================================

/**
 * Estrae dati dai documenti SENZA salvare automaticamente
 * PROTECTED endpoint - consuma token
 */
export async function extractVaultData(
  files: File[],
  usePremium: boolean = false
): Promise<ExtractionResult> {
  const authHeaders = getAuthHeaders();
  const hasAuth = authHeaders && Object.keys(authHeaders).length > 0;

  if (!hasAuth) {
    return {
      success: false,
      entries: [],
      model_used: "",
      tokens_used: 0,
      documents_processed: 0,
      tokens_consumed: 0,
      tokens_remaining: 0,
      error: "Non autorizzato. Effettua il login.",
      error_code: "UNAUTHORIZED",
    };
  }

  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));

  // IMPORTANTE: save_to_vault=false - l'utente decide cosa salvare
  const url = new URL(`${API_BASE_URL}/api/vault/extract-authenticated`);
  url.searchParams.set("use_premium", usePremium.toString());
  url.searchParams.set("save_to_vault", "false");

  try {
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: authHeaders,
      body: formData,
    });

    if (response.status === 401) {
      return {
        success: false,
        entries: [],
        model_used: "",
        tokens_used: 0,
        documents_processed: 0,
        tokens_consumed: 0,
        tokens_remaining: 0,
        error: "Sessione scaduta. Effettua nuovamente il login.",
        error_code: "UNAUTHORIZED",
      };
    }

    return response.json();
  } catch (error) {
    console.error("Extraction error:", error);
    return {
      success: false,
      entries: [],
      model_used: "",
      tokens_used: 0,
      documents_processed: 0,
      tokens_consumed: 0,
      tokens_remaining: 0,
      error: "Errore di connessione.",
      error_code: "NETWORK_ERROR",
    };
  }
}

// ============================================================================
// FETCH EXISTING VAULT VALUES
// ============================================================================

/**
 * Ottiene i valueData esistenti nel vault per calcolare duplicati
 */
export async function fetchExistingVaultValues(): Promise<string[]> {
  const authHeaders = getAuthHeaders();

  if (!authHeaders || Object.keys(authHeaders).length === 0) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/vault`, {
      method: "GET",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const entries = data.entries || [];

    // Estrai solo i valueData normalizzati
    return entries
      .map((e: { valueData?: string }) =>
        (e.valueData || "").trim().toLowerCase()
      )
      .filter((v: string) => v.length > 0);
  } catch {
    return [];
  }
}

// ============================================================================
// SAVE TO VAULT
// ============================================================================

interface VaultEntryForSave {
  valueData: string;
  nameLabel?: string;
  nameGroup?: string;
}

/**
 * Genera una chiave univoca per la deduplicazione
 * Basata solo su valueData
 */
function generateEntryKey(entry: VaultEntryForSave): string {
  return (entry.valueData || "").trim().toLowerCase();
}

/**
 * Rimuove duplicati basati sulla tripla (valueData, nameLabel, nameGroup)
 */
function deduplicateEntries<T extends VaultEntryForSave>(entries: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const entry of entries) {
    const key = generateEntryKey(entry);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(entry);
    }
  }

  return result;
}

/**
 * Salva entries selezionate nel vault
 * Usa POST /api/auth/vault/add per appendere
 * Gestisce deduplicazione automatica
 */
export async function saveEntriesToVault(
  entries: VaultEntryForSave[]
): Promise<{ success: boolean; savedCount: number; error?: string }> {
  const authHeaders = getAuthHeaders();

  if (!authHeaders || Object.keys(authHeaders).length === 0) {
    return { success: false, savedCount: 0, error: "Non autorizzato" };
  }

  try {
    // 1. Prima otteniamo le entries esistenti per deduplicare
    const getResponse = await fetch(`${API_BASE_URL}/api/auth/vault`, {
      method: "GET",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
    });

    if (!getResponse.ok) {
      return {
        success: false,
        savedCount: 0,
        error: "Errore nel recupero del vault",
      };
    }

    const currentVault = await getResponse.json();
    const existingEntries: VaultEntryForSave[] = currentVault.entries || [];

    // 2. Crea un set delle chiavi esistenti per deduplicazione
    const existingKeys = new Set<string>();
    for (const entry of existingEntries) {
      existingKeys.add(generateEntryKey(entry));
    }

    // 3. Filtra le nuove entries per rimuovere duplicati
    // - Prima rimuovi duplicati interni alle nuove entries
    // - Poi rimuovi quelle già esistenti nel vault
    const dedupedNew = deduplicateEntries(entries);
    const uniqueNewEntries = dedupedNew.filter(
      (entry) => !existingKeys.has(generateEntryKey(entry))
    );

    if (uniqueNewEntries.length === 0) {
      // Tutte le entries erano duplicati
      return {
        success: true,
        savedCount: 0,
        error: "Tutti i dati selezionati sono già presenti nel vault",
      };
    }

    // 4. Prepara le entries nel formato richiesto dal backend
    const entriesToSave = uniqueNewEntries.map((entry) => ({
      valueData: entry.valueData,
      nameLabel: entry.nameLabel || null,
      nameGroup: entry.nameGroup || "Altri dati",
      source: "extracted",
    }));

    // 5. Usa POST /vault/add per appendere (formato corretto: { entries: [...] })
    const postResponse = await fetch(`${API_BASE_URL}/api/auth/vault/add`, {
      method: "POST",
      headers: {
        ...authHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ entries: entriesToSave }),
    });

    if (!postResponse.ok) {
      const errorData = await postResponse.json().catch(() => ({}));
      console.error("Save error response:", errorData);
      return { success: false, savedCount: 0, error: "Errore nel salvataggio" };
    }

    const result = await postResponse.json();

    if (result.success) {
      return {
        success: true,
        savedCount: uniqueNewEntries.length,
      };
    } else {
      return {
        success: false,
        savedCount: 0,
        error: result.error || "Errore nel salvataggio",
      };
    }
  } catch (error) {
    console.error("Save error:", error);
    return { success: false, savedCount: 0, error: "Errore di connessione" };
  }
}
