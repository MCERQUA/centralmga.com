// Compliance360 saved subcontractors: pure logic for the browser-only records, expiry status, calendar files and the COI request text.
// Nothing here touches the network. The only storage is the caller's localStorage and files the user downloads or picks themselves.
import { ENDORSEMENTS, LINES, daysUntil, money, type CoiInput, type EndorsementKey, type LineKey, type Template } from '@/lib/compliance360'

export const SUBS_KEY = 'centralmga.compliance360.subs.v1'
export const SOON_DAYS = 30
const MAX_SUBS = 500

export type SubRecord = {
  id: string
  name: string
  savedAt: string // ISO timestamp
  overall: 'pass' | 'fail' | 'empty' // result at the time it was saved
  coi: CoiInput
}

export type ExpiryStatus = 'ok' | 'soon' | 'expired' | 'none'
export const statusOf = (days: number | null): ExpiryStatus => (days === null ? 'none' : days < 0 ? 'expired' : days <= SOON_DAYS ? 'soon' : 'ok')
export const STATUS_LABEL: Record<ExpiryStatus, string> = { ok: 'OK', soon: 'Expires within 30 days', expired: 'Expired', none: 'No date' }

export type PolicyExpiry = { key: LineKey; label: string; expires: string; days: number | null; status: ExpiryStatus }

/** every policy marked present on the record, with its days left; sorted soonest first, undated last */
export function policiesOf(coi: CoiInput, today: Date): PolicyExpiry[] {
  const rows = LINES.filter(l => coi.lines[l.key].present).map(l => {
    const expires = coi.lines[l.key].expires
    const days = daysUntil(expires, today)
    return { key: l.key, label: l.label, expires, days, status: statusOf(days) }
  })
  return rows.sort((a, b) => (a.days === null ? 1e9 : a.days) - (b.days === null ? 1e9 : b.days))
}

/** the subs list sorted by the soonest expiring policy; subs with no dated policy sort last */
export function sortSubs(subs: SubRecord[], today: Date): { sub: SubRecord; worst: ExpiryStatus; next: PolicyExpiry | null }[] {
  const rank: Record<ExpiryStatus, number> = { expired: 0, soon: 1, ok: 2, none: 3 }
  const rows = subs.map(sub => {
    const dated = policiesOf(sub.coi, today).filter(p => p.days !== null)
    const next = dated[0] ?? null
    return { sub, worst: (next ? next.status : 'none') as ExpiryStatus, next }
  })
  return rows.sort((a, b) => rank[a.worst] - rank[b.worst] || (a.next?.days ?? 1e9) - (b.next?.days ?? 1e9) || a.sub.name.localeCompare(b.sub.name))
}

const isIso = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

function cleanCoi(j: unknown): CoiInput | null {
  const o = j as { lines?: Record<string, { present?: unknown; limit?: unknown; expires?: unknown }>; endorsements?: Record<string, unknown> } | null
  if (!o || typeof o !== 'object' || !o.lines || typeof o.lines !== 'object') return null
  const lines = {} as CoiInput['lines']
  for (const l of LINES) {
    const s = o.lines[l.key]
    const limit = typeof s?.limit === 'number' && isFinite(s.limit) && s.limit >= 0 ? s.limit : 0
    lines[l.key] = { present: s?.present === true, limit, expires: isIso(s?.expires) ? (s.expires as string) : '' }
  }
  const endorsements = {} as Record<EndorsementKey, boolean>
  for (const e of ENDORSEMENTS) endorsements[e.key] = o.endorsements?.[e.key] === true
  return { lines, endorsements }
}

/** rebuild the saved list from JSON text, keeping only well-formed records; anything else is dropped */
export function parseSubs(raw: string | null): SubRecord[] {
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    const list = Array.isArray(arr) ? arr : Array.isArray(arr?.subs) ? arr.subs : []
    const out: SubRecord[] = []
    const seen = new Set<string>()
    for (const r of list) {
      const coi = cleanCoi(r?.coi)
      if (!coi || typeof r?.name !== 'string' || !r.name.trim()) continue
      let id = typeof r.id === 'string' && /^[\w-]{1,64}$/.test(r.id) ? r.id : newId()
      if (seen.has(id)) id = newId()
      seen.add(id)
      const overall = r.overall === 'pass' || r.overall === 'fail' ? r.overall : 'empty'
      out.push({ id, name: r.name.trim().slice(0, 120), savedAt: typeof r.savedAt === 'string' ? r.savedAt.slice(0, 40) : '', overall, coi })
      if (out.length >= MAX_SUBS) break
    }
    return out
  } catch { return [] }
}

export const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

export const exportJson = (subs: SubRecord[]) => JSON.stringify({ kind: 'compliance360-subs', version: 1, subs }, null, 2)

/** merge imported records into the list; an id already present is replaced, so importing your own export twice does not duplicate */
export function mergeSubs(cur: SubRecord[], incoming: SubRecord[]): SubRecord[] {
  const map = new Map(cur.map(s => [s.id, s]))
  for (const s of incoming) map.set(s.id, s)
  return Array.from(map.values()).slice(0, MAX_SUBS)
}

const icsEsc = (t: string) => t.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n')
const compact = (iso: string) => iso.replace(/-/g, '')

/** a one-event calendar file for a policy expiry: an all-day event with a 30-day and a 7-day reminder, no email involved */
export function policyIcs(subName: string, p: PolicyExpiry, now: Date): string {
  if (p.days === null) return ''
  const [y, m, d] = p.expires.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + 1))
  const end = `${next.getUTCFullYear()}${String(next.getUTCMonth() + 1).padStart(2, '0')}${String(next.getUTCDate()).padStart(2, '0')}`
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const summary = `${subName}: ${p.label} policy expires`
  const alarm = (trig: string, text: string) => ['BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(text)}`, `TRIGGER:${trig}`, 'END:VALARM']
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Central MGA//Compliance360//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:${p.key}-${compact(p.expires)}-${stamp}@centralmga.com-compliance360`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(p.expires)}`, `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:${icsEsc(summary)}`,
    `DESCRIPTION:${icsEsc(`Ask ${subName} for a fresh certificate of insurance before this policy lapses.`)}`,
    ...alarm('-P30D', `${summary} in 30 days`), ...alarm('-P7D', `${summary} in 7 days`),
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n') + '\r\n'
}

/** ready-to-send plain text asking a sub for a certificate that meets the user's template */
export function requestMessage(subName: string, tpl: Template, yourName: string): string {
  const lines = LINES.filter(l => tpl.lines[l.key].required).map(l => {
    const r = tpl.lines[l.key]
    return `- ${l.label}${l.kind === 'limit' ? `: at least ${money(r.min)}` : ''}`
  })
  const ends = ENDORSEMENTS.filter(e => tpl.endorsements[e.key]).map(e => `- ${e.label}`)
  return [
    `Hello${subName.trim() ? ' ' + subName.trim() : ''},`,
    '',
    'Please send me a current certificate of insurance (COI) before work starts. I need it to show the following.',
    '',
    lines.length ? 'Coverage and limits:' : 'Coverage: (none selected yet)', ...lines,
    ...(ends.length ? ['', 'Endorsements (please send the endorsement pages as well):', ...ends] : []),
    '',
    `Each policy should still be in force for at least ${tpl.minDaysRemaining} days after today.`,
    '',
    'Please reply with the certificate as a PDF.',
    '',
    'Thank you,',
    yourName.trim(),
  ].join('\n')
}

export const mailtoFor = (subject: string, body: string) => `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
