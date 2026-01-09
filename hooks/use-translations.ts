import { useTranslations as useNextIntlTranslations } from "next-intl";

/**
 * Hook per usare le traduzioni con supporto TypeScript
 *
 * @example
 * ```tsx
 * // In un componente
 * const t = useTranslations("myData");
 * return <h1>{t("title")}</h1>;
 *
 * // Con interpolazione
 * const t = useTranslations("import");
 * return <p>{t("credits.info", { cost: 1, available: 10 })}</p>;
 *
 * // Con plurali
 * const t = useTranslations("editor");
 * return <span>{t("status.modified", { count: 5 })}</span>;
 * ```
 */
export const useTranslations = useNextIntlTranslations;

/**
 * Namespaces disponibili nelle traduzioni
 */
export type TranslationNamespace =
  | "common"
  | "auth"
  | "landing"
  | "editor"
  | "myData"
  | "import"
  | "sidebar"
  | "download"
  | "compare"
  | "errors"
  | "footer";
