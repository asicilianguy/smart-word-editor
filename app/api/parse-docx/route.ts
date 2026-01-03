import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Read file as buffer
    const buffer = await file.arrayBuffer()

    // Parse DOCX using mammoth-like parsing
    const parsed = await parseDocxToStructure(Buffer.from(buffer))

    return NextResponse.json(parsed)
  } catch (error) {
    console.error("[v0] Error parsing DOCX:", error)
    return NextResponse.json({ error: "Failed to parse document" }, { status: 500 })
  }
}

interface TextRun {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  color?: string
  fontSize?: number
}

interface Paragraph {
  runs: TextRun[]
  alignment?: string
}

interface ParsedDocument {
  paragraphs: Paragraph[]
}

async function parseDocxToStructure(buffer: Buffer): Promise<ParsedDocument> {
  // Import JSZip and xml2js dynamically
  const JSZip = (await import("jszip")).default
  const xml2js = await import("xml2js")

  const zip = new JSZip()
  const content = await zip.loadAsync(buffer)

  // Get document.xml
  const documentXml = await content.file("word/document.xml")?.async("text")
  if (!documentXml) {
    throw new Error("Invalid DOCX file")
  }

  const parser = new xml2js.Parser()
  const result = await parser.parseStringPromise(documentXml)

  const paragraphs: Paragraph[] = []
  const body = result["w:document"]["w:body"][0]
  const wParagraphs = body["w:p"] || []

  for (const wP of wParagraphs) {
    const runs: TextRun[] = []
    const wRuns = wP["w:r"] || []

    for (const wR of wRuns) {
      const wT = wR["w:t"]
      if (!wT) continue

      const text = Array.isArray(wT) ? wT.map((t) => t._).join("") : wT._ || wT

      // Parse formatting
      const wRPr = wR["w:rPr"]?.[0]
      const textRun: TextRun = { text }

      if (wRPr) {
        if (wRPr["w:b"]) textRun.bold = true
        if (wRPr["w:i"]) textRun.italic = true
        if (wRPr["w:u"]) textRun.underline = true

        const color = wRPr["w:color"]?.[0]?.$?.["w:val"]
        if (color && color !== "auto") {
          textRun.color = `#${color}`
        }

        const sz = wRPr["w:sz"]?.[0]?.$?.["w:val"]
        if (sz) {
          textRun.fontSize = Number.parseInt(sz) / 2 // Half-points to points
        }
      }

      runs.push(textRun)
    }

    const wPPr = wP["w:pPr"]?.[0]
    const alignment = wPPr?.["w:jc"]?.[0]?.$?.["w:val"]

    paragraphs.push({ runs, alignment })
  }

  return { paragraphs }
}
