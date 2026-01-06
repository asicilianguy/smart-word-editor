/**
 * Auth Service
 *
 * Core authentication functions for login, register, token management.
 * Handles JWT storage in localStorage and API communication.
 */

import type { VaultEntry } from "./auth-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================================================
// TYPES
// ============================================================================

export interface AuthUser {
  id: string;
  phone_number: string;
  tokens: number;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
}

export interface UserProfile {
  id: string;
  phone_number: string;
  tokens: number;
  vault_entries_count: number;
  created_at: string;
}

export interface VaultResponse {
  success: boolean;
  entries: VaultEntryAPI[];
  error?: string;
}

export interface VaultEntryAPI {
  valueData: string;
  nameLabel?: string | null;
  nameGroup?: string | null;
  confidence?: number | null;
}

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

const TOKEN_KEY = "smart_word_editor_token";
const USER_KEY = "smart_word_editor_user";

/**
 * Save token to localStorage
 */
export function saveToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * Get token from localStorage
 */
export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

/**
 * Remove token from localStorage
 */
export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

/**
 * Save user to localStorage
 */
export function saveUser(user: AuthUser): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

/**
 * Get user from localStorage
 */
export function getStoredUser(): AuthUser | null {
  if (typeof window !== "undefined") {
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  // Check if token is expired by decoding JWT
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() < exp;
  } catch {
    return false;
  }
}

/**
 * Get auth headers for API requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
  return {};
}

// ============================================================================
// AUTH API FUNCTIONS
// ============================================================================

/**
 * Register a new user
 */
export async function register(
  phone: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: formatPhone(phone),
        password,
      }),
    });

    const data: AuthResponse = await response.json();

    if (data.success && data.token && data.user) {
      saveToken(data.token);
      saveUser(data.user);
    }

    return data;
  } catch (error) {
    console.error("[Auth] Register error:", error);
    return {
      success: false,
      error: "Errore di connessione. Riprova più tardi.",
    };
  }
}

/**
 * Login user
 */
export async function login(
  phone: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phone_number: formatPhone(phone),
        password,
      }),
    });

    const data: AuthResponse = await response.json();

    if (data.success && data.token && data.user) {
      saveToken(data.token);
      saveUser(data.user);
    }

    return data;
  } catch (error) {
    console.error("[Auth] Login error:", error);
    return {
      success: false,
      error: "Errore di connessione. Riprova più tardi.",
    };
  }
}

/**
 * Logout user
 */
export function logout(): void {
  removeToken();
  // Redirect to login page
  if (typeof window !== "undefined") {
    window.location.href = "/auth/login";
  }
}

/**
 * Get current user profile
 */
export async function getProfile(): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (response.status === 401) {
      // Token expired or invalid
      removeToken();
      return null;
    }

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error("[Auth] Get profile error:", error);
    return null;
  }
}

// ============================================================================
// VAULT API FUNCTIONS
// ============================================================================

/**
 * Get user's vault entries from backend
 */
export async function getVault(): Promise<VaultResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/vault`, {
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (response.status === 401) {
      removeToken();
      return { success: false, entries: [], error: "Non autorizzato" };
    }

    return response.json();
  } catch (error) {
    console.error("[Auth] Get vault error:", error);
    return {
      success: false,
      entries: [],
      error: "Errore di connessione",
    };
  }
}

/**
 * Update user's vault entries (replace all)
 */
export async function updateVault(
  entries: VaultEntry[]
): Promise<VaultResponse> {
  try {
    // Convert VaultEntry to API format
    const apiEntries: VaultEntryAPI[] = entries.map((e) => ({
      valueData: e.valueData,
      nameLabel: e.nameLabel || null,
      nameGroup: e.nameGroup || null,
      confidence: null,
    }));

    const response = await fetch(`${API_BASE_URL}/api/auth/vault`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ entries: apiEntries }),
    });

    if (response.status === 401) {
      removeToken();
      return { success: false, entries: [], error: "Non autorizzato" };
    }

    return response.json();
  } catch (error) {
    console.error("[Auth] Update vault error:", error);
    return {
      success: false,
      entries: [],
      error: "Errore di connessione",
    };
  }
}

/**
 * Add entries to user's vault (append)
 */
export async function addToVault(
  entries: VaultEntry[]
): Promise<VaultResponse> {
  try {
    const apiEntries: VaultEntryAPI[] = entries.map((e) => ({
      valueData: e.valueData,
      nameLabel: e.nameLabel || null,
      nameGroup: e.nameGroup || null,
      confidence: null,
    }));

    const response = await fetch(`${API_BASE_URL}/api/auth/vault/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ entries: apiEntries }),
    });

    if (response.status === 401) {
      removeToken();
      return { success: false, entries: [], error: "Non autorizzato" };
    }

    return response.json();
  } catch (error) {
    console.error("[Auth] Add to vault error:", error);
    return {
      success: false,
      entries: [],
      error: "Errore di connessione",
    };
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format phone number to +39 format
 */
function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\s/g, "");
  if (cleaned.startsWith("+39")) {
    return cleaned;
  }
  if (cleaned.startsWith("39")) {
    return `+${cleaned}`;
  }
  return `+39${cleaned}`;
}
