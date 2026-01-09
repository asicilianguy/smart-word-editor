import type React from "react";
import {
  Building2,
  Users,
  MapPin,
  Scale,
  Award,
  Landmark,
  Briefcase,
  FileText,
} from "lucide-react";
import type { VaultCategory } from "@/lib/document-types";

// ============================================================================
// ICONS MAPPING (non richiede traduzione)
// ============================================================================

export const categoryIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  company: Building2,
  "dati-identificativi": Building2,
  contacts: Users,
  contatti: Users,
  persone: Users,
  addresses: MapPin,
  indirizzi: MapPin,
  legal: Scale,
  "dati-legali": Scale,
  certifications: Award,
  certificazioni: Award,
  banking: Landmark,
  "coordinate-bancarie": Landmark,
  "dati-professionali": Briefcase,
  "altri-dati": FileText,
};

// ============================================================================
// GROUP OPTIONS KEYS (i value restano fissi, le label sono chiavi di traduzione)
// ============================================================================

export const GROUP_OPTION_KEYS = [
  "identification",
  "people",
  "contacts",
  "addresses",
  "banking",
  "professional",
  "certifications",
  "other",
] as const;

export type GroupOptionKey = (typeof GROUP_OPTION_KEYS)[number];

// Mapping da chiave traduzione a valore effettivo per il database
export const GROUP_KEY_TO_VALUE: Record<GroupOptionKey, string> = {
  identification: "Dati Identificativi",
  people: "Persone",
  contacts: "Contatti",
  addresses: "Indirizzi",
  banking: "Coordinate Bancarie",
  professional: "Dati Professionali",
  certifications: "Certificazioni",
  other: "Altri dati",
};

// ============================================================================
// DEMO CATEGORIES KEYS (struttura per traduzione)
// ============================================================================

export const DEMO_CATEGORY_KEYS = [
  {
    id: "dati-identificativi",
    nameKey: "identification",
    icon: "building",
    values: [
      { id: "demo-1", labelKey: "vatNumber", value: "IT01234567890" },
      { id: "demo-2", labelKey: "taxCode", value: "RSSMRA80A01H501Z" },
    ],
  },
  {
    id: "persone",
    nameKey: "people",
    icon: "users",
    values: [
      { id: "demo-3", labelKey: "legalRepresentative", value: "Mario Rossi" },
    ],
  },
  {
    id: "contatti",
    nameKey: "contacts",
    icon: "mail",
    values: [
      { id: "demo-4", labelKey: "businessEmail", value: "info@azienda.it" },
    ],
  },
  {
    id: "indirizzi",
    nameKey: "addresses",
    icon: "map-pin",
    values: [
      {
        id: "demo-5",
        labelKey: "registeredOffice",
        value: "Via Roma 123, 20100 Milano (MI)",
      },
    ],
  },
] as const;

// ============================================================================
// ONBOARDING TIP KEYS
// ============================================================================

export const ONBOARDING_TIP_KEYS = ["tip1", "tip2", "tip3", "tip4"] as const;