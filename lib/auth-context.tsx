"use client";

/**
 * Auth Context
 *
 * React context for managing authentication state across the app.
 * Provides user info, auth status, and auth functions.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  isAuthenticated as checkAuth,
  getStoredUser,
  getProfile,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  getVault,
  updateVault,
  addToVault,
  saveToken,
  saveUser,
  type AuthUser,
  type AuthResponse,
  type VaultResponse,
  type VaultEntryAPI,
} from "./auth";
import type { VaultEntry } from "./auth-types";
import { generateEntryId } from "./auth-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ============================================================================
// TYPES
// ============================================================================

export interface AuthenticateResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  isNewUser?: boolean;
  hasVaultEntries?: boolean;
  error?: string;
}

interface AuthContextValue {
  // State
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Vault state
  vaultEntries: VaultEntry[];
  isVaultLoading: boolean;

  // Auth actions
  authenticate: (
    phone: string,
    password: string
  ) => Promise<AuthenticateResponse>;
  login: (phone: string, password: string) => Promise<AuthResponse>;
  register: (phone: string, password: string) => Promise<AuthResponse>;
  logout: () => void;

  // Vault actions
  refreshVault: () => Promise<void>;
  saveVault: (entries: VaultEntry[]) => Promise<VaultResponse>;
  appendToVault: (entries: VaultEntry[]) => Promise<VaultResponse>;

  // Utility
  refreshAuth: () => Promise<void>;
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

// ============================================================================
// CONTEXT
// ============================================================================

const AuthContext = createContext<AuthContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [vaultEntries, setVaultEntries] = useState<VaultEntry[]>([]);
  const [isVaultLoading, setIsVaultLoading] = useState(false);

  // ============================================================================
  // INITIALIZE AUTH STATE
  // ============================================================================

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      // Check if we have a valid token
      if (checkAuth()) {
        // Try to get stored user first (fast)
        const storedUser = getStoredUser();
        if (storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
        }

        // Then verify with backend (slower but accurate)
        const profile = await getProfile();
        if (profile) {
          setUser({
            id: profile.id,
            phone_number: profile.phone_number,
            tokens: profile.tokens,
          });
          setIsAuthenticated(true);
        } else {
          // Token invalid
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  // ============================================================================
  // AUTH ACTIONS
  // ============================================================================

  /**
   * Unified authenticate - handles both login and registration
   *
   * - If phone exists → login (verify password)
   * - If phone doesn't exist → register (create user)
   *
   * Returns isNewUser and hasVaultEntries for smart redirect
   */
  const authenticate = useCallback(
    async (phone: string, password: string): Promise<AuthenticateResponse> => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/authenticate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone_number: formatPhone(phone),
            password,
          }),
        });

        const data: AuthenticateResponse = await response.json();

        if (data.success && data.token && data.user) {
          saveToken(data.token);
          saveUser(data.user);
          setUser(data.user);
          setIsAuthenticated(true);
        }

        return data;
      } catch (error) {
        console.error("[Auth] Authenticate error:", error);
        return {
          success: false,
          error: "Errore di connessione. Riprova più tardi.",
        };
      }
    },
    []
  );

  const login = useCallback(
    async (phone: string, password: string): Promise<AuthResponse> => {
      const response = await authLogin(phone, password);

      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      }

      return response;
    },
    []
  );

  const register = useCallback(
    async (phone: string, password: string): Promise<AuthResponse> => {
      const response = await authRegister(phone, password);

      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthenticated(true);
      }

      return response;
    },
    []
  );

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
    setIsAuthenticated(false);
    setVaultEntries([]);
  }, []);

  const refreshAuth = useCallback(async () => {
    if (checkAuth()) {
      const profile = await getProfile();
      if (profile) {
        setUser({
          id: profile.id,
          phone_number: profile.phone_number,
          tokens: profile.tokens,
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
  }, []);

  // ============================================================================
  // VAULT ACTIONS
  // ============================================================================

  const refreshVault = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsVaultLoading(true);
    try {
      const response = await getVault();
      if (response.success) {
        // Convert API entries to VaultEntry format
        const entries: VaultEntry[] = response.entries.map(
          (e: VaultEntryAPI) => ({
            id: generateEntryId(),
            valueData: e.valueData,
            nameLabel: e.nameLabel || undefined,
            nameGroup: e.nameGroup || undefined,
            createdAt: new Date(),
            source: "extracted" as const,
          })
        );
        setVaultEntries(entries);
      }
    } catch (error) {
      console.error("[AuthContext] Refresh vault error:", error);
    } finally {
      setIsVaultLoading(false);
    }
  }, [isAuthenticated]);

  const saveVault = useCallback(
    async (entries: VaultEntry[]): Promise<VaultResponse> => {
      const response = await updateVault(entries);
      if (response.success) {
        setVaultEntries(entries);
      }
      return response;
    },
    []
  );

  const appendToVault = useCallback(
    async (entries: VaultEntry[]): Promise<VaultResponse> => {
      const response = await addToVault(entries);
      if (response.success) {
        setVaultEntries((prev) => [...prev, ...entries]);
      }
      return response;
    },
    []
  );

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value: AuthContextValue = {
    user,
    isAuthenticated,
    isLoading,
    vaultEntries,
    isVaultLoading,
    authenticate,
    login,
    register,
    logout,
    refreshVault,
    saveVault,
    appendToVault,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
