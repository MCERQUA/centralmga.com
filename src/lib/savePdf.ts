// Browser-only "save the completed form" PDF. No server, no upload, no dependency: each ACORD page picture is redrawn on a canvas with the
// typed answers over it (same rects/sizes as the on-screen preview), encoded as JPEG and wrapped in a hand-built PDF. An invisible text layer
// carries the same answers so the saved file is searchable / copyable. Signature, signed date and policy number are never drawn (they are not in the items).
export type SaveItem = { pdf: string; page: number; rect: number[]; text?: string; check?: boolean }
const PW = 612, PH = 792

const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error(`page image failed: ${src}`)); i.src = src })
const latin1 = (s: string) => s.replace(/[^\x20-\x7e\xa0-\xff]/g, '?')
const esc = (s: string) => latin1(s).replace(/([\\()])/g, '\\$1')
const bytes = (s: string) => { const u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u }

function fontSize(i: SaveItem) {
  const hpt = i.rect[3] - i.rect[1], wpt = i.rect[2] - i.rect[0]
  return hpt > 20 ? 7.2 : Math.max(5, Math.min(hpt * 0.72, (wpt / Math.max(1, (i.text ?? '').length)) * 1.9, 10))
}
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const lines: string[] = []; let cur = ''
  for (const w of text.split(/\s+/)) { const t = cur ? `${cur} ${w}` : w; if (cur && ctx.measureText(t).width > maxW) { lines.push(cur); cur = w } else cur = t }
  if (cur) lines.push(cur); return lines
}

export async function buildCompletedPdf(pages: number[], png: (n: number) => string, items: SaveItem[]): Promise<Blob> {
  const objs: Uint8Array[] = [] // object bodies, 1-based ids = index + 1
  const put = (...parts: (string | Uint8Array)[]) => { objs.push(concat(parts.map(p => (typeof p === 'string' ? bytes(p) : p)))); return objs.length }
  const concat = (a: Uint8Array[]) => { const o = new Uint8Array(a.reduce((n, x) => n + x.length, 0)); let p = 0; for (const x of a) { o.set(x, p); p += x.length } return o }
  put('<< /Type /Catalog /Pages 2 0 R >>')
  put('') // pages placeholder (id 2)
  const font = put('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>')
  const kids: number[] = []
  for (const n of pages) {
    const img = await loadImg(png(n))
    const cv = document.createElement('canvas'); cv.width = img.naturalWidth; cv.height = img.naturalHeight
    const ctx = cv.getContext('2d'); if (!ctx) throw new Error('canvas unavailable')
    const k = cv.width / PW
    ctx.drawImage(img, 0, 0)
    ctx.fillStyle = '#10226b'; ctx.textBaseline = 'middle'
    let invisible = ''
    for (const it of items.filter(x => x.page === n)) {
      const [x0, y0, x1, y1] = it.rect; const left = x0 * k, top = (PH - y1) * k, w = (x1 - x0) * k, h = (y1 - y0) * k
      if (it.check) {
        ctx.font = `bold ${Math.max(8, Math.min(h, w) * 0.95 * k)}px Helvetica, Arial, sans-serif`; ctx.textAlign = 'center'; ctx.fillText('X', left + w / 2, top + h / 2); continue
      }
      const t = (it.text ?? '').trim(); if (!t) continue
      const fs = fontSize(it); ctx.font = `${fs * k}px Helvetica, Arial, sans-serif`; ctx.textAlign = 'left'
      if (y1 - y0 > 20) { wrap(ctx, t, w).slice(0, Math.floor(h / (fs * 1.15 * k))).forEach((ln, j) => ctx.fillText(ln, left + 2 * k, top + (fs * 0.7 + j * fs * 1.15) * k)) }
      else ctx.fillText(t, left + 2 * k, top + h / 2)
      invisible += `BT 3 Tr /F1 ${fs.toFixed(2)} Tf ${(x0 + 2).toFixed(2)} ${(y0 + 2).toFixed(2)} Td (${esc(t)}) Tj ET\n`
    }
    const jpg: Blob = await new Promise((res, rej) => cv.toBlob(b => (b ? res(b) : rej(new Error('jpeg encode failed'))), 'image/jpeg', 0.9))
    const data = new Uint8Array(await jpg.arrayBuffer())
    const imId = put(`<< /Type /XObject /Subtype /Image /Width ${cv.width} /Height ${cv.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${data.length} >>\nstream\n`, data, '\nendstream')
    const content = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q\n${invisible}`
    const cId = put(`<< /Length ${content.length} >>\nstream\n${content}endstream`)
    kids.push(put(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${imId} 0 R >> /Font << /F1 ${font} 0 R >> >> /Contents ${cId} 0 R >>`))
  }
  objs[1] = bytes(`<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(i => `${i} 0 R`).join(' ')}] >>`)
  const out: Uint8Array[] = [bytes('%PDF-1.4\n%\xe2\xe3\xcf\xd3\n')]; const offs: number[] = []; let pos = out[0].length
  objs.forEach((b, i) => { offs.push(pos); const head = bytes(`${i + 1} 0 obj\n`), tail = bytes('\nendobj\n'); out.push(head, b, tail); pos += head.length + b.length + tail.length })
  const xr = `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${pos}\n%%EOF\n`
  out.push(bytes(xr))
  return new Blob(out as BlobPart[], { type: 'application/pdf' })
}

export async function savePdf(filename: string, pages: number[], png: (n: number) => string, items: SaveItem[]) {
  const blob = await buildCompletedPdf(pages, png, items)
  const url = URL.createObjectURL(blob); const a = document.createElement('a')
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}
