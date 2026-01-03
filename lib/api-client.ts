/**
 * API Client per comunicazione con il backend FastAPI
 *
 * Il backend gira su http://localhost:8000
 * Endpoints:
 * - POST /api/documents/parse - parsing DOCX
 * - POST /api/documents/generate - generazione DOCX modificato
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

/**
 * Parsing di un documento DOCX
 * Invia il file al backend e riceve la struttura parsata
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
 * Invia il file originale + le modifiche e riceve il DOCX generato
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
// TIPI - Allineati ai modelli Pydantic del backend
// ============================================================================

/**
 * Stile di un run (grassetto, corsivo, etc.)
 * Corrisponde a RunStyle in backend/src/models/document.py
 */
export interface RunStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  font_name: string | null;
  font_size: number | null;
  color: string | null;
}

/**
 * Singolo run di testo con stile
 * Corrisponde a Run in backend/src/models/document.py
 */
export interface Run {
  index: number;
  text: string;
  style: RunStyle;
}

/**
 * Paragrafo contenente run
 * Corrisponde a ParagraphElement in backend/src/models/document.py
 */
export interface ParagraphElement {
  type: "paragraph";
  index: number;
  runs: Run[];
  alignment: string | null;
}

/**
 * Cella di tabella
 * Corrisponde a TableCell in backend/src/models/document.py
 */
export interface TableCell {
  index: number;
  paragraphs: ParagraphElement[];
}

/**
 * Riga di tabella
 * Corrisponde a TableRow in backend/src/models/document.py
 */
export interface TableRow {
  index: number;
  cells: TableCell[];
}

/**
 * Tabella
 * Corrisponde a TableElement in backend/src/models/document.py
 */
export interface TableElement {
  type: "table";
  index: number;
  rows: TableRow[];
}

/**
 * Elemento del documento (paragrafo o tabella)
 */
export type DocumentElement = ParagraphElement | TableElement;

/**
 * Contenuto del documento parsato
 * Corrisponde a DocumentContent in backend/src/models/document.py
 */
export interface DocumentContent {
  elements: DocumentElement[];
}

/**
 * Metadati del documento
 * Corrisponde a DocumentMetadata in backend/src/models/document.py
 */
export interface DocumentMetadata {
  file_name: string;
  paragraph_count: number;
  table_count: number;
}

/**
 * Risposta del parsing
 * Corrisponde a ParsedDocumentResponse in backend/src/models/document.py
 */
export interface ParseDocumentResponse {
  success: boolean;
  content: DocumentContent;
  metadata: DocumentMetadata;
}

/**
 * Posizione di una selezione nel documento
 * Corrisponde a SelectionPosition in backend/src/models/document.py
 */
export interface SelectionPosition {
  type: "paragraph" | "table";

  // Per paragrafo diretto
  paragraph_index?: number;

  // Per tabella
  table_index?: number;
  row_index?: number;
  cell_index?: number;
  cell_paragraph_index?: number;

  // Posizione nel testo
  run_index: number;
  char_start: number;
  char_end: number;

  // Per cross-run (se la selezione attraversa più run)
  end_run_index?: number;
  char_start_in_first_run?: number;
  char_end_in_last_run?: number;
}

/**
 * Modifica da applicare al documento
 * Corrisponde a Modification in backend/src/models/document.py
 */
export interface Modification {
  position: SelectionPosition;
  original_text: string;
  new_text: string;
}

/**
 * Risposta della generazione
 * Corrisponde a GenerateResponse in backend/src/models/document.py
 */
export interface GenerateResponse {
  success: boolean;
  modifications_applied: number;
}
