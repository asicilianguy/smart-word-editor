export interface TextRun {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
  fontSize?: number
}

export interface Paragraph {
  runs: TextRun[]
  alignment?: string
}

export interface ParsedDocument {
  paragraphs: Paragraph[]
}

export interface VaultCategory {
  id: string
  name: string
  values: VaultValue[]
}

export interface VaultValue {
  id: string
  label: string
  value: string
}

export interface Selection {
  paragraphIndex: number
  runIndex: number
  startOffset: number
  endOffset: number
}
