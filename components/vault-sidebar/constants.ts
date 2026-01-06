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
// ICONS MAPPING
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
// GROUP OPTIONS FOR ADD DIALOG
// ============================================================================

export const GROUP_OPTIONS = [
  { value: "Dati Identificativi", label: "Dati Identificativi" },
  { value: "Persone", label: "Persone" },
  { value: "Contatti", label: "Contatti" },
  { value: "Indirizzi", label: "Indirizzi" },
  { value: "Coordinate Bancarie", label: "Coordinate Bancarie" },
  { value: "Dati Professionali", label: "Dati Professionali" },
  { value: "Certificazioni", label: "Certificazioni" },
  { value: "Altri dati", label: "Altri dati" },
];

// ============================================================================
// DEMO DATA - Mostrati quando il vault è vuoto per guidare l'utente
// ============================================================================

export const DEMO_CATEGORIES: VaultCategory[] = [
  {
    id: "dati-identificativi",
    name: "Dati Identificativi",
    icon: "building",
    values: [
      {
        id: "demo-1",
        label: "Partita IVA",
        value: "IT01234567890",
      },
      {
        id: "demo-2",
        label: "Codice Fiscale",
        value: "RSSMRA80A01H501Z",
      },
    ],
  },
  {
    id: "persone",
    name: "Persone",
    icon: "users",
    values: [
      {
        id: "demo-3",
        label: "Legale Rappresentante",
        value: "Mario Rossi",
      },
    ],
  },
  {
    id: "contatti",
    name: "Contatti",
    icon: "mail",
    values: [
      {
        id: "demo-4",
        label: "Email aziendale",
        value: "info@azienda.it",
      },
    ],
  },
  {
    id: "indirizzi",
    name: "Indirizzi",
    icon: "map-pin",
    values: [
      {
        id: "demo-5",
        label: "Sede legale",
        value: "Via Roma 123, 20100 Milano (MI)",
      },
    ],
  },
];

// ============================================================================
// ONBOARDING TIPS
// ============================================================================

export const ONBOARDING_TIPS = [
  "Seleziona del testo nel documento per sostituirlo con un valore",
  "Clicca su un valore per inserirlo alla posizione del cursore",
  "Aggiungi i tuoi dati reali per compilare documenti in secondi",
  "I dati vengono salvati in modo sicuro nel tuo account",
];
