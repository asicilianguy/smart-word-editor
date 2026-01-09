/**
 * i18n Module
 *
 * Approccio: Lingua gestita via cookie, NON via URL
 * - /editor (non /en/editor)
 * - Cambio lingua salva cookie + refresh
 */

export {
  locales,
  defaultLocale,
  localeNames,
  localeFlags,
  isValidLocale,
  getLocaleFromPathname,
  type Locale,
} from "./config";

export { routing } from "./routing";

// Cookie name per uso esterno
export const LOCALE_COOKIE = "NEXT_LOCALE";
