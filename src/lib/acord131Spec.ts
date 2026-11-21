// ACORD 131 (umbrella / excess liability) questionnaire spec: field names, plain-language labels, validation, and the POST payload.
// Pure data + functions (scripts/gen-forms131.mjs imports this file directly under node).
// POSTED field names are the mapper's own lowercase plain labels (~/josh-workspace/skills/acord-forms/scripts/map_acord131.py: SINGLE, Q2 and
// the literal d.get("...") keys). Where the form collects one value in two inputs (address, policy term, dates), the inputs use internal keys
// and buildPayload131 joins them into the mapper's single label.
import { STATES, money, STATE_NAME } from './acord130Spec.ts'
export { STATES, money, STATE_NAME }
export type Flat = Record<string, string>
export const FORM_NAME_131 = 'acord131'
export const STORAGE_131 = 'cmga-acord131-answers-v1'

export const LIMIT_REQ = ['umbrella limit requested - each occurrence', 'umbrella limit requested - aggregate'] as const
export const GL_LIMITS: { key: string; label: string }[] = [
  { key: 'underlying GL each occurrence limit', label: 'Each occurrence' },
  { key: 'underlying GL general aggregate limit', label: 'General aggregate' },
  { key: 'underlying GL products and completed operations aggregate', label: 'Products and completed operations aggregate' },
  { key: 'underlying GL personal and advertising injury limit', label: 'Personal and advertising injury' },
  { key: 'underlying GL damage to rented premises limit', label: 'Damage to rented premises' },
  { key: 'underlying GL medical expense limit', label: 'Medical expense (per person)' },
]
export const OCC_CM = ['Occurrence', 'Claims made']
export const DEFENSE = ['Within aggregate limits', 'A separate limit', 'Unlimited'] // mapper tests: "within" / "separate" / "unlimited"

// The 19 comb Y/N cells + the Q20 plain cell, in form order. key = the mapper's own lowercase label (SINGLE posted name).
export const YN_131: { key: string; q: string; sec: string }[] = [
  { sec: 'Advertising', key: 'do you use an advertising agency', q: 'Do you use an advertising agency?' },
  { sec: 'Advertising', key: "is any coverage provided under that agency's policy", q: "Is any of your coverage provided under that advertising agency's insurance policy?" },
  { sec: 'Aircraft', key: 'do you own, lease or operate aircraft', q: 'Do you own, lease or operate any aircraft?' },
  { sec: 'Autos', key: 'do you haul explosives, caustics, flammables or other dangerous cargo', q: 'Do you haul explosives, caustics, flammables or other dangerous cargo?' },
  { sec: 'Autos', key: 'do you carry passengers for a fee', q: 'Do you carry passengers for a fee?' },
  { sec: 'Autos', key: 'are any vehicles not insured by the underlying policies', q: 'Are any of your vehicles not insured by the underlying auto policy?' },
  { sec: 'Autos', key: 'are any vehicles leased or rented to others', q: 'Are any of your vehicles leased or rented to others?' },
  { sec: 'Autos', key: 'do you carry hired and non-owned auto coverage', q: 'Do you carry hired and non-owned auto coverage (for rented or employee-owned vehicles used on business)?' },
  { sec: 'Contractors', key: 'do you perform bridge, dam or marine work', q: 'Do you perform bridge, dam or marine work?' },
  { sec: 'Contractors', key: 'do you own, rent or otherwise use cranes', q: 'Do you own, rent or otherwise use cranes?' },
  { sec: 'Contractors', key: 'do your subcontractors carry lower coverages or limits than you do', q: 'Do your subcontractors carry lower coverage or limits than you do?' },
  { sec: 'Employers liability', key: 'are you self-insured in any state', q: 'Are you self-insured for workers compensation in any state?' },
  { sec: 'Medical', key: 'do you maintain a hospital or first aid facility', q: 'Do you maintain a hospital or first aid facility?' },
  { sec: 'Medical', key: 'do you provide coverage for doctors or nurses', q: 'Do you provide coverage for doctors or nurses?' },
  { sec: 'Products', key: 'do your products contain hazardous materials needing special disposal', q: 'Do your products (now or in the past) contain hazardous materials that may need special disposal?' },
  { sec: 'Products', key: 'do you make missiles, engines, guidance systems or frames used in aircraft', q: 'Do you make missiles, engines, guidance systems or frames, or any product used or installed in aircraft?' },
  { sec: 'Products', key: 'do you distribute foreign products in the U.S.', q: 'Do you distribute foreign-made products in the U.S.?' },
  { sec: 'Products', key: 'are your products sold or distributed in foreign countries', q: 'Are your U.S. products sold or distributed in foreign countries?' },
  { sec: 'Products', key: 'have you had a product liability loss in the past 3 years', q: 'Have you had a product liability loss in the past 3 years?' },
  { sec: 'Watercraft', key: 'do you own or lease watercraft', q: 'Do you own or lease watercraft?' },
]
export const K_PRODUCT_LOSS = 'have you had a product liability loss in the past 3 years'
export const K_WATERCRAFT = 'do you own or lease watercraft'
export const K_CLAIMS = 'liability claims over $10,000 in the past 5 years'

// Internal (non-posted) input keys
export const INTERNAL = {
  street: 'addrStreet', city: 'addrCity', state: 'addrState', zip: 'addrZip',
  anyClaims: 'anyClaims', // Yes/No radio; the posted value is "None" or the details text
}
export const TERMS = ['underlying auto policy term', 'underlying general liability policy term', 'underlying employers liability policy term'] as const
export const termFrom = (k: string) => `${k}:from`
export const termTo = (k: string) => `${k}:to`
export const DATE_KEYS = ['umbrella effective date', 'umbrella expiration date', 'retroactive date you are proposing for the umbrella',
  'retroactive date of the current underlying GL policy', 'date you entered uninterrupted claims made coverage'] as const
export const K_TAIL = 'was tail coverage purchased for any previous primary or excess policy'
export const K_EXCLUDED = 'has any product, work, accident or location been excluded, uninsured or self-insured under previous coverage'
export const K_OCC = 'is the underlying GL occurrence or claims made'

export const MAXLEN: Record<string, number> = {
  'legal entity name': 60, [INTERNAL.street]: 50, [INTERNAL.city]: 30, [INTERNAL.zip]: 10, name: 60, email: 72, phone: 24,
  'description of operations': 200, 'names and locations of any subsidiary companies': 120,
  'number of employees': 8, 'describe the typical jobs you perform': 400, 'describe the product liability loss': 300, [K_CLAIMS]: 400,
  'watercraft owned - number, length and horsepower': 60,
  'underlying auto carrier and policy number': 50, 'underlying general liability carrier and policy number': 50, 'underlying employers liability carrier and policy number': 50,
}
export const MONEY_KEYS = [
  'annual payroll', 'annual gross sales', 'foreign gross sales', ...LIMIT_REQ, 'self-insured retention requested', 'underlying auto combined single limit',
  ...GL_LIMITS.map(g => g.key), 'underlying employers liability each accident limit', 'underlying employers liability disease each employee limit',
]
export const CARRIER_KEYS = ['underlying auto carrier and policy number', 'underlying general liability carrier and policy number', 'underlying employers liability carrier and policy number']

/** Every key a submission can carry (posted for Netlify form detection in public/__forms.html). */
export function allKeys131(): string[] {
  const out = [
    'legal entity name', 'business address', 'name', 'email', 'phone', 'description of operations', 'names and locations of any subsidiary companies',
    'annual payroll', 'annual gross sales', 'foreign gross sales', 'number of employees', 'describe the typical jobs you perform',
    'new or renewal', 'umbrella effective date', 'umbrella expiration date', ...LIMIT_REQ, 'self-insured retention requested', 'do you want first dollar defense', 'billing preference',
    'underlying auto carrier and policy number', 'underlying auto policy term', 'underlying auto combined single limit',
    'underlying general liability carrier and policy number', 'underlying general liability policy term', K_OCC, ...GL_LIMITS.map(g => g.key),
    'are defense costs within the aggregate, a separate limit, or unlimited', K_EXCLUDED,
    'retroactive date you are proposing for the umbrella', 'retroactive date of the current underlying GL policy', 'date you entered uninterrupted claims made coverage', K_TAIL,
    'underlying employers liability carrier and policy number', 'underlying employers liability policy term',
    'underlying employers liability each accident limit', 'underlying employers liability disease each employee limit',
    K_CLAIMS, 'describe the product liability loss', 'watercraft owned - number, length and horsepower', ...YN_131.map(q => q.key),
    'form_name', 'source',
  ]
  return [...new Set(out)]
}

const digits = (s: string) => (s ?? '').replace(/\D/g, '')
export const mdY = (v: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); return m ? `${m[2]}/${m[3]}/${m[1]}` : v }
const validIso = (s: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) return false; const d = new Date(+m[1], +m[2] - 1, +m[3]); return d.getMonth() === +m[2] - 1 && +m[1] > 2000 && +m[1] < 2100 }
const moneyOk = (s: string) => /^\d+(\.\d{1,2})?$/.test((s ?? '').replace(/[$,\s]/g, ''))
export const oneYearAfter = (iso: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? `${Number(m[1]) + 1}-${m[2]}-${m[2] === '02' && m[3] === '29' ? '28' : m[3]}` : '' }
export const REQ = 'Please answer this.'
const carrierBad = (s: string) => /\//.test(s) || /\d{4,}/.test(s) || /\b(policy|pol)\s*(no|number|#)/i.test(s)
const claimsMade = (v: Flat) => v[K_OCC] === 'Claims made'
export const yes = (v: Flat, k: string) => v[k] === 'Yes'

/** Validation errors by input key. Empty object = valid. Mirrors forms/acord-131-umbrella/schema.json applicant_required (30 values, 4 choice groups) + the 20 Y/N cells. */
export function validate131(v: Flat): Record<string, string> {
  const e: Record<string, string> = {}
  const need = (k: string, label = REQ) => { if (!(v[k] ?? '').trim()) { e[k] = label; return false } return true }
  const needMoney = (k: string) => { if (need(k, 'Type a dollar amount ($0 if none).') && !moneyOk(v[k])) e[k] = 'Dollars, for example $1,000,000.' }
  need('legal entity name')
  need(INTERNAL.street); need(INTERNAL.city); need(INTERNAL.state)
  if (need(INTERNAL.zip) && !/^\d{5}(-\d{4})?$/.test(v[INTERNAL.zip].trim())) e[INTERNAL.zip] = 'ZIP code, 5 digits.'
  need('name', 'Who should we contact about this application?')
  if (need('phone') && digits(v.phone).length < 10) e.phone = 'Enter a phone number with area code.'
  if (need('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Enter a valid email address.'
  need('description of operations'); need('describe the typical jobs you perform')
  for (const k of ['annual payroll', 'annual gross sales', 'foreign gross sales']) needMoney(k)
  if (need('number of employees') && !/^\d+$/.test(v['number of employees'].trim())) e['number of employees'] = 'Whole number.'
  need('new or renewal')
  for (const k of DATE_KEYS.slice(0, 2)) if (need(k) && !validIso(v[k])) e[k] = 'Pick a valid date.'
  if (!e['umbrella effective date'] && !e['umbrella expiration date'] && v['umbrella expiration date'] <= v['umbrella effective date']) e['umbrella expiration date'] = 'Must be after the start date.'
  for (const k of [...LIMIT_REQ, 'self-insured retention requested']) needMoney(k)
  need('do you want first dollar defense', REQ); need('billing preference')
  for (const k of CARRIER_KEYS) if (need(k, 'Insurance company name.') && carrierBad(v[k])) e[k] = 'Company name only. We never ask for policy numbers.'
  for (const t of TERMS) {
    if (need(termFrom(t), 'Policy start date.') && !validIso(v[termFrom(t)])) e[termFrom(t)] = 'Pick a valid date.'
    if (need(termTo(t), 'Policy end date.') && !validIso(v[termTo(t)])) e[termTo(t)] = 'Pick a valid date.'
    else if (v[termFrom(t)] && v[termTo(t)] && validIso(v[termFrom(t)]) && v[termTo(t)] <= v[termFrom(t)]) e[termTo(t)] = 'Must be after the start date.'
  }
  needMoney('underlying auto combined single limit')
  for (const g of GL_LIMITS) needMoney(g.key)
  needMoney('underlying employers liability each accident limit'); needMoney('underlying employers liability disease each employee limit')
  need(K_OCC); need('are defense costs within the aggregate, a separate limit, or unlimited'); need(K_EXCLUDED)
  if (claimsMade(v)) {
    for (const k of DATE_KEYS.slice(2)) if (need(k, 'Pick the date (claims-made policies need it).') && !validIso(v[k])) e[k] = 'Pick a valid date.'
    need(K_TAIL)
  }
  if (!['Yes', 'No'].includes(v[INTERNAL.anyClaims])) e[INTERNAL.anyClaims] = REQ
  else if (v[INTERNAL.anyClaims] === 'Yes') need(K_CLAIMS, 'Give the date, what happened, amount paid and amount still open.')
  for (const q of YN_131) if (v[q.key] !== 'Yes' && v[q.key] !== 'No') e[q.key] = REQ
  if (yes(v, K_PRODUCT_LOSS)) need('describe the product liability loss', 'Briefly describe the product liability loss.')
  if (yes(v, K_WATERCRAFT)) need('watercraft owned - number, length and horsepower', 'How many, how long, how much horsepower.')
  return e
}

/** Exactly what is POSTed (and what the overlay prints). Unanswered / inactive groups are not carried; a blank Y/N is never turned into No. */
export function buildPayload131(v: Flat, source: string): Record<string, string> {
  const P: Record<string, string> = {}
  const t = (k: string) => (v[k] ?? '').trim()
  const put = (k: string, x: string) => { if (x !== '') P[k] = x }
  put('legal entity name', t('legal entity name'))
  const st = t(INTERNAL.state), addr = [t(INTERNAL.street), t(INTERNAL.city)].filter(Boolean).join(', ')
  put('business address', t(INTERNAL.street) || t(INTERNAL.city) || st || t(INTERNAL.zip) ? `${addr}${st || t(INTERNAL.zip) ? `, ${[st, t(INTERNAL.zip)].filter(Boolean).join(' ')}` : ''}` : '')
  for (const k of ['name', 'email', 'phone', 'description of operations', 'names and locations of any subsidiary companies', 'number of employees', 'describe the typical jobs you perform', 'new or renewal',
    K_OCC, 'are defense costs within the aggregate, a separate limit, or unlimited', 'billing preference']) put(k, t(k))
  for (const k of MONEY_KEYS) put(k, t(k) ? money(t(k)) : '')
  for (const k of CARRIER_KEYS) put(k, t(k))
  for (const k of DATE_KEYS) put(k, mdY(t(k)))
  if (!claimsMade(v)) for (const k of DATE_KEYS.slice(2)) delete P[k]
  for (const tk of TERMS) put(tk, t(termFrom(tk)) && t(termTo(tk)) ? `${mdY(t(termFrom(tk)))} to ${mdY(t(termTo(tk)))}` : '')
  for (const k of ['do you want first dollar defense', K_EXCLUDED]) put(k, v[k] === 'Yes' || v[k] === 'No' ? v[k] : '')
  if (claimsMade(v)) put(K_TAIL, v[K_TAIL] === 'Yes' || v[K_TAIL] === 'No' ? v[K_TAIL] : '')
  for (const q of YN_131) put(q.key, v[q.key] === 'Yes' || v[q.key] === 'No' ? v[q.key] : '')
  if (v[INTERNAL.anyClaims] === 'No') P[K_CLAIMS] = 'None'
  else if (v[INTERNAL.anyClaims] === 'Yes') put(K_CLAIMS, t(K_CLAIMS))
  if (yes(v, K_PRODUCT_LOSS)) put('describe the product liability loss', t('describe the product liability loss'))
  if (yes(v, K_WATERCRAFT)) put('watercraft owned - number, length and horsepower', t('watercraft owned - number, length and horsepower'))
  P.form_name = FORM_NAME_131; P.source = source
  return P
}
export function hasAnyAnswer(P: Record<string, string>) { return Object.keys(P).some(k => !['form_name', 'source'].includes(k)) }
