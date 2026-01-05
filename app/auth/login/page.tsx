"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout, LoginForm } from "@/components/auth";

/**
 * Pagina di Login
 *
 * Permette agli utenti di accedere con numero di telefono e password
 */
export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (data: { phone: string; password: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      // TODO: Implementare la chiamata API per il login
      // Per ora simuliamo un login con delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simula errore per test
      // throw new Error("Credenziali non valide");

      // Login riuscito - redirect alla home
      console.log("Login data:", data);
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Errore durante l'accesso"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Bentornato"
      subtitle="Accedi al tuo account per continuare"
    >
      <LoginForm onSubmit={handleLogin} isLoading={isLoading} error={error} />
    </AuthLayout>
  );
}
