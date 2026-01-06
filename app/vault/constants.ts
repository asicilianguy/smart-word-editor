import {
  FileText,
  Building2,
  Users,
  MapPin,
  Landmark,
  Briefcase,
  Award,
  Mail,
  Phone,
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
];

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
