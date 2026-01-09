/**
 * i18n Module
 *
 * Esporta tutte le funzionalità per l'internazionalizzazione
 */

// Configurazione
export {
  locales,
  defaultLocale,
  localeNames,
  localeFlags,
  isValidLocale,
  getLocaleFromPathname,
  type Locale,
} from "./config";

// Routing
export { routing } from "./routing";
