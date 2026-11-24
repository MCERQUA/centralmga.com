// PDF -> answers for ACORD 125 / 126 / 140. This is the exact inverse of overlay.ts: it walks the SAME rule table (src/data/acord-map.json, the
// probed field names the apps already print into) the other way round. Only field names that table knows are read; nothing is guessed.
import map from '@/data/acord-map.json'
import { type PdfRead, isoFromUs, digitsFromMoney, moneyText } from '@/lib/pdfRead'
import { US_STATE_CODES, GL_EACH_OCCURRENCE, GL_GENERAL_AGGREGATE, GL_PRODUCTS_COMPOPS, GL_PERSONAL_ADV, GL_RENTED_PREMISES, GL_MEDICAL_EXPENSE, SELECT_OPTIONS } from '@/lib/quote/quoteSpec'

type Eff = { text: Record<string, string>; check: Record<string, string> }
type Rule = { kind: 'text' | 'choice'; text: Record<string, { t: string; pre?: string; post?: string; opaque?: string }>; check: Record<string, string>; values: Record<string, Eff> }
const M = map as unknown as { composites: Record<string, { tpl: string; from: string[] }>; rules: Record<string, Rule> }

export type Prefill = {
  values: Record<string, string>   // answers to put in the form (canonical field names)
  count: number                    // answers actually found
  unmatched: string[]              // filled PDF fields that have no home in these apps
  ambiguous: string[]              // answers the PDF could not settle (left blank)
}

const MULTI = new Set(['safetyProgramElements', 'poolSafetyFeatures', 'rentEquipmentTypes'])
const OPTIONS: Record<string, string[]> = {
  ...SELECT_OPTIONS, physicalState: US_STATE_CODES, state: US_STATE_CODES, glEachOccurrence: GL_EACH_OCCURRENCE, glGeneralAggregate: GL_GENERAL_AGGREGATE,
  glProductsCompOpsAggregate: GL_PRODUCTS_COMPOPS, glPersonalAdvertisingInjury: GL_PERSONAL_ADV, glDamageToRentedPremises: GL_RENTED_PREMISES, glMedicalExpense: GL_MEDICAL_EXPENSE,
}
const DATE_FIELDS = new Set<string>(), MONEY_FIELDS = new Set<string>()
for (const [f, r] of Object.entries(M.rules)) if (r.kind === 'text') for (const t of Object.values(r.text)) { if (t.t === 'date') DATE_FIELDS.add(f); if (t.t === 'money') MONEY_FIELDS.add(f) }

export function isAcord125Family(r: PdfRead): boolean {
  let hits = 0
  for (const n of ['ACORD_Policy_Insured1_Name', 'ACORD_Policy_Insured1_MailingAddress', 'ACORD_Location1_Street', 'GeneralLiability_EachOccurrence_LimitAmount_A', 'ACORD_NatureOfBusiness_Description', 'ACORD_Contact1_Name']) if (r.has(n)) hits++
  return hits >= 2
}

export function prefill125(r: PdfRead): Prefill {
  const values: Record<string, string> = {}, used = new Set<string>(), ambiguous: string[] = []
  const take = (pdf: string) => { const v = r.text(pdf); if (v) used.add(pdf); return v }
  const tick = (pdf: string) => { const c = r.checked(pdf); if (c) used.add(pdf); return c }

  for (const [f, rule] of Object.entries(M.rules)) {
    if (rule.kind === 'text') {
      // first printed box that holds a readable value; opaque boxes (a code the mapper adds itself) are never read back
      let got = ''
      for (const [pdf, t] of Object.entries(rule.text)) {
        if (t.opaque) continue
        let v = r.text(pdf); if (!v) continue
        if (t.t === 'tpl') { if (t.pre && v.startsWith(t.pre)) v = v.slice(t.pre.length); if (t.post && v.endsWith(t.post)) v = v.slice(0, v.length - t.post.length) }
        if (t.t === 'date') { const d = isoFromUs(v); if (!d) { ambiguous.push(`${f} (date not readable: ${pdf})`); continue }; v = d }
        else if (t.t === 'money') {
          const dg = digitsFromMoney(v); if (!dg) { ambiguous.push(`${f} (amount not readable: ${pdf})`); continue }
          v = OPTIONS[f] ? moneyText(dg) : dg
        }
        if (OPTIONS[f] && !OPTIONS[f].includes(v)) { const up = OPTIONS[f].find(o => o.toLowerCase() === v.toLowerCase()); if (up) v = up; else { ambiguous.push(`${f} (value not one of this form's choices)`); continue } }
        got = v; used.add(pdf); break
      }
      if (got) { values[f] = got; Object.keys(rule.text).forEach(k => used.add(k)) }   // twin boxes of one answer (e.g. both phone boxes) count as carried over
      // a text rule that also ticks a box (e.g. a trade) is not reversible: the tick alone does not say which trade
      continue
    }
    const hits: string[] = []
    for (const [val, e] of Object.entries(rule.values)) {
      const checks = Object.keys(e.check), texts = Object.entries(e.text)
      if (!checks.length && !texts.length) continue
      if (!checks.every(c => r.checked(c))) continue
      if (!texts.every(([k, t]) => r.text(k).trim().toLowerCase() === String(t).toLowerCase())) continue
      hits.push(val)
    }
    if (!hits.length) continue
    if (hits.length > 1 && !MULTI.has(f)) { ambiguous.push(`${f} (more than one answer is marked)`); continue }
    for (const val of hits) { const e = rule.values[val]; Object.keys(e.check).forEach(tick); Object.keys(e.text).forEach(take) }
    values[f] = hits.join(', ')
  }

  // composites: only those that reverse without guessing
  for (const [pdf, c] of Object.entries(M.composites)) {
    const v = take(pdf); if (!v) continue
    const single = /^\{\{(\w+)\}\}$/.exec(c.tpl)
    if (single) { if (!values[single[1]]) values[single[1]] = v; continue }
    if (c.tpl === '{{firstName}} {{lastName}}') {
      const parts = v.split(/\s+/); if (parts.length === 2) { values.firstName ??= parts[0]; values.lastName ??= parts[1] } else ambiguous.push(`contact name (not exactly first + last: "${v.length > 30 ? v.slice(0, 30) + '...' : v}")`)
      continue
    }
    if (c.tpl === '{{address}}, {{city}}, {{state}} {{zip}}') {
      const m = /^(.+?),\s*(.+?),\s*([A-Za-z]{2})\s+(\d{5}(?:-\d{4})?)$/.exec(v)
      if (m && US_STATE_CODES.includes(m[3].toUpperCase())) { values.address ??= m[1]; values.city ??= m[2]; values.state ??= m[3].toUpperCase(); values.zip ??= m[4] } else ambiguous.push('mailing address (not in "street, city, ST ZIP" form)')
    }
  }

  // derived exactly like the form does when someone types the same thing
  if (values.businessStartDate) values.yearBusinessStarted = values.businessStartDate.slice(0, 4)
  if (Object.keys(values).some(k => k.startsWith('_info_') && k !== '_info_property_requested')) values._info_property_requested = 'Yes'

  const unmatched = [...r.filled.keys()].filter(k => !used.has(k) && !k.includes('.')).sort()
  return { values, count: Object.keys(values).length, unmatched, ambiguous }
}
