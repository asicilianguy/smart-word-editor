"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout, LoginForm } from "@/components/auth";
import { useAuth } from "@/lib/auth-context";

/**
 * Pagina di Login
 *
 * Permette agli utenti di accedere con numero di telefono e password.
 * Usa il context di autenticazione per gestire lo stato.
 */
export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect se già autenticato
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

  const handleLogin = async (data: { phone: string; password: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await login(data.phone, data.password);

      if (response.success) {
        // Login riuscito - redirect alla home
        router.push("/");
      } else {
        // Errore dal backend
        setError(response.error || "Credenziali non valide");
      }
    } catch (err) {
      console.error("[Login] Error:", err);
      setError(err instanceof Error ? err.message : "Errore durante l'accesso");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <AuthLayout
      title="Bentornato"
      subtitle="Accedi al tuo account per continuare"
    >
      <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />
    </AuthLayout>
  );
}
