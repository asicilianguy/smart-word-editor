import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "./config";

// Manteniamo per compatibilità, ma non usiamo il routing basato su URL
export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "never", // MAI aggiungere prefisso URL
});
