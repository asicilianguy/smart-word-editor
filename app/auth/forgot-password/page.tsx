"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, ArrowLeft, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "@/components/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// ============================================================================
// VALIDATION
// ============================================================================

const forgotPasswordSchema = z.object({
  phone: z
    .string()
    .min(1, "Numero di telefono richiesto")
    .regex(
      /^(\+39)?[0-9\s]{8,12}$/,
      "Inserisci un numero di telefono italiano valido"
    ),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

// ============================================================================
// COMPONENT
// ============================================================================

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);

    try {
      // TODO: Implementare invio SMS per reset password
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setSubmittedPhone(data.phone);
      setIsSubmitted(true);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthLayout
        title="Controlla il telefono"
        subtitle="Ti abbiamo inviato un SMS con le istruzioni"
      >
        <div className="space-y-6">
          <div className="flex flex-col items-center text-center py-6">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-muted-foreground">
              Abbiamo inviato un SMS al numero{" "}
              <span className="font-medium text-foreground">{submittedPhone}</span>{" "}
              con le istruzioni per reimpostare la password.
            </p>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/auth/login">
                Torna al login
              </Link>
            </Button>
            
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setIsSubmitted(false);
                setSubmittedPhone("");
              }}
            >
              Usa un altro numero
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Non hai ricevuto l'SMS? Controlla di aver inserito il numero corretto
            e riprova tra qualche minuto.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recupera password"
      subtitle="Inserisci il tuo numero di telefono per reimpostare la password"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Phone Field */}
        <div className="space-y-2">
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
                "pl-10 h-12 text-base",
                errors.phone &&
                  "border-destructive focus-visible:ring-destructive"
              )}
              disabled={isLoading}
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Ti invieremo un SMS con le istruzioni per reimpostare la password
          </p>
        </div>

        {/* Submit Button */}
        <Button type="submit" size="lg" className="w-full h-12" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Invio in corso...
            </>
          ) : (
            <>
              Invia istruzioni
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>

        {/* Back Link */}
        <Button variant="ghost" asChild className="w-full">
          <Link href="/auth/login">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna al login
          </Link>
        </Button>
      </form>
    </AuthLayout>
  );
}
