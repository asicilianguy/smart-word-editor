/**
 * Vault API Client
 *
 * Funzioni per interagire con le API vault del backend.
 * Da aggiungere a lib/api-client.ts
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================================================
// TYPES
// ============================================================================

export interface VaultEntryBackend {
  id: string;
  valueData: string;
  nameLabel?: string | null;
  nameGroup?: string | null;
  confidence?: number | null;
  source?: "manual" | "extracted";
}

export interface VaultResponse {
  success: boolean;
  entries: VaultEntryBackend[];
  error?: string;
}

export interface SingleEntryResponse {
  success: boolean;
  entry?: VaultEntryBackend;
  error?: string;
}

export interface VaultEntryCreate {
  valueData: string;
  nameLabel?: string;
  nameGroup?: string;
  source?: "manual" | "extracted";
}

export interface VaultEntryUpdate {
  valueData?: string;
  nameLabel?: string;
  nameGroup?: string;
}

// ============================================================================
// HELPER
// ============================================================================

/**
 * Token key - MUST match auth-service.ts
 */
const TOKEN_KEY = "smart_word_editor_token";

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ============================================================================
// VAULT API FUNCTIONS
// ============================================================================

/**
 * Get all vault entries for the current user
 */
export async function getVaultEntries(): Promise<VaultResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/vault`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      return { success: false, entries: [], error: "Not authenticated" };
    }

    if (!response.ok) {
      return { success: false, entries: [], error: "Failed to fetch vault" };
    }

    return response.json();
  } catch (error) {
    console.error("[Vault API] Get entries failed:", error);
    return { success: false, entries: [], error: "Network error" };
  }
}

/**
 * Add new entries to the vault (batch)
 */
export async function addVaultEntries(
  entries: VaultEntryCreate[]
): Promise<VaultResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/vault/add`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ entries }),
    });

    if (response.status === 401) {
      return { success: false, entries: [], error: "Not authenticated" };
    }

    if (!response.ok) {
      return { success: false, entries: [], error: "Failed to add entries" };
    }

    return response.json();
  } catch (error) {
    console.error("[Vault API] Add entries failed:", error);
    return { success: false, entries: [], error: "Network error" };
  }
}

/**
 * Create a single vault entry
 */
export async function createVaultEntry(
  entry: VaultEntryCreate
): Promise<SingleEntryResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/vault/entry`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(entry),
    });

    if (response.status === 401) {
      return { success: false, error: "Not authenticated" };
    }

    if (!response.ok) {
      return { success: false, error: "Failed to create entry" };
    }

    return response.json();
  } catch (error) {
    console.error("[Vault API] Create entry failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Update a single vault entry
 */
export async function updateVaultEntry(
  entryId: string,
  updates: VaultEntryUpdate
): Promise<SingleEntryResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/vault/${entryId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    if (response.status === 401) {
      return { success: false, error: "Not authenticated" };
    }

    if (!response.ok) {
      return { success: false, error: "Failed to update entry" };
    }

    return response.json();
  } catch (error) {
    console.error("[Vault API] Update entry failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Delete a single vault entry
 */
export async function deleteVaultEntry(
  entryId: string
): Promise<SingleEntryResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/vault/${entryId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      return { success: false, error: "Not authenticated" };
    }

    if (!response.ok) {
      return { success: false, error: "Failed to delete entry" };
    }

    return response.json();
  } catch (error) {
    console.error("[Vault API] Delete entry failed:", error);
    return { success: false, error: "Network error" };
  }
}

/**
 * Replace all vault entries
 */
export async function replaceVaultEntries(
  entries: VaultEntryCreate[]
): Promise<VaultResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/vault`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ entries }),
    });

    if (response.status === 401) {
      return { success: false, entries: [], error: "Not authenticated" };
    }

    if (!response.ok) {
      return { success: false, entries: [], error: "Failed to update vault" };
    }

    return response.json();
  } catch (error) {
    console.error("[Vault API] Replace entries failed:", error);
    return { success: false, entries: [], error: "Network error" };
  }
}

/**
 * Clear all vault entries
 */
export async function clearVault(): Promise<VaultResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/vault`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    if (response.status === 401) {
      return { success: false, entries: [], error: "Not authenticated" };
    }

    if (!response.ok) {
      return { success: false, entries: [], error: "Failed to clear vault" };
    }

    return response.json();
  } catch (error) {
    console.error("[Vault API] Clear vault failed:", error);
    return { success: false, entries: [], error: "Network error" };
  }
}
