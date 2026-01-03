import type { VaultCategory } from "./document-types";

/**
 * Dati mock del vault per il PoC
 *
 * Struttura basata sul README tecnico:
 * - Dati Azienda
 * - Contatti
 * - Indirizzi
 * - Dati Legali
 */
export const vaultData: VaultCategory[] = [
  {
    id: "company",
    name: "Dati Azienda",
    icon: "building",
    values: [
      { id: "company-name", label: "Ragione Sociale", value: "Rossi S.r.l." },
      { id: "company-vat", label: "Partita IVA", value: "IT01234567890" },
      { id: "company-cf", label: "Codice Fiscale", value: "RSSMRA80A01H501Z" },
      { id: "company-rea", label: "REA", value: "MI-123456" },
      {
        id: "company-capital",
        label: "Capitale Sociale",
        value: "€ 100.000,00 i.v.",
      },
      { id: "company-ateco", label: "Codice ATECO", value: "62.01.00" },
    ],
  },
  {
    id: "contacts",
    name: "Contatti",
    icon: "mail",
    values: [
      { id: "contact-email", label: "Email", value: "info@rossi.it" },
      { id: "contact-pec", label: "PEC", value: "rossi@pec.it" },
      { id: "contact-phone", label: "Telefono", value: "+39 02 1234567" },
      { id: "contact-fax", label: "Fax", value: "+39 02 7654321" },
      { id: "contact-mobile", label: "Cellulare", value: "+39 333 1234567" },
      { id: "contact-website", label: "Sito Web", value: "www.rossi.it" },
    ],
  },
  {
    id: "addresses",
    name: "Indirizzi",
    icon: "map-pin",
    values: [
      {
        id: "address-legal",
        label: "Sede Legale",
        value: "Via Roma 123, 20100 Milano (MI)",
      },
      {
        id: "address-operative",
        label: "Sede Operativa",
        value: "Via Napoli 456, 00100 Roma (RM)",
      },
      {
        id: "address-warehouse",
        label: "Magazzino",
        value: "Via Torino 789, 10100 Torino (TO)",
      },
    ],
  },
  {
    id: "legal",
    name: "Dati Legali",
    icon: "file-text",
    values: [
      { id: "legal-rep", label: "Legale Rappresentante", value: "Mario Rossi" },
      {
        id: "legal-rep-cf",
        label: "CF Legale Rappresentante",
        value: "RSSMRA80A01H501Z",
      },
      { id: "legal-rep-birth", label: "Data Nascita LR", value: "01/01/1980" },
      {
        id: "legal-rep-birthplace",
        label: "Luogo Nascita LR",
        value: "Milano (MI)",
      },
      {
        id: "legal-rep-residence",
        label: "Residenza LR",
        value: "Via Dante 10, 20100 Milano (MI)",
      },
      {
        id: "legal-entity",
        label: "Forma Giuridica",
        value: "Società a Responsabilità Limitata",
      },
      {
        id: "legal-incorporation",
        label: "Data Costituzione",
        value: "15/01/2020",
      },
      { id: "legal-register", label: "Registro Imprese", value: "Milano" },
    ],
  },
  {
    id: "certifications",
    name: "Certificazioni",
    icon: "award",
    values: [
      {
        id: "cert-iso9001",
        label: "ISO 9001",
        value: "Certificato n. 12345 - valido fino al 31/12/2025",
      },
      {
        id: "cert-iso14001",
        label: "ISO 14001",
        value: "Certificato n. 67890 - valido fino al 31/12/2025",
      },
      {
        id: "cert-soa",
        label: "SOA",
        value: "OG1 Classifica III - Attestazione n. 11111",
      },
    ],
  },
  {
    id: "banking",
    name: "Dati Bancari",
    icon: "landmark",
    values: [
      { id: "bank-name", label: "Banca", value: "Banca Intesa Sanpaolo" },
      { id: "bank-iban", label: "IBAN", value: "IT60X0542811101000000123456" },
      { id: "bank-swift", label: "SWIFT/BIC", value: "BCITITMM" },
    ],
  },
];

/**
 * Cerca valori nel vault
 */
export function searchVaultValues(query: string): VaultCategory[] {
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
