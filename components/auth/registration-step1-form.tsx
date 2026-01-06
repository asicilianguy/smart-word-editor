"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Phone, Lock, Eye, EyeOff, Check, X, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { RegistrationStep1 } from "@/lib/auth-types";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

/**
 * Schema interno per il form (include confirmPassword)
 * Il tipo RegistrationStep1 da auth-types non include confirmPassword,
 * quindi usiamo un tipo locale esteso solo per la validazione del form
 */
const registrationFormSchema = z
  .object({
    phone: z
      .string()
      .min(1, "Numero di telefono richiesto")
      .regex(
        /^(\+39)?[0-9\s]{8,12}$/,
        "Inserisci un numero di telefono italiano valido"
      ),
    password: z
      .string()
      .min(8, "Minimo 8 caratteri")
      .regex(/[A-Z]/, "Almeno una lettera maiuscola")
      .regex(/[a-z]/, "Almeno una lettera minuscola")
      .regex(/[0-9]/, "Almeno un numero"),
    confirmPassword: z.string().min(1, "Conferma la password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Le password non coincidono",
    path: ["confirmPassword"],
  });

/** Tipo interno per il form (estende RegistrationStep1 con confirmPassword) */
type RegistrationFormData = z.infer<typeof registrationFormSchema>;

// ============================================================================
// PASSWORD REQUIREMENTS
// ============================================================================

interface PasswordRequirement {
  label: string;
  regex: RegExp;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: "Minimo 8 caratteri", regex: /.{8,}/ },
  { label: "Una maiuscola", regex: /[A-Z]/ },
  { label: "Una minuscola", regex: /[a-z]/ },
  { label: "Un numero", regex: /[0-9]/ },
];

// ============================================================================
// COMPONENT
// ============================================================================

interface RegistrationStep1FormProps {
  onSubmit: (data: RegistrationStep1) => void;
  initialData?: Partial<RegistrationStep1>;
}

export function RegistrationStep1Form({
  onSubmit,
  initialData,
}: RegistrationStep1FormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationFormSchema),
    mode: "onChange",
    defaultValues: {
      phone: initialData?.phone || "",
      password: initialData?.password || "",
      confirmPassword: "",
    },
  });

  const password = watch("password", "");

  const handleFormSubmit = (data: RegistrationFormData) => {
    // Passa solo phone e password (senza confirmPassword) al parent
    onSubmit({
      phone: data.phone,
      password: data.password,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
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
            {...register("phone")}
          />
        </div>
        {errors.phone && (
          <p className="text-xs text-destructive">{errors.phone.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Questo numero sarà usato per accedere
        </p>
      </div>

      {/* Password Field */}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-sm font-medium">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Crea una password"
            className={cn(
              "pl-10 pr-10 h-10",
              errors.password &&
                "border-destructive focus-visible:ring-destructive"
            )}
            {...register("password")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>

        {/* Password Requirements */}
        <div className="grid grid-cols-2 gap-1.5 mt-2">
          {passwordRequirements.map((req) => {
            const isValidReq = req.regex.test(password);
            return (
              <div
                key={req.label}
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  isValidReq ? "text-green-600" : "text-muted-foreground"
                )}
              >
                {isValidReq ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <X className="h-3 w-3" />
                )}
                {req.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-sm font-medium">
          Conferma password
        </Label>
        <div className="relative">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Ripeti la password"
            className={cn(
              "pl-10 pr-10 h-10",
              errors.confirmPassword &&
                "border-destructive focus-visible:ring-destructive"
            )}
            {...register("confirmPassword")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full h-10" disabled={!isValid}>
        Continua
      </Button>
    </form>
  );
}
