"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
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
import { LocaleSwitcher } from "@/components/locale-switcher";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

// ============================================================================
// PAGE
// ============================================================================

export default function AuthPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const { authenticate, isAuthenticated, isLoading: authLoading } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Schema con messaggi tradotti (deve essere in useMemo per reagire ai cambi lingua)
  const authSchema = useMemo(
    () =>
      z.object({
        phone: z
          .string()
          .min(1, t("errors.phoneRequired"))
          .regex(/^(\+\d{1,3})?[0-9\s]{8,14}$/, t("errors.phoneInvalid")),
        password: z.string().min(8, t("errors.passwordMin")),
      }),
    [t]
  );

  type AuthFormData = z.infer<typeof authSchema>;

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
        if (response.isNewUser || !response.hasVaultEntries) {
          router.push("/vault");
        } else {
          router.push("/editor");
        }
      } else {
        setError(response.error || t("errors.authFailed"));
      }
    } catch (err) {
      console.error("[Auth] Error:", err);
      setError(err instanceof Error ? err.message : t("errors.unexpected"));
    } finally {
      setIsLoading(false);
    }
  };

  // Features list
  const features = [
    t("features.preserveLayout"),
    t("features.dataAtHand"),
    t("features.instantDownload"),
  ];

  // Loading iniziale
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
          <p className="text-sm text-slate-500">{t("loading")}</p>
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
            {t("hero.title")}
            <br />
            {t("hero.titleLine2")}
          </h1>
          <p className="text-teal-100 text-lg max-w-md">{t("hero.subtitle")}</p>

          {/* Features */}
          <div className="space-y-3 pt-4">
            {features.map((feature, i) => (
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
        <p className="text-teal-200 text-sm">{t("footer")}</p>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col">
        {/* Language Switcher - Top Right */}
        <div className="flex justify-end p-4">
          <LocaleSwitcher variant="compact" />
        </div>

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
              <h2 className="text-2xl font-bold text-slate-900">
                {t("welcomeBack")}
              </h2>
              <p className="text-slate-500 mt-2">{t("subtitle")}</p>
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
                  {t("phone")}
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t("phonePlaceholder")}
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
                  {t("password")}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("passwordPlaceholder")}
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
                    {t("loggingIn")}
                  </>
                ) : (
                  t("continue")
                )}
              </Button>

              {/* Info */}
              <p className="text-xs text-slate-500 text-center">
                {t("autoCreateAccount")}
                <br />
                {t("termsPrefix")}{" "}
                <a href="/terms" className="text-teal-600 hover:underline">
                  {t("termsLink")}
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
                {t("tryWithoutAccount")}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
