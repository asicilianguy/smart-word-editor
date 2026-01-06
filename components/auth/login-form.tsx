"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const loginSchema = z.object({
  phone: z
    .string()
    .min(1, "Numero di telefono richiesto")
    .regex(
      /^(\+39)?[0-9\s]{8,12}$/,
      "Inserisci un numero di telefono italiano valido"
    ),
  password: z.string().min(1, "Password richiesta"),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ============================================================================
// COMPONENT
// ============================================================================

interface LoginFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function LoginForm({
  onSubmit,
  isLoading = false,
  error,
}: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const loading = isLoading || isSubmitting;

  const handleFormSubmit = async (data: LoginFormData) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Phone Field */}
      <div className="space-y-1.5">
        <Label htmlFor="phone" className="text-sm font-medium">
          Numero di telefono
        </Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            placeholder="+39 333 123 4567"
            className={cn(
              "pl-10 h-10",
              errors.phone &&
                "border-destructive focus-visible:ring-destructive"
            )}
            disabled={loading}
            {...register("phone")}
          />
        </div>
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-medium">
            Password
          </Label>
          <Link
            href="/auth/forgot-password"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Password dimenticata?
          </Link>
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className={cn(
              "pl-10 pr-10 h-10",
              errors.password &&
                "border-destructive focus-visible:ring-destructive"
            )}
            disabled={loading}
            {...register("password")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {errors.password && (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full h-10" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Accesso in corso...
          </>
        ) : (
          "Accedi"
        )}
      </Button>

      {/* Register Link */}
      <p className="text-sm text-muted-foreground text-center">
        Non hai un account?{" "}
        <Link
          href="/auth/register"
          className="text-primary font-medium hover:underline"
        >
          Registrati
        </Link>
      </p>

      {/* Divider */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">oppure</span>
        </div>
      </div>

      {/* Demo Access */}
      <Button
        type="button"
        variant="secondary"
        className="w-full h-10"
        onClick={() => {
          window.location.href = "/";
        }}
        disabled={loading}
      >
        Prova senza account
      </Button>
    </form>
  );
}
