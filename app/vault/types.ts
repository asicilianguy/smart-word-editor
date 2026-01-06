// ============================================================================
// VAULT MANAGER TYPES
// ============================================================================

export interface VaultEntry {
  id: string;
  value: string;
  label: string;
  group: string;
}

export interface DragData {
  type: "entry";
  entry: VaultEntry;
}

export interface DropData {
  type: "group";
  group: string;
}
