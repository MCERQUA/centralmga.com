"use client"
// "Sign up to sell with Central" (retail agents). Same submit convention as the quote forms:
//   JSON post to LEADS_WEBHOOK_URL (counted as taken only when the answer is {ok:true} and stored !== false),
//   else urlencoded post to the Netlify Forms stub (/__forms.html) with form-name=agent-signup.
// Canonical keys: name, businessName (agency), email, phone. Everything else posts as `_info_<name>`.
// Empty webhook = form disabled, posts nowhere, answers are kept. No sensitive data is asked for.
import React, { useState } from 'react'
import { LEADS_WEBHOOK_URL, NETLIFY_FALLBACK, SITE } from '@/lib/config'

export const AGENT_FORM_NAME = 'agent-signup'
const CONNECTED = LEADS_WEBHOOK_URL !== ''
const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const LINES = ['Commercial general liability', 'Workers compensation', 'Commercial property', 'Commercial auto', 'Umbrella / excess liability', 'Professional liability', 'Excess and surplus lines', 'Surety bonds', 'Other']

type V = { name: string; agency: string; license: string; phone: string; email: string; heard: string; existingMga: string }
const EMPTY: V = { name: '', agency: '', license: '', phone: '', email: '', heard: '', existingMga: '' }

export function AgentSignup() {
  const [v, setV] = useState<V>(EMPTY)
  const [states, setStates] = useState<string[]>([])
  const [lines, setLines] = useState<string[]>([])
  const [touched, setTouched] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'bad'>('idle')
  const [message, setMessage] = useState('')
  const set = (k: keyof V, x: string) => setV(p => ({ ...p, [k]: x }))
  const toggle = (arr: string[], x: string, put: (a: string[]) => void) => put(arr.includes(x) ? arr.filter(y => y !== x) : [...arr, x])

  const errors: Partial<Record<keyof V, string>> = {}
  if (!v.name.trim()) errors.name = 'Name is required'
  if (!v.agency.trim()) errors.agency = 'Agency name is required'
  if (v.phone.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '').length !== 10) errors.phone = 'Enter a 10-digit phone number'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) errors.email = 'Enter a valid email address'
  const err = (k: keyof V) => (touched && errors[k] ? <p className="q-err" role="alert">{errors[k]}</p> : null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (Object.keys(errors).length) { setStatus('bad'); setMessage('Please complete the highlighted fields.'); return }
    if (!CONNECTED) { setStatus('bad'); setMessage('Not connected: your answers are complete and valid, but this build has no leads endpoint, so nothing was sent. Your answers are still here.'); return }
    setBusy(true); setStatus('idle')
    const payload: Record<string, string> = {
      name: v.name.trim(), businessName: v.agency.trim(), email: v.email.trim(), phone: v.phone.trim(),
      _info_agency_npn_or_license: v.license.trim(),
      _info_licensed_states: states.join(', '),
      _info_lines_written: lines.join(', '),
      _info_heard_about_us: v.heard.trim(),
      _info_currently_works_with_an_mga: v.existingMga,
      form_name: AGENT_FORM_NAME, source: SITE, landing_url: window.location.href,
    }
    try {
      let captured = false
      try {
        const res = await fetch(LEADS_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        if (res.ok) { const j = await res.json().catch(() => null); if (j && j.ok === true && j.stored !== false) captured = true }
      } catch { /* fall through to the fallback */ }
      if (!captured) {
        const r = await fetch(NETLIFY_FALLBACK, {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ 'form-name': AGENT_FORM_NAME, ...payload }).toString(),
        })
        if (!r.ok) throw new Error(String(r.status))
      }
      setStatus('ok'); setMessage('Thank you. We received your request to sell with Central MGA.')
      setV(EMPTY); setStates([]); setLines([]); setTouched(false)
    } catch {
      setStatus('bad'); setMessage('Something went wrong and nothing was saved. Your answers are still here. Please try again.')
    } finally { setBusy(false) }
  }

  const txt = (k: keyof V, label: string, o: { type?: string; req?: boolean; ph?: string; ac?: string } = {}) => (
    <div>
      <label className="q-label" htmlFor={`ag-${k}`}>{label}{o.req ? ' *' : ''}</label>
      <input id={`ag-${k}`} name={k} type={o.type ?? 'text'} className="q-input" placeholder={o.ph} autoComplete={o.ac} aria-invalid={touched && !!errors[k]}
        value={v[k]} onChange={e => set(k, e.target.value)} />
      {err(k)}
    </div>
  )

  return (
    <form name={AGENT_FORM_NAME} method="POST" noValidate onSubmit={submit} className="q-form ag-form" data-testid="agent-signup">
      <div style={{ display: 'none' }}><input name="bot-field" tabIndex={-1} autoComplete="off" /></div>
      <section className="q-sec">
        <h3 className="q-h">About you</h3>
        <div className="q-grid">
          {txt('name', 'Your name', { req: true, ac: 'name' })}
          {txt('agency', 'Agency name', { req: true, ac: 'organization' })}
          {txt('phone', 'Phone', { req: true, type: 'tel', ac: 'tel' })}
          {txt('email', 'Email', { req: true, type: 'email', ac: 'email' })}
          {txt('license', 'Agency NPN or license number (optional)')}
        </div>
      </section>
      <section className="q-sec">
        <h3 className="q-h">Where you are licensed</h3>
        <fieldset>
          <legend className="q-legend">Licensed states (optional, pick all that apply)</legend>
          <div className="ag-states">
            {STATES.map(s => (
              <label key={s} className="q-opt"><input type="checkbox" name="licensed_states" value={s} checked={states.includes(s)} onChange={() => toggle(states, s, setStates)} />{s}</label>
            ))}
          </div>
        </fieldset>
      </section>
      <section className="q-sec">
        <h3 className="q-h">What you write</h3>
        <fieldset>
          <legend className="q-legend">Lines you write (optional)</legend>
          <div className="ag-lines">
            {LINES.map(l => (
              <label key={l} className="q-opt"><input type="checkbox" name="lines_written" value={l} checked={lines.includes(l)} onChange={() => toggle(lines, l, setLines)} />{l}</label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="q-legend">Do you currently place business through a managing general agent? (optional)</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            {['Yes', 'No'].map(o => (
              <label key={o} className="q-opt"><input type="radio" name="existingMga" value={o} checked={v.existingMga === o} onChange={() => set('existingMga', o)} />{o}</label>
            ))}
          </div>
        </fieldset>
        {txt('heard', 'How did you hear about us? (optional)')}
      </section>
      <button type="submit" className="q-btn" disabled={busy}>{busy ? 'Sending...' : 'Sign up to sell with Central'}</button>
      {status !== 'idle' && <div className={status === 'ok' ? 'q-ok' : 'q-bad'} role="status">{message}</div>}
      <p className="fine">Do not enter Social Security numbers, tax IDs, bank details or dates of birth. Signing up is a request to talk, not an appointment or approval.</p>
    </form>
  )
}
