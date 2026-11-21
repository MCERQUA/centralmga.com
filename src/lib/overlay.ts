import map from '@/data/acord-map.json'

export type Widget = { page: number; rect: number[]; ft: string }
export type Item = { pdf: string; page: number; rect: number[]; text?: string; check?: boolean; pending?: boolean }
type Eff = { text: Record<string, string>; check: Record<string, string> }
const M = map as unknown as {
  composites: Record<string, { tpl: string; from: string[] }>
  rules: Record<string, any>
  rects: Record<string, Widget[]>
}

const mdY = (v: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); return m ? `${m[2]}/${m[3]}/${m[1]}` : v }
const money = (v: string) => { const n = Number(v.replace(/[$,\s]/g, '')); return Number.isFinite(n) && v.trim() ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : v }

/** The widgets (page + rect) a canonical field prints into, for focus-to-page and highlighting. */
export function widgetsFor(field: string): Item[] {
  const r = M.rules[field]; const names = new Set<string>()
  if (r) {
    if (r.kind === 'text') { Object.keys(r.text).forEach(n => names.add(n)); Object.keys(r.check).forEach(n => names.add(n)) }
    else for (const e of Object.values<Eff>(r.values)) { Object.keys(e.text).forEach(n => names.add(n)); Object.keys(e.check).forEach(n => names.add(n)) }
  }
  for (const [pf, c] of Object.entries(M.composites)) if (c.from.includes(field)) names.add(pf)
  return [...names].flatMap(pdf => (M.rects[pdf] ?? []).map(w => ({ pdf, page: w.page, rect: w.rect })))
}

/** Overlay items for the current answers: exactly what the real mapper writes for each answered field (probed, see scripts/probe_map.py). */
export function computeItems(v: Record<string, string>): Item[] {
  const pend = new Set<string>()
  const text: Record<string, string> = {}, check: Record<string, boolean> = {}
  const apply = (e: Eff) => { for (const [k, x] of Object.entries(e.text)) text[k] = x; for (const k of Object.keys(e.check)) check[k] = true }
  for (const [f, r] of Object.entries(M.rules)) {
    const val = (v[f] ?? '').trim(); if (!val) continue
    if (r.pending) for (const e of r.kind === 'text' ? [r] : Object.values<any>(r.values)) Object.keys(e.text).forEach(k => pend.add(k))
    if (r.kind === 'text') {
      for (const [pf, t] of Object.entries<any>(r.text)) {
        text[pf] = t.opaque ? t.opaque : t.t === 'date' ? mdY(val) : t.t === 'money' ? money(val) : t.t === 'tpl' ? `${t.pre}${val}${t.post}` : val
      }
      for (const k of Object.keys(r.check)) check[k] = true
    } else for (const piece of val.split(', ')) if (r.values[piece]) apply(r.values[piece])
  }
  for (const [pf, c] of Object.entries(M.composites)) {
    if (!c.from.some(f => (v[f] ?? '').trim())) continue
    const s = c.tpl.replace(/\{\{(\w+)\}\}/g, (_, n) => (v[n] ?? '').trim())
    text[pf] = s.replace(/(,\s*)+,/g, ',').replace(/^[,\s]+|[,\s]+$/g, '').replace(/\s{2,}/g, ' ')
  }
  const out: Item[] = []
  for (const [pdf, t] of Object.entries(text)) if (t) for (const w of M.rects[pdf] ?? []) out.push({ pdf, page: w.page, rect: w.rect, text: t, pending: pend.has(pdf) })
  for (const pdf of Object.keys(check)) for (const w of M.rects[pdf] ?? []) out.push({ pdf, page: w.page, rect: w.rect, check: true })
  return out
}
