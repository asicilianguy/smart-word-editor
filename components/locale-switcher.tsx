"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
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
  const pathname = usePathname();

  const handleChange = (newLocale: Locale) => {
    // Rimuovi il prefisso lingua corrente dal pathname se presente
    let newPathname = pathname;

    // Se il pathname inizia con una locale, rimuovila
    for (const loc of locales) {
      if (pathname.startsWith(`/${loc}/`)) {
        newPathname = pathname.replace(`/${loc}`, "");
        break;
      } else if (pathname === `/${loc}`) {
        newPathname = "/";
        break;
      }
    }

    // Costruisci il nuovo URL con la nuova lingua
    // Se è la lingua default (it), non aggiungere prefisso
    const newUrl =
      newLocale === "it" ? newPathname : `/${newLocale}${newPathname}`;

    router.push(newUrl);
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
                  isActive && "font-medium text-[var(--brand-primary)]"
                )}
              >
                {localeNames[loc]}
              </span>
              {isActive && (
                <Check className="h-4 w-4 text-[var(--brand-primary)]" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
