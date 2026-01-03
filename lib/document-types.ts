/**
 * Tipi per il documento
 *
 * Questi tipi sono allineati ai modelli Pydantic del backend.
 * Vedi lib/api-client.ts per i tipi principali.
 */

// Ri-esporta tutti i tipi dall'API client
export type {
  RunStyle,
  Run,
  ParagraphElement,
  TableCell,
  TableRow,
  TableElement,
  DocumentElement,
  DocumentContent,
  DocumentMetadata,
  ParseDocumentResponse,
  SelectionPosition,
  Modification,
  GenerateResponse,
} from "./api-client";

// ============================================================================
// TIPI AGGIUNTIVI PER IL FRONTEND
// ============================================================================

/**
 * Stato del documento nell'applicazione
 */
export interface DocumentState {
  /** File DOCX originale (per generazione finale) */
  originalFile: File;

  /** Contenuto parsato e modificabile */
  content: import("./api-client").DocumentContent;

  /** Metadati del documento */
  metadata: import("./api-client").DocumentMetadata;

  /** Storia modifiche (per undo e tracking) */
  modifications: import("./api-client").Modification[];
}

/**
 * Riferimento a una selezione nel documento (per UI)
 * Include informazioni extra per il popover
 */
export interface SelectionRef {
  /** Posizione nel documento (per il backend) */
  position: import("./api-client").SelectionPosition;

  /** Testo attualmente selezionato */
  selectedText: string;

  /** Coordinate per il popover */
  x: number;
  y: number;
}

/**
 * Categoria del vault
 */
export interface VaultCategory {
  id: string;
  name: string;
  icon?: string;
  values: VaultValue[];
}

/**
 * Valore singolo nel vault
 */
export interface VaultValue {
  id: string;
  label: string;
  value: string;
}
