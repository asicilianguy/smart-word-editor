export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  status:
    | "pending"
    | "validating"
    | "validated"
    | "extracting"
    | "done"
    | "error";
  pageCount?: number;
  error?: string;
}

export interface ExtractedEntry {
  id: string;
  valueData: string;
  nameLabel: string;
  nameGroup: string;
  confidence?: number;
  selected: boolean;
  isEditing: boolean;
}

export interface ValidationResult {
  files: Array<{
    filename: string;
    pages: number;
    error?: string;
  }>;
  total_pages: number;
  is_valid: boolean;
  max_files: number;
  max_pages: number;
  error?: string;
}

export interface ExtractionResult {
  success: boolean;
  entries: Array<{
    valueData: string;
    nameLabel?: string | null;
    nameGroup?: string | null;
    confidence?: number | null;
  }>;
  model_used: string;
  tokens_used: number;
  documents_processed: number;
  tokens_consumed: number;
  tokens_remaining: number;
  error?: string | null;
  error_code?: string | null;
}

export type WorkflowStep =
  | "idle" // Nessun file
  | "files_added" // File aggiunti, da validare
  | "validating" // Validazione in corso
  | "validated" // Validazione OK, pronto per estrarre
  | "extracting" // Estrazione in corso
  | "review" // Review dei dati estratti
  | "saving" // Salvataggio in corso
  | "completed" // Completato
  | "error"; // Errore
