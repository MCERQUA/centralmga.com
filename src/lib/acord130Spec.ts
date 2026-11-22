// ACORD 130 (workers compensation) questionnaire spec: field names, plain-language labels, limits, validation, and the POST payload.
// Pure data + functions, relative imports only (scripts/gen-forms130.mjs imports this file directly under node).
// Field names are the camelCase "site form" keys that ~/josh-workspace/skills/acord-forms/scripts/map_acord130.py site_to_intake() reads.
export type Flat = Record<string, string>
export const FORM_NAME_130 = 'acord130'
export const STORAGE_130 = 'cmga-acord130-answers-v1'
export const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
export const STATE_NAME: Record<string, string> = { AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming' }

export const ENTITY_130: [string, string][] = [
  ['Sole proprietor', 'Sole proprietor (just me, no separate company)'], ['Partnership', 'Partnership'], ['Corporation', 'Corporation'],
  ['Subchapter S Corporation', 'S corporation'], ['Limited Liability Corporation', 'LLC (limited liability company)'], ['Joint venture', 'Joint venture'],
  ['Trust', 'Trust'], ['Unincorporated association', 'Unincorporated association'], ['__other', 'Something else (you describe it)'],
]
export const TITLES = ['Owner', 'President', 'Vice Pres', 'Secretary', 'Treasurer', 'Member', 'Partner', 'Officer', 'Director'] // each <= 12 chars (box limit)
export const EL_LIMITS = ['$100,000', '$500,000', '$1,000,000']
export const MAX_OWNERS = 4   // the template has owner rows A-D (a 5th would not print)
export const MAX_CLASSES = 5  // the mapper reads classCode1..5
export const MAX_PRIOR = 5    // prior-coverage rows A-E

// Y/N questions: key (posted as yn_<key>, explanation as ynExplain_<key>), plain-language wording, optional hint for the explanation.
export const YN_130: { key: string; q: string; hint?: string }[] = [
  { key: 'aircraftWatercraft', q: 'Do you own, operate or lease any aircraft or boats?' },
  { key: 'hazardousMaterial', q: 'Does your work, now or in the past, involve storing, handling, spraying, dumping or hauling hazardous materials?' },
  { key: 'undergroundOr15Ft', q: 'Does anyone work underground or more than 15 feet off the ground?' },
  { key: 'overWater', q: 'Is any work done on barges, boats, docks or bridges over water?' },
  { key: 'otherBusiness', q: 'Do you run any other type of business?' },
  { key: 'usesSubcontractors', q: 'Do you use subcontractors?' },
  { key: 'subletNoCerts', q: 'Has any work been handed to a subcontractor who did not give you a certificate of insurance?' },
  { key: 'safetyProgram', q: 'Do you have a written safety program?' },
  { key: 'groupTransportation', q: 'Do you provide group transportation for workers (vans, buses)?' },
  { key: 'under16Over60', q: 'Do you have any employees under 16 or over 60 years old?' },
  { key: 'seasonalEmployees', q: 'Do you have any seasonal employees?' },
  { key: 'volunteerLabor', q: 'Do you use any volunteer or donated labor?' },
  { key: 'physicalHandicaps', q: 'Do you have any employees with physical handicaps?' },
  { key: 'travelOutOfState', q: 'Do your employees travel out of state for work?', hint: 'A little more detail (how long, how often)' },
  { key: 'athleticTeams', q: 'Do you sponsor any athletic teams?' },
  { key: 'physicalsRequired', q: 'Do you require a physical exam after a job offer is made?' },
  { key: 'otherInsuranceSameCarrier', q: 'Do you have any other insurance with the company this policy would be with?' },
  { key: 'declinedCancelled', q: 'In recent years (usually the last three), has any insurance of yours been declined, cancelled or not renewed?' },
  { key: 'employeeHealthPlan', q: 'Do you provide a health plan for your employees?' },
  { key: 'workForOtherBusinesses', q: 'Do any of your employees also do work for other businesses or subsidiaries?' },
  { key: 'leasedEmployees', q: 'Do you lease employees to or from another employer?' },
  { key: 'workFromHome', q: 'Do your employees mostly work from home?', hint: 'A little more detail (what they do from home)' },
  { key: 'taxLiensBankruptcy', q: 'In the last five years, have you had any tax liens or a bankruptcy?' },
  { key: 'unpaidWcPremium', q: 'Do you (or any business you own or manage with others) owe any undisputed, unpaid workers compensation premium?' },
]
// Optional coverage extras (checkbox in the PDF). Posted 'Yes' or ''.
export const COVER_130: { name: string; label: string }[] = [
  { name: 'wcCoverageUSLH', label: 'U.S. Longshore & Harbor Workers coverage (dock or waterfront work)' },
  { name: 'wcCoverageVoluntaryComp', label: 'Voluntary compensation (cover people the law does not require)' },
  { name: 'wcCoverageForeign', label: 'Foreign coverage (employees working outside the U.S.)' },
  { name: 'wcCoverageManagedCare', label: 'Managed care option' },
  { name: 'wcDeductibleMedical', label: 'I want a medical deductible' },
  { name: 'wcDeductibleIndemnity', label: 'I want an indemnity (lost-wages) deductible' },
  { name: 'wcCoverageOther', label: 'Another coverage option not listed above (you name it)' },
  { name: 'wcDeductibleOther', label: 'Another kind of deductible not listed above (you name it)' },
]
/** Free-text names for the two "Other" boxes: shown only when the matching box is ticked, required then. Box limits come from FIELDS.md (11 and 13). */
export const OTHER_DESC_130: Record<string, string> = { wcCoverageOther: 'wcCoverageOtherDescription', wcDeductibleOther: 'wcDeductibleOtherDescription' }
/** Notice text printed on page 4 of the real ACORD 130 (verbatim, from the form itself). The box beside it is ticked by the applicant, never pre-ticked. */
export const INFO_NOTICE_130 = 'PERSONAL INFORMATION ABOUT YOU, INCLUDING INFORMATION FROM A CREDIT OR OTHER INVESTIGATIVE REPORT, MAY BE COLLECTED FROM PERSONS OTHER THAN YOU IN CONNECTION WITH THIS APPLICATION FOR INSURANCE AND SUBSEQUENT AMENDMENTS AND RENEWALS. SUCH INFORMATION AS WELL AS OTHER PERSONAL AND PRIVILEGED INFORMATION COLLECTED BY US OR OUR AGENTS MAY IN CERTAIN CIRCUMSTANCES BE DISCLOSED TO THIRD PARTIES WITHOUT YOUR AUTHORIZATION. CREDIT SCORING INFORMATION MAY BE USED TO HELP DETERMINE EITHER YOUR ELIGIBILITY FOR INSURANCE OR THE PREMIUM YOU WILL BE CHARGED. WE MAY USE A THIRD PARTY IN CONNECTION WITH THE DEVELOPMENT OF YOUR SCORE. YOU MAY HAVE THE RIGHT TO REVIEW YOUR PERSONAL INFORMATION IN OUR FILES AND REQUEST CORRECTION OF ANY INACCURACIES. YOU MAY ALSO HAVE THE RIGHT TO REQUEST IN WRITING THAT WE CONSIDER EXTRAORDINARY LIFE CIRCUMSTANCES IN CONNECTION WITH THE DEVELOPMENT OF YOUR CREDIT SCORE. THESE RIGHTS MAY BE LIMITED IN SOME STATES. PLEASE CONTACT YOUR AGENT OR BROKER TO LEARN HOW THESE RIGHTS MAY APPLY IN YOUR STATE OR FOR INSTRUCTIONS ON HOW TO SUBMIT A REQUEST TO US FOR A MORE DETAILED DESCRIPTION OF YOUR RIGHTS AND OUR PRACTICES REGARDING PERSONAL INFORMATION.'
export const INFO_NOTICE_TICK_130 = 'Copy of the Notice of Information Practices (Privacy) has been given to the applicant. (Not required in all states, contact your agent or broker for your state\'s requirements.)'
export const MAX_TRAVEL_STATES = 10 // the template has Part Three state boxes A-J only (the mapper letter list goes to N, the PDF does not)
/** Normalise "nv, Utah  az" -> ['NV','UT','AZ'] (codes or full names); null entry = an unrecognised token. */
export function parseStates(s: string): (string | null)[] {
  const byName = Object.fromEntries(Object.entries(STATE_NAME).map(([c, n]) => [n.toLowerCase(), c]))
  const out: (string | null)[] = []
  for (const t of (s ?? '').split(/[,;\n]+|\s+and\s+/i).flatMap(x => (/^[A-Za-z]{2}(\s+[A-Za-z]{2})+$/.test(x.trim()) ? x.trim().split(/\s+/) : [x])).map(x => x.trim()).filter(Boolean)) {
    const c = STATES.includes(t.toUpperCase()) ? t.toUpperCase() : byName[t.toLowerCase()] ?? null
    if (c === null || !out.includes(c)) out.push(c)
  }
  return out
}

/** Keep at most MAX_TRAVEL_STATES entries of a typed state list; the rest is cut (the UI says so). */
export function clampStates(raw: string): { text: string } {
  let text = raw ?? ''
  while (parseStates(text).length > MAX_TRAVEL_STATES) {
    const i = Math.max(text.lastIndexOf(','), text.lastIndexOf(';'), text.lastIndexOf('\n'))
    if (i < 0) break
    text = text.slice(0, i)
  }
  return { text }
}

export const sfx = (n: number) => (n === 1 ? '' : String(n))
export const ownerKeys = (n: number) => ({
  name: `ownerName${n}`, title: `ownerTitleRelationship${n}`, dob: `ownerDateOfBirth${sfx(n)}`, duties: `ownerDuties${sfx(n)}`,
  inc: `ownerIncludedExcluded${sfx(n)}`, pct: `ownerOwnershipPct${sfx(n)}`, cls: `ownerClassCode${sfx(n)}`, pay: `ownerPayroll${sfx(n)}`,
})
export const classKeys = (n: number) => ({ code: `classCode${n}`, duties: `classDuties${n}`, ft: `classFullTime${n}`, pt: `classPartTime${n}`, pay: `classPayroll${n}` })
export const priorKeys = (n: number) => ({
  year: `priorYear${n}Year`, carrier: `priorYear${n}Carrier`, prem: `priorYear${n}Premium`, mod: `priorYear${n}Mod`,
  claims: `priorYear${n}ClaimCount`, paid: `priorYear${n}Paid`, res: `priorYear${n}Reserved`,
})
const vals = (o: Record<string, string>) => Object.values(o)

/** Box limits (characters the PDF box can show) for each posted key; typing is capped at these so nothing is silently clipped. */
export const MAXLEN: Record<string, number> = {
  businessName: 71, phone: 29, secondaryPhone: 29, email: 72, websiteUrl: 28, yearsInBusiness: 27, sicCode: 6, naicsCode: 8, ncciRiskId: 12, ratingBureauId: 14,
  streetAddress: 49, city: 50, physicalCounty: 29, zip: 11, mailingAddress: 47, mailingCity: 30, mailingZip: 11, operationsDescription: 142, entityOther: 21,
  inspectionContactName: 35, inspectionContactPhone: 26, accountingContactName: 35, accountingContactPhone: 26, claimsContactName: 35, claimsContactPhone: 26,
  experienceMod: 9, explain: 136, wcCoverageOtherDescription: 11, wcDeductibleOtherDescription: 13, inspectionContactEmail: 44, workFromHomeCount: 6, travelStates: 60,
}
for (let n = 1; n <= MAX_OWNERS; n++) { const k = ownerKeys(n); Object.assign(MAXLEN, { [k.name]: 23, [k.title]: 12, [k.pct]: 5, [k.duties]: 29, [k.cls]: 11, [k.pay]: 15, [k.dob]: 10 }) }
for (let n = 1; n <= MAX_CLASSES; n++) { const k = classKeys(n); Object.assign(MAXLEN, { [k.code]: 11, [k.duties]: 42, [k.ft]: 5, [k.pt]: 5, [k.pay]: 15 }) }
for (let n = 1; n <= MAX_PRIOR; n++) { const k = priorKeys(n); Object.assign(MAXLEN, { [k.year]: 7, [k.carrier]: 44, [k.prem]: 19, [k.mod]: 9, [k.claims]: 9, [k.paid]: 18, [k.res]: 18 }) }

export const TOP_KEYS = [
  'businessName', 'entityType', 'fein', 'yearsInBusiness', 'phone', 'secondaryPhone', 'email', 'websiteUrl', 'sicCode', 'naicsCode', 'ncciRiskId', 'ratingBureauId',
  'operationsDescription', 'streetAddress', 'city', 'physicalCounty', 'physicalState', 'zip', 'mailingSameAsPhysical', 'mailingAddress', 'mailingCity', 'mailingState', 'mailingZip',
  'desiredEffectiveDate', 'desiredExpirationDate', 'workStates', 'elEachAccident', 'elDiseasePolicy', 'elDiseaseEachEmployee', ...COVER_130.map(c => c.name),
  'experienceMod', 'inspectionContactName', 'inspectionContactPhone', 'inspectionContactEmail', 'accountingContactName', 'accountingContactPhone', 'claimsContactName', 'claimsContactPhone',
]
/** Every key a submission can carry (posted for Netlify form detection in public/__forms.html). */
export function allKeys130(): string[] {
  const out = [...TOP_KEYS]
  for (let n = 1; n <= MAX_OWNERS; n++) out.push(...vals(ownerKeys(n)))
  for (let n = 1; n <= MAX_CLASSES; n++) out.push(...vals(classKeys(n)))
  for (let n = 1; n <= MAX_PRIOR; n++) out.push(...vals(priorKeys(n)))
  for (const q of YN_130) out.push(`yn_${q.key}`, `ynExplain_${q.key}`)
  out.push('travelStates', 'workFromHomeCount', 'lossRunsAttached', 'informationPracticesNotice', ...Object.values(OTHER_DESC_130))
  out.push('name', 'form_name', 'source')
  return [...new Set(out)]
}

export const isSole = (v: Flat) => v.entityType === 'Sole proprietor'
const digits = (s: string) => (s ?? '').replace(/\D/g, '')
export const money = (s: string) => { const t = (s ?? '').replace(/[$,\s]/g, ''); return /^\d+(\.\d{1,2})?$/.test(t) ? `$${Number(t).toLocaleString('en-US', { maximumFractionDigits: 2 })}` : (s ?? '').trim() }
export const fmtFein = (s: string) => { const d = digits(s); return d.length === 9 && !/^\d{3}-\d{2}-\d{4}$/.test((s ?? '').trim()) ? `${d.slice(0, 2)}-${d.slice(2)}` : (s ?? '').trim() }
export function oneYearAfter(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); if (!m) return ''
  return `${Number(m[1]) + 1}-${m[2]}-${m[2] === '02' && m[3] === '29' ? '28' : m[3]}`
}
const validIso = (s: string, minYear = 2000) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) return false; const d = new Date(+m[1], +m[2] - 1, +m[3]); return d.getMonth() === +m[2] - 1 && +m[1] > minYear && +m[1] < 2100 }
const int = (s: string) => /^\d+$/.test((s ?? '').trim())
const moneyOk = (s: string) => /^\d+(\.\d{1,2})?$/.test((s ?? '').replace(/[$,\s]/g, ''))
const started = (v: Flat, keys: string[]) => keys.some(k => (v[k] ?? '').trim() !== '')

export type Counts = { owners: number; classes: number; prior: number }
export const REQ = 'Please answer this.'

/** Validation errors by key. Empty object = valid. Mirrors the mandatory list in forms/acord-130/FIELDS.md (42 values + entity + 24 Y/N). */
export function validate130(v: Flat, c: Counts): Record<string, string> {
  const e: Record<string, string> = {}
  const need = (k: string, label = REQ) => { if (!(v[k] ?? '').trim()) { e[k] = label; return false } return true }
  need('businessName'); need('entityType')
  if (v.entityType === '__other') need('entityOther', 'Describe your type of business entity.')
  if (!isSole(v) && v.entityType) {
    if (need('fein', 'The business FEIN is required (not a Social Security number).')) {
      const f = v.fein.trim()
      if (/^\d{3}-\d{2}-\d{4}$/.test(f)) e.fein = 'That looks like a Social Security number. We never collect it. Enter the 9-digit business FEIN (XX-XXXXXXX).'
      else if (!/^\d{9}$/.test(digits(f)) || /[^\d\- ]/.test(f)) e.fein = 'A FEIN has 9 digits, like 12-3456789.'
    }
  }
  if (need('yearsInBusiness') && !int(v.yearsInBusiness)) e.yearsInBusiness = 'Whole years, for example 7 (type 0 if under a year).'
  if (need('phone') && digits(v.phone).length < 10) e.phone = 'Enter a phone number with area code.'
  if (need('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Enter a valid email address.'
  need('operationsDescription')
  need('streetAddress'); need('city'); need('physicalCounty'); need('physicalState')
  if (need('zip') && !/^\d{5}(-\d{4})?$/.test(v.zip.trim())) e.zip = 'ZIP code, 5 digits.'
  if (v.mailingSameAsPhysical !== 'yes') {
    need('mailingAddress'); need('mailingCity'); need('mailingState')
    if (need('mailingZip') && !/^\d{5}(-\d{4})?$/.test(v.mailingZip.trim())) e.mailingZip = 'ZIP code, 5 digits.'
  }
  if (need('desiredEffectiveDate') && !validIso(v.desiredEffectiveDate)) e.desiredEffectiveDate = 'Pick a valid date.'
  if (need('desiredExpirationDate') && !validIso(v.desiredExpirationDate)) e.desiredExpirationDate = 'Pick a valid date.'
  else if (v.desiredExpirationDate && v.desiredEffectiveDate && v.desiredExpirationDate <= v.desiredEffectiveDate) e.desiredExpirationDate = 'Must be after the start date.'
  need('workStates')
  need('elEachAccident'); need('elDiseasePolicy'); need('elDiseaseEachEmployee')
  if (need('experienceMod') && !/^\d{1,2}(\.\d{1,3})?$/.test(v.experienceMod.trim())) e.experienceMod = 'A number like 0.95 or 1.00 (1.00 if you are not experience rated).'
  need('inspectionContactName')
  if ((v.inspectionContactEmail ?? '').trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.inspectionContactEmail.trim())) e.inspectionContactEmail = 'Enter a valid email address.'
  for (const [box, d] of Object.entries(OTHER_DESC_130)) if (v[box] === 'yes') need(d, 'Name it in a word or two (box fits ' + MAXLEN[d] + ' characters).')
  if (need('inspectionContactPhone') && digits(v.inspectionContactPhone).length < 10) e.inspectionContactPhone = 'Enter a phone number with area code.'
  for (const k of ['accountingContactPhone', 'claimsContactPhone']) if ((v[k] ?? '').trim() && digits(v[k]).length < 10) e[k] = 'Enter a phone number with area code.'
  // owners / officers
  for (let n = 1; n <= c.owners; n++) {
    const k = ownerKeys(n), all = vals(k), on = n === 1 || started(v, all)
    if (!on) continue
    need(k.name); need(k.title); need(k.duties); need(k.inc, 'Choose included or excluded.')
    if (need(k.pct)) { const p = Number(v[k.pct]); if (!/^\d{1,3}(\.\d)?$/.test(v[k.pct].trim()) || p > 100) e[k.pct] = '0 to 100.' }
    if (v[k.dob] && !validIso(v[k.dob], 1900)) e[k.dob] = 'Pick a valid date.'
    if (v[k.inc] === 'Included') { need(k.cls, 'Class code needed for an included owner.'); if (need(k.pay, 'Annual pay needed for an included owner.') && !moneyOk(v[k.pay])) e[k.pay] = 'Dollars, for example $60,000.' }
  }
  // payroll classes
  for (let n = 1; n <= c.classes; n++) {
    const k = classKeys(n), on = n === 1 || started(v, vals(k)); if (!on) continue
    need(k.code); need(k.duties)
    for (const x of [k.ft, k.pt]) if (need(x) && !int(v[x])) e[x] = 'Whole number (0 if none).'
    if (need(k.pay) && !moneyOk(v[k.pay])) e[k.pay] = 'Dollars per year, for example $250,000.'
  }
  // prior coverage and losses
  for (let n = 1; n <= c.prior; n++) {
    const k = priorKeys(n), on = n === 1 || started(v, vals(k)); if (!on) continue
    if (need(k.year) && !/^(19|20)\d{2}$/.test(v[k.year].trim())) e[k.year] = '4-digit year.'
    need(k.carrier)
    for (const x of [k.prem, k.paid, k.res]) if (need(x, 'Type 0 if none.') && !moneyOk(v[x])) e[x] = 'Dollars, for example $4,200 ($0 if none).'
    if (need(k.claims, 'Type 0 if none.') && !int(v[k.claims])) e[k.claims] = 'Whole number (0 if none).'
    if (v[k.mod] && !/^\d{1,2}(\.\d{1,3})?$/.test(v[k.mod].trim())) e[k.mod] = 'A number like 0.95.'
  }
  if (v.yn_travelOutOfState === 'Yes') {
    const st = parseStates(v.travelStates ?? '')
    if (!st.length) e.travelStates = 'List the states, for example NV, UT.'
    else if (st.includes(null)) e.travelStates = 'Use two-letter state codes or full state names, separated by commas.'
    else if (st.length > MAX_TRAVEL_STATES) e.travelStates = `The form has room for ${MAX_TRAVEL_STATES} states. Put the rest in the detail line.`
  }
  if (v.yn_workFromHome === 'Yes' && need('workFromHomeCount', 'How many employees work from home?') && !int(v.workFromHomeCount)) e.workFromHomeCount = 'Whole number, for example 2.'
  for (const q of YN_130) {
    const a = v[`yn_${q.key}`]
    if (a !== 'Yes' && a !== 'No') e[`yn_${q.key}`] = REQ
    else if (a === 'Yes' && !(v[`ynExplain_${q.key}`] ?? '').trim()) e[`ynExplain_${q.key}`] = 'Please explain in a few words.'
  }
  return e
}

/** Exactly what is POSTed (and what the overlay prints). Hidden / inactive / unanswered groups are not carried. */
export function buildPayload130(v: Flat, c: Counts, source: string): Record<string, string> {
  const P: Record<string, string> = {}
  const keep = (k: string) => { P[k] = (v[k] ?? '').trim() }
  for (const k of TOP_KEYS) {
    if (k === 'entityType' || k === 'fein' || k === 'mailingSameAsPhysical' || k.startsWith('mailing')) continue
    keep(k)
  }
  P.entityType = v.entityType === '__other' ? (v.entityOther ?? '').trim() : (v.entityType ?? '')
  if (!isSole(v)) P.fein = fmtFein(v.fein ?? ''); else P.fein = ''
  if (v.mailingSameAsPhysical === 'yes') {
    P.mailingSameAsPhysical = 'yes'; P.mailingAddress = P.streetAddress; P.mailingCity = P.city; P.mailingState = P.physicalState; P.mailingZip = P.zip
  } else { P.mailingSameAsPhysical = 'no'; for (const k of ['mailingAddress', 'mailingCity', 'mailingState', 'mailingZip']) keep(k) }
  for (const cv of COVER_130) P[cv.name] = v[cv.name] === 'yes' ? 'Yes' : ''
  for (const [box, d] of Object.entries(OTHER_DESC_130)) P[d] = v[box] === 'yes' ? (v[d] ?? '').trim() : ''
  P.lossRunsAttached = v.lossRunsAttached === 'Yes' || v.lossRunsAttached === 'No' ? v.lossRunsAttached : ''   // blank is never 'No'
  P.informationPracticesNotice = v.informationPracticesNotice === 'yes' ? 'Yes' : ''   // only ever the applicant's own tick
  if (v.yn_travelOutOfState === 'Yes') P.travelStates = parseStates(v.travelStates ?? '').filter(Boolean).join(', ')
  if (v.yn_workFromHome === 'Yes') P.workFromHomeCount = (v.workFromHomeCount ?? '').trim()
  for (let n = 1; n <= c.owners; n++) { const k = ownerKeys(n); if (n === 1 || started(v, vals(k))) {
    for (const x of vals(k)) keep(x)
    if (v[k.inc] !== 'Included') { P[k.cls] = ''; P[k.pay] = '' }
  } }
  for (let n = 1; n <= c.classes; n++) { const k = classKeys(n); if (n === 1 || started(v, vals(k))) for (const x of vals(k)) keep(x) }
  for (let n = 1; n <= c.prior; n++) { const k = priorKeys(n); if (n === 1 || started(v, vals(k))) for (const x of vals(k)) keep(x) }
  for (const q of YN_130) {
    const a = v[`yn_${q.key}`]
    P[`yn_${q.key}`] = a === 'Yes' || a === 'No' ? a : ''   // blank is never 'No'
    P[`ynExplain_${q.key}`] = a === 'Yes' ? (v[`ynExplain_${q.key}`] ?? '').trim() : ''
  }
  P.name = P.inspectionContactName; P.form_name = FORM_NAME_130; P.source = source
  for (const k of Object.keys(P)) if (P[k] === '' && !TOP_KEYS.includes(k) && !k.startsWith('yn')) delete P[k]
  return P
}
export function hasAnyAnswer(P: Record<string, string>) { return Object.entries(P).some(([k, x]) => x !== '' && !['form_name', 'source', 'mailingSameAsPhysical'].includes(k)) }
