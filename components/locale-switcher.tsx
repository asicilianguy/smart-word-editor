"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Nome del cookie (deve matchare quello in request.ts)
const LOCALE_COOKIE = "NEXT_LOCALE";

interface LocaleSwitcherProps {
  variant?: "default" | "compact" | "minimal";
  className?: string;
}

export function LocaleSwitcher({
  variant = "default",
  className,
}: LocaleSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();

  const handleChange = (newLocale: Locale) => {
    // Salva la preferenza nel cookie (1 anno)
    document.cookie = `${LOCALE_COOKIE}=${newLocale};path=/;max-age=${
      60 * 60 * 24 * 365
    }`;

    // Ricarica la pagina per applicare la nuova lingua
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "minimal" ? "icon" : "sm"}
          className={cn(
            "gap-2 text-muted-foreground hover:text-foreground",
            variant === "minimal" && "h-8 w-8",
            className
          )}
          aria-label="Cambia lingua"
        >
          {variant === "minimal" ? (
            <Globe className="h-4 w-4" />
          ) : variant === "compact" ? (
            <>
              <span className="text-base">{localeFlags[locale]}</span>
              <span className="text-xs font-medium uppercase">{locale}</span>
            </>
          ) : (
            <>
              <Globe className="h-4 w-4" />
              <span className="text-sm">{localeNames[locale]}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-[140px]">
        {locales.map((loc: Locale) => {
          const isActive = loc === locale;

          return (
            <DropdownMenuItem
              key={loc}
              onClick={() => handleChange(loc)}
              className={cn(
                "flex items-center gap-3 cursor-pointer",
                isActive && "bg-[var(--brand-primary)]/5"
              )}
            >
              <span className="text-base">{localeFlags[loc]}</span>
              <span
                className={cn(
                  "flex-1 text-sm",
                  isActive && "font-medium text-(--brand-primary)"
                )}
              >
                {localeNames[loc]}
              </span>
              {isActive && (
                <Check className="h-4 w-4 text-(--brand-primary)" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
