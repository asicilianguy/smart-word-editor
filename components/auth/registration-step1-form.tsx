"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Check,
  X,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { RegistrationStep1 } from "@/lib/auth-types";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const registrationStep1Schema = z
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

// ============================================================================
// PASSWORD REQUIREMENTS
// ============================================================================

interface PasswordRequirement {
  label: string;
  regex: RegExp;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: "Minimo 8 caratteri", regex: /.{8,}/ },
  { label: "Una lettera maiuscola", regex: /[A-Z]/ },
  { label: "Una lettera minuscola", regex: /[a-z]/ },
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
  } = useForm<RegistrationStep1>({
    resolver: zodResolver(registrationStep1Schema),
    mode: "onChange",
    defaultValues: {
      phone: initialData?.phone || "",
      password: initialData?.password || "",
      confirmPassword: initialData?.confirmPassword || "",
    },
  });

  const password = watch("password", "");

  const handleFormSubmit = (data: RegistrationStep1) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
            {...register("phone")}
          />
        </div>
        {errors.phone && (
          <p className="text-sm text-destructive">{errors.phone.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Useremo questo numero per accedere al tuo account
        </p>
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-sm font-medium">
          Password
        </Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Crea una password sicura"
            className={cn(
              "pl-10 pr-10 h-12 text-base",
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
        <div className="grid grid-cols-2 gap-2 mt-3">
          {passwordRequirements.map((req) => {
            const isValid = req.regex.test(password);
            return (
              <div
                key={req.label}
                className={cn(
                  "flex items-center gap-1.5 text-xs transition-colors",
                  isValid ? "text-green-600" : "text-muted-foreground"
                )}
              >
                {isValid ? (
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
      <div className="space-y-2">
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
              "pl-10 pr-10 h-12 text-base",
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
          <p className="text-sm text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        className="w-full h-12"
        disabled={!isValid}
      >
        Continua
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </form>
  );
}
