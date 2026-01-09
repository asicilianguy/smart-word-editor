import type { VaultCategory } from "./document-types";

// ============================================================================
// CONFIGURATION - Struttura dati con chiavi di traduzione
// ============================================================================

interface VaultValueConfig {
  id: string;
  labelKey: string;
  value: string;
}

interface VaultCategoryConfig {
  id: string;
  nameKey: string;
  icon: string;
  values: VaultValueConfig[];
}

const VAULT_DATA_CONFIG: VaultCategoryConfig[] = [
  {
    id: "company",
    nameKey: "company",
    icon: "building",
    values: [
      { id: "company-name", labelKey: "companyName", value: "Rossi S.r.l." },
      { id: "company-vat", labelKey: "vatNumber", value: "IT01234567890" },
      { id: "company-cf", labelKey: "taxCode", value: "RSSMRA80A01H501Z" },
      { id: "company-rea", labelKey: "rea", value: "MI-123456" },
      {
        id: "company-capital",
        labelKey: "shareCapital",
        value: "€ 100.000,00 i.v.",
      },
      { id: "company-ateco", labelKey: "atecoCode", value: "62.01.00" },
    ],
  },
  {
    id: "contacts",
    nameKey: "contacts",
    icon: "mail",
    values: [
      { id: "contact-email", labelKey: "email", value: "info@rossi.it" },
      { id: "contact-pec", labelKey: "pec", value: "rossi@pec.it" },
      { id: "contact-phone", labelKey: "phone", value: "+39 02 1234567" },
      { id: "contact-fax", labelKey: "fax", value: "+39 02 7654321" },
      { id: "contact-mobile", labelKey: "mobile", value: "+39 333 1234567" },
      { id: "contact-website", labelKey: "website", value: "www.rossi.it" },
    ],
  },
  {
    id: "addresses",
    nameKey: "addresses",
    icon: "map-pin",
    values: [
      {
        id: "address-legal",
        labelKey: "legalAddress",
        value: "Via Roma 123, 20100 Milano (MI)",
      },
      {
        id: "address-operative",
        labelKey: "operativeAddress",
        value: "Via Napoli 456, 00100 Roma (RM)",
      },
      {
        id: "address-warehouse",
        labelKey: "warehouse",
        value: "Via Torino 789, 10100 Torino (TO)",
      },
    ],
  },
  {
    id: "legal",
    nameKey: "legal",
    icon: "file-text",
    values: [
      {
        id: "legal-rep",
        labelKey: "legalRepresentative",
        value: "Mario Rossi",
      },
      {
        id: "legal-rep-cf",
        labelKey: "legalRepTaxCode",
        value: "RSSMRA80A01H501Z",
      },
      {
        id: "legal-rep-birth",
        labelKey: "legalRepBirthDate",
        value: "01/01/1980",
      },
      {
        id: "legal-rep-birthplace",
        labelKey: "legalRepBirthPlace",
        value: "Milano (MI)",
      },
      {
        id: "legal-rep-residence",
        labelKey: "legalRepResidence",
        value: "Via Dante 10, 20100 Milano (MI)",
      },
      {
        id: "legal-entity",
        labelKey: "legalForm",
        value: "Società a Responsabilità Limitata",
      },
      {
        id: "legal-incorporation",
        labelKey: "incorporationDate",
        value: "15/01/2020",
      },
      { id: "legal-register", labelKey: "businessRegister", value: "Milano" },
    ],
  },
  {
    id: "certifications",
    nameKey: "certifications",
    icon: "award",
    values: [
      {
        id: "cert-iso9001",
        labelKey: "iso9001",
        value: "Certificato n. 12345 - valido fino al 31/12/2025",
      },
      {
        id: "cert-iso14001",
        labelKey: "iso14001",
        value: "Certificato n. 67890 - valido fino al 31/12/2025",
      },
      {
        id: "cert-soa",
        labelKey: "soa",
        value: "OG1 Classifica III - Attestazione n. 11111",
      },
    ],
  },
  {
    id: "banking",
    nameKey: "banking",
    icon: "landmark",
    values: [
      { id: "bank-name", labelKey: "bankName", value: "Banca Intesa Sanpaolo" },
      {
        id: "bank-iban",
        labelKey: "iban",
        value: "IT60X0542811101000000123456",
      },
      { id: "bank-swift", labelKey: "swift", value: "BCITITMM" },
    ],
  },
];

// ============================================================================
// TRANSLATION FUNCTIONS
// ============================================================================

/**
 * Costruisce i dati vault tradotti
 */
export function buildVaultData(
  translateCategory: (key: string) => string,
  translateLabel: (key: string) => string
): VaultCategory[] {
  return VAULT_DATA_CONFIG.map((category) => ({
    id: category.id,
    name: translateCategory(category.nameKey),
    icon: category.icon,
    values: category.values.map((value) => ({
      id: value.id,
      label: translateLabel(value.labelKey),
      value: value.value,
    })),
  }));
}

/**
 * Cerca valori nel vault tradotto
 */
export function searchVaultValues(
  vaultData: VaultCategory[],
  query: string
): VaultCategory[] {
  if (!query.trim()) return vaultData;

  const lowerQuery = query.toLowerCase();

  return vaultData
    .map((category) => ({
      ...category,
      values: category.values.filter(
        (value) =>
          value.label.toLowerCase().includes(lowerQuery) ||
          value.value.toLowerCase().includes(lowerQuery)
      ),
    }))
    .filter((category) => category.values.length > 0);
}

/**
 * Trova un valore nel vault per ID
 */
export function findVaultValueById(
  vaultData: VaultCategory[],
  id: string
): { category: VaultCategory; value: VaultCategory["values"][0] } | null {
  for (const category of vaultData) {
    const value = category.values.find((v) => v.id === id);
    if (value) {
      return { category, value };
    }
  }
  return null;
}

// ============================================================================
// LEGACY EXPORT (per retrocompatibilità durante la migrazione)
// Questi dati NON sono tradotti - usare useVaultMockData hook invece
// ============================================================================

/** @deprecated Use useVaultMockData hook instead */
export const vaultData: VaultCategory[] = buildVaultData(
  (key) => key, // Non tradotto
  (key) => key // Non tradotto
);
