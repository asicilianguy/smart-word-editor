import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale, type Locale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  // Ottieni la locale dalla richiesta
  let locale = await requestLocale;

  // Valida la locale, fallback a default se non valida
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
