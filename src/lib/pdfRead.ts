// Read the AcroForm fields of a fillable PDF ENTIRELY IN THE BROWSER. The file is read from the File object into memory, parsed by the bundled
// pdf-lib (loaded on first drop only), and dropped again. No fetch, no XHR, no beacon, no storage, no logging of anything read.
export const NOT_FILLABLE_MSG = 'Scans and Word files come later, please drop a fillable PDF.'
export const MAX_PDF_BYTES = 25 * 1024 * 1024

export class PrefillError extends Error {}

export type PdfRead = {
  /** number of form fields in the file (filled or not) */
  fieldCount: number
  /** every field that holds a value: text as typed, tick boxes as true */
  filled: Map<string, string>
  text: (name: string) => string
  checked: (name: string) => boolean
  has: (name: string) => boolean
}

const variants = (n: string) => [n, n.replace(/\[0\]$/, ''), n.endsWith(']') ? n : `${n}[0]`]

export async function readFillablePdf(file: File): Promise<PdfRead> {
  if (file.size > MAX_PDF_BYTES) throw new PrefillError('That file is too large. Please drop a fillable ACORD PDF under 25 MB.')
  const buf = new Uint8Array(await file.arrayBuffer())
  const head = new TextDecoder('latin1').decode(buf.subarray(0, 1024))
  if (!head.includes('%PDF-')) throw new PrefillError(NOT_FILLABLE_MSG)
  const { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFOptionList } = await import('pdf-lib')
  let doc
  try { doc = await PDFDocument.load(buf, { updateMetadata: false }) }
  catch { throw new PrefillError('That PDF could not be opened here (it may be password protected). Please drop an unlocked, fillable ACORD PDF.') }
  const fields = doc.getForm().getFields()
  if (!fields.length) throw new PrefillError(NOT_FILLABLE_MSG)
  const texts = new Map<string, string>(), checks = new Map<string, boolean>()
  const put = <T,>(m: Map<string, T>, full: string, val: T) => { m.set(full, val); const leaf = full.split('.').pop() ?? full; if (!m.has(leaf)) m.set(leaf, val) }
  for (const f of fields) {
    const name = f.getName()
    try {
      if (f instanceof PDFTextField) { const t = (f.getText() ?? '').trim(); put(texts, name, t) }
      else if (f instanceof PDFCheckBox) put(checks, name, f.isChecked())
      else if (f instanceof PDFRadioGroup) { const s = f.getSelected(); if (s) put(texts, name, s) }
      else if (f instanceof PDFDropdown || f instanceof PDFOptionList) { const s = f.getSelected(); if (s.length) put(texts, name, s.join(', ')) }
    } catch { /* one unreadable field never blocks the rest */ }
  }
  const filled = new Map<string, string>()
  texts.forEach((v, k) => { if (v) filled.set(k, v) })
  checks.forEach((v, k) => { if (v) filled.set(k, '[ticked]') })
  const pick = <T,>(m: Map<string, T>, n: string): T | undefined => { for (const x of variants(n)) if (m.has(x)) return m.get(x) }
  return {
    fieldCount: fields.length,
    filled,
    text: n => pick(texts, n) ?? '',
    checked: n => pick(checks, n) === true,
    has: n => pick(texts, n) !== undefined || pick(checks, n) !== undefined,
  }
}

/** MM/DD/YYYY (as printed on the ACORD) -> YYYY-MM-DD (as the date inputs hold it). Anything else returns ''. */
export function isoFromUs(v: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v.trim()); if (!m) return ''
  const mo = +m[1], d = +m[2]; if (mo < 1 || mo > 12 || d < 1 || d > 31) return ''
  return `${m[3]}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}
/** "$1,250,000.00" -> "1250000" ; "" if it is not a plain amount. */
export function digitsFromMoney(v: string): string {
  const t = v.replace(/[$,\s]/g, ''); if (!/^\d+(\.\d+)?$/.test(t)) return ''
  return t.replace(/\.0+$/, '')
}
export const moneyText = (digits: string) => `$${Number(digits).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
