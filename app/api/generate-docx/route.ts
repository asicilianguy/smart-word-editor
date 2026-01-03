import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paragraphs } = body

    if (!paragraphs || !Array.isArray(paragraphs)) {
      return NextResponse.json({ error: "Invalid document structure" }, { status: 400 })
    }

    // Generate DOCX buffer
    const buffer = await generateDocxFromStructure({ paragraphs })

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": 'attachment; filename="document.docx"',
      },
    })
  } catch (error) {
    console.error("[v0] Error generating DOCX:", error)
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 })
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

async function generateDocxFromStructure(doc: ParsedDocument): Promise<Buffer> {
  const JSZip = (await import("jszip")).default
  const zip = new JSZip()

  // Create basic DOCX structure
  zip.file("[Content_Types].xml", createContentTypesXml())
  zip.file("_rels/.rels", createRelsXml())
  zip.file("word/_rels/document.xml.rels", createDocumentRelsXml())
  zip.file("word/document.xml", createDocumentXml(doc))
  zip.file("word/styles.xml", createStylesXml())

  const buffer = await zip.generateAsync({ type: "nodebuffer" })
  return buffer
}

function createContentTypesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`
}

function createRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
}

function createDocumentRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
}

function createDocumentXml(doc: ParsedDocument): string {
  const paragraphsXml = doc.paragraphs
    .map((p) => {
      const runsXml = p.runs
        .map((run) => {
          const propsXml = []
          if (run.bold) propsXml.push("<w:b/>")
          if (run.italic) propsXml.push("<w:i/>")
          if (run.underline) propsXml.push('<w:u w:val="single"/>')
          if (run.color) propsXml.push(`<w:color w:val="${run.color.replace("#", "")}"/>`)
          if (run.fontSize) propsXml.push(`<w:sz w:val="${run.fontSize * 2}"/>`)

          const props = propsXml.length > 0 ? `<w:rPr>${propsXml.join("")}</w:rPr>` : ""
          const escapedText = escapeXml(run.text)
          return `<w:r>${props}<w:t xml:space="preserve">${escapedText}</w:t></w:r>`
        })
        .join("")

      const alignmentXml = p.alignment ? `<w:pPr><w:jc w:val="${p.alignment}"/></w:pPr>` : ""
      return `<w:p>${alignmentXml}${runsXml}</w:p>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml}
  </w:body>
</w:document>`
}

function createStylesXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="22"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}
