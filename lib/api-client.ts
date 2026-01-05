/**
 * API Client per comunicazione con il backend FastAPI
 *
 * Il backend gira su http://localhost:8000
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Errore API personalizzato
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ============================================================================
// DOCUMENT ENDPOINTS
// ============================================================================

/**
 * Parsing di un documento DOCX
 */
export async function parseDocument(
  file: File
): Promise<ParseDocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/documents/parse`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.detail || "Errore durante il parsing del documento",
      response.status,
      error
    );
  }

  return response.json();
}

/**
 * Generazione di un documento DOCX modificato
 */
export async function generateDocument(
  file: File,
  modifications: Modification[]
): Promise<Blob> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("modifications", JSON.stringify(modifications));

  const response = await fetch(`${API_BASE_URL}/api/documents/generate`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.detail || "Errore durante la generazione del documento",
      response.status,
      error
    );
  }

  return response.blob();
}

/**
 * Validazione documenti per onboarding
 */
export async function validateDocuments(
  files: File[]
): Promise<PageCountResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const response = await fetch(
    `${API_BASE_URL}/api/documents/validate-documents`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(
      error.detail || "Errore durante la validazione dei documenti",
      response.status,
      error
    );
  }

  return response.json();
}

// ============================================================================
// VAULT ENDPOINTS
// ============================================================================

/**
 * Estrae dati riutilizzabili dai documenti per il vault
 *
 * NOTA: Questa funzione non lancia eccezioni per errori di business logic.
 * Il backend restituisce sempre 200 OK con success=false in caso di errore.
 * Gli errori sono gestiti tramite i campi `success`, `error`, `error_code`.
 */
export async function extractVaultData(
  files: File[],
  usePremium: boolean = false
): Promise<ExtractionResponse> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append("files", file);
  });

  const url = new URL(`${API_BASE_URL}/api/vault/extract`);
  if (usePremium) {
    url.searchParams.set("use_premium", "true");
  }

  const response = await fetch(url.toString(), {
    method: "POST",
    body: formData,
  });

  // Il backend ora restituisce sempre 200 OK, anche in caso di errore
  // Gli errori sono nel body della risposta con success=false
  if (!response.ok) {
    // Errore HTTP inaspettato (500, 503, ecc.)
    return {
      success: false,
      entries: [],
      model_used: "",
      tokens_used: 0,
      documents_processed: 0,
      error: "Errore di comunicazione con il server. Riprova più tardi.",
      error_code: "HTTP_ERROR",
    };
  }

  return response.json();
}

/**
 * Health check del backend
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// TIPI - Document
// ============================================================================

export interface RunStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  font_name: string | null;
  font_size: number | null;
  color: string | null;
}

export interface Run {
  index: number;
  text: string;
  style: RunStyle;
}

export interface ParagraphElement {
  type: "paragraph";
  index: number;
  runs: Run[];
  alignment: string | null;
}

export interface TableCell {
  index: number;
  paragraphs: ParagraphElement[];
}

export interface TableRow {
  index: number;
  cells: TableCell[];
}

export interface TableElement {
  type: "table";
  index: number;
  rows: TableRow[];
}

export type DocumentElement = ParagraphElement | TableElement;

export interface DocumentContent {
  elements: DocumentElement[];
}

export interface DocumentMetadata {
  file_name: string;
  paragraph_count: number;
  table_count: number;
}

export interface ParseDocumentResponse {
  success: boolean;
  content: DocumentContent;
  metadata: DocumentMetadata;
}

export interface SelectionPosition {
  type: "paragraph" | "table";
  paragraph_index?: number;
  table_index?: number;
  row_index?: number;
  cell_index?: number;
  cell_paragraph_index?: number;
  run_index: number;
  char_start: number;
  char_end: number;
  end_run_index?: number;
  char_start_in_first_run?: number;
  char_end_in_last_run?: number;
}

export interface Modification {
  position: SelectionPosition;
  original_text: string;
  new_text: string;
}

export interface GenerateResponse {
  success: boolean;
  modifications_applied: number;
}

// ============================================================================
// TIPI - Page Counter
// ============================================================================

export interface FilePageCount {
  filename: string;
  pages: number;
  error?: string | null;
}

export interface PageCountResponse {
  files: FilePageCount[];
  total_pages: number;
  is_valid: boolean;
  max_files: number;
  max_pages: number;
  error?: string | null;
}

// ============================================================================
// TIPI - Vault Extraction
// ============================================================================

export interface ExtractedEntry {
  valueData: string;
  nameLabel?: string | null;
  nameGroup?: string | null;
  confidence?: number | null;
}

export interface ExtractionResponse {
  success: boolean;
  entries: ExtractedEntry[];
  model_used: string;
  tokens_used: number;
  documents_processed: number;
  error?: string | null;
  error_code?: string | null;
}
