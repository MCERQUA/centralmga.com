// PDF -> answers for ACORD 130. The inverse of overlay130.ts: it reads back the very leaf names that overlay prints into (tables exported there).
// Only those names are read; nothing is guessed. Signature, signed date and the privacy-notice acknowledgment are never read back.
import { type PdfRead, isoFromUs, digitsFromMoney } from '@/lib/pdfRead'
import { T, ENT, entLeaf, BOX, PEND_TEXT, travelLeaf } from '@/lib/overlay130'
import { STATES, EL_LIMITS, TITLES, COVER_130, OTHER_DESC_130, MAX_OWNERS, MAX_CLASSES, MAX_PRIOR, MAX_TRAVEL_STATES, ownerKeys, classKeys, priorKeys, money, type Flat } from '@/lib/acord130Spec'

export type Prefill130 = { values: Flat; counts: { owners: number; classes: number; prior: number }; count: number; unmatched: string[]; ambiguous: string[] }

export function isAcord130(r: PdfRead): boolean {
  let hits = 0
  for (const n of ['NamedInsured_FullName_A[0]', 'WorkersCompensation_RateClass_ClassificationCode_A[0]', 'Policy_EffectiveDate_A[0]', 'NamedInsured_TaxIdentifier_A[0]', 'WorkersCompensation_Individual_FullName_A[0]']) if (r.has(n)) hits++
  return hits >= 2
}

const MONEYISH = /^(ownerPayroll\d*|classPayroll\d+|priorYear\d+(Premium|Paid|Reserved))$/
const LIMIT_KEYS = new Set(['elEachAccident', 'elDiseasePolicy', 'elDiseaseEachEmployee'])
const ciFind = (list: string[], v: string) => list.find(o => o.toLowerCase() === v.trim().toLowerCase())

export function prefill130(r: PdfRead): Prefill130 {
  const values: Flat = {}, used = new Set<string>(), ambiguous: string[] = []
  const take = (leaf: string) => { const v = r.text(leaf); if (v) used.add(leaf); return v }

  for (const [name, tgs] of Object.entries(T)) {
    for (const t of tgs) {
      if (t.kind === 'statename') continue            // the full state name is printed from the code; the code is read instead
      let v = take(t.leaf); if (!v) continue
      if (t.kind === 'date') { const d = isoFromUs(v); if (!d) { ambiguous.push(`${name} (date not readable)`); continue }; v = d }
      else if (t.kind === 'code') { const s = ciFind(STATES, v); if (!s) { ambiguous.push(`${name} (not a state code)`); continue }; v = s }
      else if (t.kind === 'yn') { v = /^y/i.test(v) ? 'Yes' : /^n/i.test(v) ? 'No' : ''; if (!v) continue }
      else if (t.kind === 'inc') { v = /^inc/i.test(v) ? 'Included' : /^exc/i.test(v) ? 'Excluded' : ''; if (!v) continue }
      else if (LIMIT_KEYS.has(name)) { const o = ciFind(EL_LIMITS, v); if (!o) { ambiguous.push(`${name} (not one of this form's limits)`); continue }; v = o }
      else if (/^ownerTitleRelationship\d*$/.test(name)) { const o = ciFind(TITLES, v); if (!o) { ambiguous.push(`${name} (not one of this form's titles)`); continue }; v = o }
      else if (MONEYISH.test(name) && digitsFromMoney(v)) v = money(v)
      if (values[name] === undefined) values[name] = v
    }
  }

  // legal entity: one box ticked = that entity; "Other" carries its own text
  const ticked = Object.entries(ENT).filter(([, k]) => r.checked(entLeaf(k)))
  const otherOn = r.checked(entLeaf('Other'))
  if (ticked.length + (otherOn ? 1 : 0) > 1) ambiguous.push('entity type (more than one box is ticked)')
  else if (ticked.length === 1) { values.entityType = ticked[0][0]; used.add(entLeaf(ticked[0][1])) }
  else if (otherOn) { used.add(entLeaf('Other')); const d = take('NamedInsured_LegalEntity_OtherDescription_A[0]'); if (d) { values.entityType = '__other'; values.entityOther = d } else ambiguous.push('entity type ("Other" ticked without a description)') }

  // option boxes: a ticked box is a "yes"; an unticked box says nothing, so it is left alone
  for (const cv of COVER_130) if (r.checked(BOX[cv.name])) { values[cv.name] = 'yes'; used.add(BOX[cv.name]) }
  for (const [box, d] of Object.entries(OTHER_DESC_130)) { const v = take(PEND_TEXT[d]); if (v && values[box] === 'yes') values[d] = v }
  if (r.checked(BOX.lossRunsAttached)) { values.lossRunsAttached = 'Yes'; used.add(BOX.lossRunsAttached) }
  for (const k of ['inspectionContactEmail', 'workFromHomeCount']) { const v = take(PEND_TEXT[k]); if (v) values[k] = v }
  const trav: string[] = []
  for (let i = 0; i < MAX_TRAVEL_STATES; i++) { const s = ciFind(STATES, take(travelLeaf(i))); if (s) trav.push(s) }
  if (trav.length) values.travelStates = trav.join(', ')

  // mailing address: identical to the street address -> the form's own "same as" tick; otherwise the typed mailing fields stay as read
  const same = (a: string, b: string) => !!values[a] && values[a].trim().toLowerCase() === (values[b] ?? '').trim().toLowerCase()
  if (values.mailingAddress && same('mailingAddress', 'streetAddress') && same('mailingCity', 'city') && same('mailingState', 'physicalState') && same('mailingZip', 'zip')) {
    values.mailingSameAsPhysical = 'yes'; for (const k of ['mailingAddress', 'mailingCity', 'mailingState', 'mailingZip']) delete values[k]
  }

  const rows = (n: number, keysOf: (i: number) => Record<string, string>) => { let hi = 1; for (let i = 1; i <= n; i++) if (Object.values(keysOf(i)).some(k => values[k])) hi = i; return hi }
  const counts = { owners: rows(MAX_OWNERS, ownerKeys), classes: rows(MAX_CLASSES, classKeys), prior: rows(MAX_PRIOR, priorKeys) }
  const unmatched = [...r.filled.keys()].filter(k => !used.has(k) && !k.includes('.')).sort()
  return { values, counts, count: Object.keys(values).length, unmatched, ambiguous }
}
