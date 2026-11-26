// Compliance360 subcontractor insurance checker: pure logic. Compares the numbers read off a sub's certificate of insurance (COI) against a
// requirements template the user controls. Runs only in the browser; nothing here touches the network or any storage but the caller's.

export type LineKey = 'glOcc' | 'glAgg' | 'auto' | 'umbrella' | 'wcStatutory' | 'wcEl' | 'professional' | 'pollution'
export type EndorsementKey = 'additionalInsured' | 'primaryNonContributory' | 'waiverSubrogation' | 'noticeCancellation'

export type LineMeta = { key: LineKey; label: string; note: string; kind: 'limit' | 'flag' }
export const LINES: LineMeta[] = [
  { key: 'glOcc', label: 'General liability, each occurrence', note: 'Commercial general liability limit per occurrence.', kind: 'limit' },
  { key: 'glAgg', label: 'General liability, general aggregate', note: 'Commercial general liability aggregate limit.', kind: 'limit' },
  { key: 'auto', label: 'Auto liability, combined single limit', note: 'Only if the sub drives on the job.', kind: 'limit' },
  { key: 'umbrella', label: 'Umbrella / excess liability', note: 'Each occurrence limit.', kind: 'limit' },
  { key: 'wcStatutory', label: "Workers' compensation (statutory)", note: 'Statutory coverage shown on the certificate.', kind: 'flag' },
  { key: 'wcEl', label: "Employers' liability, each accident", note: "Part of the workers' compensation policy.", kind: 'limit' },
  { key: 'professional', label: 'Professional liability', note: 'Only for design or consulting work.', kind: 'limit' },
  { key: 'pollution', label: 'Contractors pollution liability', note: 'Only for work with a pollution exposure.', kind: 'limit' },
]

export const ENDORSEMENTS: { key: EndorsementKey; label: string; note: string }[] = [
  { key: 'additionalInsured', label: 'Additional insured', note: 'You are named as an additional insured.' },
  { key: 'primaryNonContributory', label: 'Primary and non-contributory', note: "The sub's policy pays first." },
  { key: 'waiverSubrogation', label: 'Waiver of subrogation', note: "The carrier gives up its right to recover from you." },
  { key: 'noticeCancellation', label: 'Notice of cancellation', note: 'You are told if the policy is cancelled.' },
]

export type LineReq = { required: boolean; min: number }
export type Template = {
  lines: Record<LineKey, LineReq>
  endorsements: Record<EndorsementKey, boolean>
  /** a policy must still run at least this many days past the check date */
  minDaysRemaining: number
}

// Generic starting points only. They are placeholders for the user to edit, not a recommendation and not any carrier's or client's rule.
export const DEFAULT_TEMPLATE: Template = {
  lines: {
    glOcc: { required: true, min: 1000000 },
    glAgg: { required: true, min: 2000000 },
    auto: { required: false, min: 1000000 },
    umbrella: { required: false, min: 1000000 },
    wcStatutory: { required: true, min: 0 },
    wcEl: { required: true, min: 500000 },
    professional: { required: false, min: 1000000 },
    pollution: { required: false, min: 1000000 },
  },
  endorsements: { additionalInsured: true, primaryNonContributory: true, waiverSubrogation: true, noticeCancellation: false },
  minDaysRemaining: 30,
}

export type LineInput = { present: boolean; limit: number; expires: string }
export type CoiInput = {
  lines: Record<LineKey, LineInput>
  endorsements: Record<EndorsementKey, boolean>
}

export const emptyCoi = (): CoiInput => ({
  lines: Object.fromEntries(LINES.map(l => [l.key, { present: false, limit: 0, expires: '' }])) as Record<LineKey, LineInput>,
  endorsements: { additionalInsured: false, primaryNonContributory: false, waiverSubrogation: false, noticeCancellation: false },
})

export type Status = 'pass' | 'fail' | 'na'
export type Row = { key: string; label: string; status: Status; reasons: string[] }
export type Result = { rows: Row[]; fails: number; passes: number; overall: 'pass' | 'fail' | 'empty' }

export const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US')

/** whole days from `today` to the YYYY-MM-DD date `iso`; null when the date is missing or not a real date */
export function daysUntil(iso: string, today: Date): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const y = +m[1], mo = +m[2], d = +m[3]
  const t = Date.UTC(y, mo - 1, d)
  const chk = new Date(t)
  if (chk.getUTCFullYear() !== y || chk.getUTCMonth() !== mo - 1 || chk.getUTCDate() !== d) return null
  const base = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((t - base) / 86400000)
}

export function evaluate(tpl: Template, coi: CoiInput, today: Date): Result {
  const rows: Row[] = []
  for (const l of LINES) {
    const req = tpl.lines[l.key]
    const got = coi.lines[l.key]
    if (!req.required) { rows.push({ key: l.key, label: l.label, status: 'na', reasons: ['Not required by this template.'] }); continue }
    const reasons: string[] = []
    if (!got.present) {
      reasons.push('No policy for this line shown on the certificate.')
    } else {
      if (l.kind === 'limit' && got.limit < req.min) reasons.push(`Limit ${got.limit > 0 ? money(got.limit) : 'not entered'}, needs at least ${money(req.min)}.`)
      const days = daysUntil(got.expires, today)
      if (days === null) reasons.push('Expiration date not entered.')
      else if (days < 0) reasons.push(`Expired ${-days} day${days === -1 ? '' : 's'} ago.`)
      else if (days < tpl.minDaysRemaining) reasons.push(`Expires in ${days} day${days === 1 ? '' : 's'}, needs at least ${tpl.minDaysRemaining} remaining.`)
    }
    rows.push({ key: l.key, label: l.label, status: reasons.length ? 'fail' : 'pass', reasons: reasons.length ? reasons : [l.kind === 'limit' ? `${money(got.limit)} meets ${money(req.min)}.` : 'Shown on the certificate.'] })
  }
  for (const e of ENDORSEMENTS) {
    if (!tpl.endorsements[e.key]) { rows.push({ key: e.key, label: e.label, status: 'na', reasons: ['Not required by this template.'] }); continue }
    const ok = coi.endorsements[e.key]
    rows.push({ key: e.key, label: e.label, status: ok ? 'pass' : 'fail', reasons: [ok ? 'Shown.' : 'Not shown on the certificate or its endorsements.'] })
  }
  const fails = rows.filter(r => r.status === 'fail').length
  const passes = rows.filter(r => r.status === 'pass').length
  return { rows, fails, passes, overall: fails ? 'fail' : passes ? 'pass' : 'empty' }
}

export const TEMPLATE_KEY = 'centralmga.compliance360.template.v1'

/** rebuild a template from stored JSON, keeping only values of the right type and falling back to the defaults for anything else */
export function parseTemplate(raw: string | null): Template {
  const out: Template = JSON.parse(JSON.stringify(DEFAULT_TEMPLATE))
  if (!raw) return out
  try {
    const j = JSON.parse(raw)
    for (const l of LINES) {
      const s = j?.lines?.[l.key]
      if (s && typeof s.required === 'boolean') out.lines[l.key].required = s.required
      if (s && typeof s.min === 'number' && isFinite(s.min) && s.min >= 0) out.lines[l.key].min = s.min
    }
    for (const e of ENDORSEMENTS) if (typeof j?.endorsements?.[e.key] === 'boolean') out.endorsements[e.key] = j.endorsements[e.key]
    if (typeof j?.minDaysRemaining === 'number' && isFinite(j.minDaysRemaining) && j.minDaysRemaining >= 0) out.minDaysRemaining = Math.floor(j.minDaysRemaining)
  } catch { /* corrupt storage: use the defaults */ }
  return out
}
