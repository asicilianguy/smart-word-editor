/**
 * i18n Configuration
 *
 * Lingue supportate:
 * - it (Italiano) - DEFAULT
 * - en (English)
 * - es (Español)
 *
 * Filosofia: linguaggio chiaro, semplice, non tecnico.
 * "Vault" → "I miei dati"
 * "Token" → "Crediti"
 */

export const locales = ["it", "en", "es"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "it";

export const localeNames: Record<Locale, string> = {
  it: "Italiano",
  en: "English",
  es: "Español",
};

export const localeFlags: Record<Locale, string> = {
  it: "🇮🇹",
  en: "🇬🇧",
  es: "🇪🇸",
};

/**
 * Verifica se una stringa è una locale valida
 */
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

/**
 * Ottiene la locale dal pathname
 */
export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && isValidLocale(firstSegment)) {
    return firstSegment;
  }

  return defaultLocale;
}
