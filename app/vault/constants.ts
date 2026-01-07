import {
  FileText,
  Building2,
  Users,
  MapPin,
  Landmark,
  Briefcase,
  Award,
  Mail,
} from "lucide-react";

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEFAULT_GROUPS = [
  "Dati Identificativi",
  "Persone",
  "Contatti",
  "Indirizzi",
  "Coordinate Bancarie",
  "Dati Professionali",
  "Certificazioni",
  "Altri dati",
] as const;

export const GROUP_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "Dati Identificativi": Building2,
  Persone: Users,
  Contatti: Mail,
  Indirizzi: MapPin,
  "Coordinate Bancarie": Landmark,
  "Dati Professionali": Briefcase,
  Certificazioni: Award,
  "Altri dati": FileText,
};

export const getGroupIcon = (group: string) => {
  return GROUP_ICONS[group] || FileText;
};

/**
 * Opzioni per il Select delle categorie nel dialog di aggiunta
 */
export const GROUP_OPTIONS: { value: string; label: string }[] = [
  { value: "Dati Identificativi", label: "Dati Identificativi" },
  { value: "Persone", label: "Persone" },
  { value: "Contatti", label: "Contatti" },
  { value: "Indirizzi", label: "Indirizzi" },
  { value: "Coordinate Bancarie", label: "Coordinate Bancarie" },
  { value: "Dati Professionali", label: "Dati Professionali" },
  { value: "Certificazioni", label: "Certificazioni" },
  { value: "Altri dati", label: "Altri dati" },
];
