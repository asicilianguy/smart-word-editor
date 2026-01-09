import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { locales, defaultLocale, type Locale } from "./config";

// Nome del cookie per salvare la preferenza lingua
export const LOCALE_COOKIE = "NEXT_LOCALE";

export default getRequestConfig(async () => {
  // Leggi lingua dal cookie
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value;

  // Valida la locale, fallback a default se non valida
  let locale: Locale = defaultLocale;
  if (localeCookie && locales.includes(localeCookie as Locale)) {
    locale = localeCookie as Locale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
