/**
 * Vault API Client
 *
 * Client per le operazioni CRUD sul vault.
 * Comunica con il backend FastAPI.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface VaultEntryBackend {
  id: string;
  valueData: string;
  nameLabel?: string;
  nameGroup?: string;
  confidence?: number;
  source?: "manual" | "extracted";
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

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE = `${API_BASE_URL}/api/auth`;
const TOKEN_KEY = "smart_word_editor_token";

// ============================================================================
// HELPERS
// ============================================================================

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }
  return response.json();
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Get all vault entries
 */
export async function getVaultEntries(): Promise<VaultResponse> {
  try {
    const response = await fetch(`${API_BASE}/vault`, {
      method: "GET",
      headers: getAuthHeaders(),
    });
    return handleResponse<VaultResponse>(response);
  } catch (error) {
    console.error("[vault-api] getVaultEntries failed:", error);
    return {
      success: false,
      entries: [],
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Create a single vault entry
 */
export async function createVaultEntry(
  entry: VaultEntryCreate
): Promise<SingleEntryResponse> {
  try {
    const response = await fetch(`${API_BASE}/vault/entry`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(entry),
    });
    return handleResponse<SingleEntryResponse>(response);
  } catch (error) {
    console.error("[vault-api] createVaultEntry failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
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
    console.log(`[vault-api] Updating entry ${entryId}:`, updates);

    const response = await fetch(`${API_BASE}/vault/${entryId}`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      body: JSON.stringify(updates),
    });

    const result = await handleResponse<SingleEntryResponse>(response);
    console.log(`[vault-api] Update response:`, result);

    return result;
  } catch (error) {
    console.error("[vault-api] updateVaultEntry failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Delete a single vault entry
 */
export async function deleteVaultEntry(
  entryId: string
): Promise<SingleEntryResponse> {
  try {
    const response = await fetch(`${API_BASE}/vault/${entryId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<SingleEntryResponse>(response);
  } catch (error) {
    console.error("[vault-api] deleteVaultEntry failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Replace all vault entries
 */
export async function replaceVaultEntries(
  entries: VaultEntryCreate[]
): Promise<VaultResponse> {
  try {
    const response = await fetch(`${API_BASE}/vault`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ entries }),
    });
    return handleResponse<VaultResponse>(response);
  } catch (error) {
    console.error("[vault-api] replaceVaultEntries failed:", error);
    return {
      success: false,
      entries: [],
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Add multiple entries to vault
 */
export async function addVaultEntries(
  entries: VaultEntryCreate[]
): Promise<VaultResponse> {
  try {
    const response = await fetch(`${API_BASE}/vault/add`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ entries }),
    });
    return handleResponse<VaultResponse>(response);
  } catch (error) {
    console.error("[vault-api] addVaultEntries failed:", error);
    return {
      success: false,
      entries: [],
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

/**
 * Clear all vault entries
 */
export async function clearVault(): Promise<VaultResponse> {
  try {
    const response = await fetch(`${API_BASE}/vault`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    return handleResponse<VaultResponse>(response);
  } catch (error) {
    console.error("[vault-api] clearVault failed:", error);
    return {
      success: false,
      entries: [],
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
