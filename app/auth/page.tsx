// app/auth/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

// ============================================================================
// VALIDATION
// ============================================================================

const authSchema = z.object({
  phone: z
    .string()
    .min(1, "Numero di telefono richiesto")
    .regex(
      /^(\+39)?[0-9\s]{8,12}$/,
      "Inserisci un numero di telefono italiano valido"
    ),
  password: z.string().min(8, "Minimo 8 caratteri"),
});

type AuthFormData = z.infer<typeof authSchema>;

// ============================================================================
// PAGE
// ============================================================================

export default function AuthPage() {
  const router = useRouter();
  const { authenticate, isAuthenticated, isLoading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  // Redirect se già autenticato
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/editor");
    }
  }, [isAuthenticated, authLoading, router]);

  const onSubmit = async (data: AuthFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authenticate(data.phone, data.password);

      if (response.success) {
        // Redirect basato sullo stato del vault
        if (response.isNewUser || !response.hasVaultEntries) {
          // Nuovo utente o vault vuoto → vai al vault
          router.push("/vault");
        } else {
          // Utente esistente con vault → vai all'editor
          router.push("/editor");
        }
      } else {
        setError(response.error || "Errore durante l'autenticazione");
      }
    } catch (err) {
      console.error("[Auth] Error:", err);
      setError(err instanceof Error ? err.message : "Errore imprevisto");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading iniziale
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          <p className="text-sm text-slate-500">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 to-teal-700 p-12 flex-col justify-between">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-white">
              CompilaloEasy
            </span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Compila documenti
            <br />
            in pochi click
          </h1>
          <p className="text-teal-100 text-lg max-w-md">
            Salva i tuoi dati una volta, usali per sempre. Niente più
            copia-incolla, niente più errori.
          </p>

          {/* Features */}
          <div className="space-y-3 pt-4">
            {[
              "Preserva layout e formattazione",
              "I tuoi dati sempre a portata di mano",
              "Download immediato in DOCX",
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 text-teal-100">
                <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                  <ArrowRight className="h-3 w-3 text-white" />
                </div>
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-teal-200 text-sm">
          © 2024 CompilaloEasy. Tutti i diritti riservati.
        </p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-lg bg-teal-600 flex items-center justify-center">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-slate-900">
              CompilaloEasy
            </span>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-900">Bentornato</h2>
            <p className="text-slate-500 mt-2">
              Accedi o crea un account per continuare
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Error */}
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Phone */}
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-slate-700"
              >
                Numero di telefono
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+39 333 123 4567"
                  className={cn(
                    "pl-10 h-11 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500",
                    errors.phone &&
                      "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  disabled={isLoading}
                  {...register("phone")}
                />
              </div>
              {errors.phone && (
                <p className="text-xs text-red-600">{errors.phone.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimo 8 caratteri"
                  className={cn(
                    "pl-10 pr-10 h-11 bg-white border-slate-200 focus:border-teal-500 focus:ring-teal-500",
                    errors.password &&
                      "border-red-300 focus:border-red-500 focus:ring-red-500"
                  )}
                  disabled={isLoading}
                  {...register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-slate-100"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-slate-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-11 bg-teal-600 hover:bg-teal-700 text-white font-medium"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                "Continua"
              )}
            </Button>

            {/* Info */}
            <p className="text-xs text-slate-500 text-center">
              Se non hai un account, ne creeremo uno automaticamente.
              <br />
              Continuando accetti i{" "}
              <a href="/terms" className="text-teal-600 hover:underline">
                Termini di servizio
              </a>
              .
            </p>
          </form>

          {/* Demo Link */}
          <div className="pt-4 border-t border-slate-200">
            <Button
              variant="ghost"
              className="w-full text-slate-600 hover:text-teal-600 hover:bg-teal-50"
              onClick={() => router.push("/editor")}
            >
              Prova senza account
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
