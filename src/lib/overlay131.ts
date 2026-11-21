// Overlay for /acord-131: what the real mapper (map_acord131.py, ported in map131.ts and diffed by scripts/compare131.mjs) writes for the POSTED payload,
// drawn at the real PDF widget rects. Template field names are OCR-offset, so every cell is resolved by name from the mapper's own table.
import map from '../data/acord131-map.json'
import { mapPayload131, type Names } from './map131'
import { YN_131, GL_LIMITS, TERMS, CARRIER_KEYS, INTERNAL, K_CLAIMS, K_OCC, K_TAIL, K_EXCLUDED, termFrom, termTo } from './acord131Spec'
import type { Item } from './overlay'

const M = map as unknown as { rects: Record<string, { page: number; rect: number[] }[]>; names: Names }
const N = M.names
const rectsOf = (n: string) => M.rects[n] ?? []

/** Overlay items for a posted payload (see buildPayload131). Comb Y/N cells show a letter in the YES (left) or NO (right) half. */
export function computeItems131(P: Record<string, string>): Item[] {
  const T = mapPayload131(P, N), out: Item[] = []
  for (const [pdf, text] of Object.entries(T)) for (const w of rectsOf(pdf)) {
    const [x0, y0, x1, y1] = w.rect
    if (text === 'X') out.push({ pdf, page: w.page, rect: w.rect, check: true })
    else if (text === 'Y ' || text === ' N') { const mid = (x0 + x1) / 2; out.push({ pdf, page: w.page, rect: text === 'Y ' ? [x0, y0, mid, y1] : [mid, y0, x1, y1], text: text.trim() }) }
    else out.push({ pdf, page: w.page, rect: w.rect, text })
  }
  return out
}
/** Leaf -> text map for the comparison against the real mapper (comb cells and ticks kept verbatim). */
export function leafTexts131(P: Record<string, string>) { return mapPayload131(P, N) }

const OPS = ['NAME AND LOCATION OF PRIMARY AND ALL SUBSIDIARY COMPANIES Describe OperationsRow1', 'Row1']
const GL_BOX = 'CARRIERPOLICY NUMBERGENERAL LIABILITY POLICY TYPE OCCUR CLAIMS MADE'
const TABLE: Record<string, string[]> = {
  'legal entity name': ['EFFECTIVE DATE'], [INTERNAL.street]: ['EFFECTIVE DATE'], [INTERNAL.city]: ['EFFECTIVE DATE'], [INTERNAL.state]: ['EFFECTIVE DATE'], [INTERNAL.zip]: ['EFFECTIVE DATE'],
  'description of operations': OPS, 'names and locations of any subsidiary companies': OPS,
  'billing preference': ['EXPIRATION DATE', 'EXPIRATION DATE_2'],
  'do you want first dollar defense': ['FIRST DOLLAR DEFENSE_2', 'YES'],
  'are defense costs within the aggregate, a separate limit, or unlimited': ['INDICATE THE EDITION DATE OF THE ISO SIMPLIFIED FORM OR SIMILAR FILING FOR THE UNDERLYING COVERAGE', 'WITHIN AGGREGATE LIMITS_2', 'A SEPARATE LIMIT'],
  [K_EXCLUDED]: ['HAS ANY PRODUCT WORK ACCIDENT OR LOCATION BEEN EXCLUDED UNINSURED OR SELF INSURED FROM ANY PREVIOUS COVERAGE', 'YES_2'],
  [K_TAIL]: [N.tailYes, N.tailNo], [K_OCC]: [GL_BOX], 'underlying general liability carrier and policy number': [GL_BOX],
  'underlying auto carrier and policy number': ['CARRIERPOLICY NUMBERAUTOMOBILE LIABILITY'], 'underlying employers liability carrier and policy number': ['CARRIERPOLICY NUMBEREMPLOYERS LIABILITY'],
  [INTERNAL.anyClaims]: ['ACORD 131 200201', 'REMARKS'], [K_CLAIMS]: ['REMARKS'], 'describe the product liability loss': ['REMARKS'],
}
for (const [lab, base] of [['underlying auto policy term', 'AUTOMOBILE LIABILITY'], ['underlying employers liability policy term', 'EMPLOYERS LIABILITY']])
  for (const k of [lab, termFrom(lab), termTo(lab)]) TABLE[k] = [`POLICY EFF DATE${base}`, `POLICY EXP DATE${base}`]
for (const k of ['underlying general liability policy term', termFrom('underlying general liability policy term'), termTo('underlying general liability policy term')]) TABLE[k] = [GL_BOX]
void TERMS; void CARRIER_KEYS; void GL_LIMITS

/** Widgets a typed field prints into (focus -> page + highlight). Fields with no printed box (contact details) return []. */
export function widgets131(name: string): Item[] {
  const names = TABLE[name] ?? (N.single[name] ? [N.single[name]] : N.q2[name] ? [N.q2[name]] : YN_131.some(q => q.key === name) && name === 'do your products contain hazardous materials needing special disposal' ? [N.k20] : [])
  return names.flatMap(n => rectsOf(n).map(w => ({ pdf: n, page: w.page, rect: w.rect })))
}
