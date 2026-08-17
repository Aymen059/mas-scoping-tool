import Papa from 'papaparse'
import mammoth from 'mammoth'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

async function extractCsv(file: File): Promise<string> {
  const text = await file.text()
  const parsed = Papa.parse<string[]>(text.trim(), { skipEmptyLines: true })
  return parsed.data.map(row => row.join(' | ')).join('\n')
}

async function extractDocx(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer: buffer })
  return result.value
}

async function extractPdf(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise
  const pages: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    pages.push(content.items.map(item => ('str' in item ? item.str : '')).join(' '))
  }
  return pages.join('\n')
}

/** Extracts plain text from an uploaded CSV, DOCX, PDF, or TXT file. */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase()
  if (name.endsWith('.csv')) return extractCsv(file)
  if (name.endsWith('.docx')) return extractDocx(file)
  if (name.endsWith('.pdf')) return extractPdf(file)
  if (name.endsWith('.txt')) return file.text()

  // Fall back on MIME type if the extension is missing/unrecognized.
  if (file.type === 'application/pdf') return extractPdf(file)
  if (file.type === 'text/csv') return extractCsv(file)
  if (file.type.includes('wordprocessingml')) return extractDocx(file)
  return file.text()
}
