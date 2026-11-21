"use client"
// /acord-131: umbrella / excess liability questionnaire (left) + the real ACORD 131 pages with a live overlay (right).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AcordPane } from '@/components/AcordPane'
import { computeItems131, widgets131 } from '@/lib/overlay131'
import { LEADS_WEBHOOK_URL, NETLIFY_FALLBACK, ROUTES, SITE, type RouteKey } from '@/lib/config'
import {
  FORM_NAME_131, STORAGE_131, STATES, GL_LIMITS, OCC_CM, DEFENSE, YN_131, MAXLEN, INTERNAL, TERMS, K_OCC, K_TAIL, K_EXCLUDED, K_CLAIMS,
  K_PRODUCT_LOSS, K_WATERCRAFT, termFrom, termTo, validate131, buildPayload131, hasAnyAnswer, money, oneYearAfter, yes, type Flat,
} from '@/lib/acord131Spec'

const CONNECTED = LEADS_WEBHOOK_URL !== ''
const png = (n: number) => `/acord/acord-131-p${String(n).padStart(2, '0')}.png`
const GL = 'underlying general liability policy term'

export function Acord131App() {
  const [v, setV] = useState<Flat>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(1)
  const [focus, setFocus] = useState('')
  const [hint, setHint] = useState('')
  const [status, setStatus] = useState<'idle' | 'ok' | 'bad'>('idle')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const loaded = useRef(false)

  useEffect(() => {
    try { const s = sessionStorage.getItem(STORAGE_131); if (s) setV(JSON.parse(s).v ?? {}) } catch { /* ignore */ }
    loaded.current = true
  }, [])
  useEffect(() => {
    if (!loaded.current) return
    try {
      const keep = Object.fromEntries(Object.entries(v).filter(([, x]) => x !== ''))
      if (Object.keys(keep).length) sessionStorage.setItem(STORAGE_131, JSON.stringify({ v: keep })); else sessionStorage.removeItem(STORAGE_131)
    } catch { /* ignore */ }
  }, [v])

  const errors = useMemo(() => validate131(v), [v])
  const payload = useMemo(() => buildPayload131(v, SITE), [v])
  const items = useMemo(() => computeItems131(payload), [payload])

  const set = useCallback((name: string, val: string) => {
    setStatus('idle')
    setV(prev => {
      const n = { ...prev, [name]: val }
      if (name === 'umbrella effective date' && (!prev['umbrella expiration date'] || prev['umbrella expiration date'] === oneYearAfter(prev['umbrella effective date'] ?? ''))) n['umbrella expiration date'] = oneYearAfter(val)
      for (const t of TERMS) if (name === termFrom(t) && (!prev[termTo(t)] || prev[termTo(t)] === oneYearAfter(prev[termFrom(t)] ?? ''))) n[termTo(t)] = oneYearAfter(val)
      return n
    })
  }, [])
  const touch = (n: string) => setTouched(t => (t[n] ? t : { ...t, [n]: true }))
  const err = (n: string) => (touched[n] ? errors[n] : undefined)

  const onFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const t = e.target as HTMLInputElement
    const name = t.name || t.id?.replace(/^f-/, ''); if (!name) return
    setFocus(name)
    const ws = widgets131(name)
    if (!ws.length) { setHint('This answer is kept with your request but has no printed box on the form pages.'); return }
    setPage(ws[0].page); setHint('')
  }

  const lbl = (name: string, label: string, req = true) => <label className="q-label" htmlFor={`f-${name}`}>{label}{req ? <span aria-hidden className="req"> *</span> : null}</label>
  const help = (h?: string) => (h ? <p className="q-help">{h}</p> : null)
  const E = (name: string) => { const m = err(name); return m ? <p className="q-err" role="alert">{m}</p> : null }
  const txt = (name: string, label: string, o: { req?: boolean; help?: string; type?: string; money?: boolean; ph?: string } = {}) => (
    <div key={name} className="q-fld">
      {lbl(name, label, o.req ?? true)}
      <input id={`f-${name}`} name={name} type={o.type ?? 'text'} className="q-input" value={v[name] ?? ''} maxLength={MAXLEN[name]} placeholder={o.ph}
        inputMode={o.money ? 'decimal' : undefined} autoComplete="off" aria-invalid={!!err(name)}
        onChange={e => set(name, e.target.value)}
        onBlur={e => { touch(name); const x = e.target.value; if (o.money && x.trim()) set(name, money(x)) }} />
      {help(o.help)}{E(name)}
    </div>
  )
  const area = (name: string, label: string, h?: string, rows = 3) => (
    <div key={name} className="q-fld">
      {lbl(name, label, true)}
      <textarea id={`f-${name}`} name={name} className="q-input" rows={rows} maxLength={MAXLEN[name]} value={v[name] ?? ''} onChange={e => set(name, e.target.value)} onBlur={() => touch(name)} aria-invalid={!!err(name)} />
      <p className="q-help">{h ? `${h} ` : ''}{(v[name] ?? '').length} of {MAXLEN[name]} characters.</p>{E(name)}
    </div>
  )
  const sel = (name: string, label: string, opts: [string, string][], o: { help?: string } = {}) => (
    <div key={name} className="q-fld">
      {lbl(name, label, true)}
      <select id={`f-${name}`} name={name} className="q-input" value={v[name] ?? ''} onChange={e => set(name, e.target.value)} onBlur={() => touch(name)} aria-invalid={!!err(name)}>
        <option value="">Choose...</option>{opts.map(([a, b]) => <option key={a} value={a}>{b}</option>)}
      </select>
      {help(o.help)}{E(name)}
    </div>
  )
  const radio = (name: string, q: string, opts: string[] = ['Yes', 'No']) => (
    <fieldset key={name} className="q-yn" onBlur={() => touch(name)}>
      <legend className="q-legend">{q}<span aria-hidden className="req"> *</span></legend>
      <div className="q-yn-row">
        {opts.map(a => <label key={a} className="q-opt"><input type="radio" name={name} value={a} checked={v[name] === a} onChange={() => { set(name, a); touch(name) }} /> {a}</label>)}
      </div>
      {E(name)}
    </fieldset>
  )
  const term = (t: string, label: string) => (
    <div key={t} className="q-grid">
      {txt(termFrom(t), `${label} policy starts`, { type: 'date' })}
      {txt(termTo(t), `${label} policy ends`, { type: 'date', help: 'Filled in as one year after the start. Change it if needed.' })}
    </div>
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const all = Object.fromEntries(Object.keys(errors).map(k => [k, true]))
    if (Object.keys(all).length) {
      setTouched(t => ({ ...t, ...all })); setStatus('bad'); setMessage(`Please complete the ${Object.keys(errors).length} highlighted answer${Object.keys(errors).length === 1 ? '' : 's'}.`)
      const first = Object.keys(errors)[0]; document.getElementById(`f-${first}`)?.focus?.()
      return
    }
    if (!CONNECTED) { setStatus('bad'); setMessage('Not connected: your answers are complete and valid, but this build has no leads endpoint, so nothing was sent.'); return }
    setBusy(true); setStatus('idle')
    try {
      const body = buildPayload131(v, SITE)
      const urlenc = (to: string) => fetch(to, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ 'form-name': FORM_NAME_131, ...body }).toString() })
      let captured = false
      try {
        const res = await fetch(LEADS_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (res.ok) { const j = await res.json().catch(() => null); if (j && j.ok === true && j.stored !== false) captured = true } // a bare 2xx is not acceptance
      } catch { /* fall through to the Netlify fallback */ }
      if (!captured) { const r = await urlenc(NETLIFY_FALLBACK); if (!r.ok) throw new Error(String(r.status)) }
      setStatus('ok'); setMessage('Thank you. We received your umbrella quote request and will be in touch within 24 hours.')
      setV({}); setTouched({})
    } catch { setStatus('bad'); setMessage('Something went wrong. Please call us or try again.') } finally { setBusy(false) }
  }

  const secs = Array.from(new Set(YN_131.map(q => q.sec)))

  return (
    <div className="split">
      <header className="topbar">
        <Link href="/" className="brand"><b>Central MGA</b><span>ACORD applications, in plain language</span></Link>
        <nav aria-label="Applications">
          {(Object.keys(ROUTES) as RouteKey[]).map(k => <Link key={k} href={`/${ROUTES[k].slug}`}>{ROUTES[k].title}</Link>)}
          <Link href="/acord-130">ACORD 130</Link>
          <Link href="/acord-131" className="on" aria-current="page">ACORD 131</Link>
        </nav>
      </header>
      <div className="cols">
        <section className="left" onFocusCapture={onFocus} aria-label="Questionnaire">
          <div className="lead">
            <h1>ACORD 131: Umbrella / excess liability application</h1>
            <p>Answer in plain language on this side. The matching page of the real ACORD 131 fills in on the right as you type. Fields marked * are needed to complete the application.
              We never ask for signatures, Social Security numbers or policy numbers (insurance company names only).</p>
            {!CONNECTED && <aside className="notconn" role="status" data-testid="not-connected"><b>Not connected.</b> This build has no leads endpoint configured, so pressing the button validates your answers but sends nothing.</aside>}
          </div>
          <form name={FORM_NAME_131} method="POST" data-netlify="true" data-netlify-honeypot="bot-field" noValidate onSubmit={submit} className="q-form">
            <input type="hidden" name="form-name" value={FORM_NAME_131} />
            <div style={{ display: 'none' }}><input name="bot-field" tabIndex={-1} autoComplete="off" /></div>

            <section className="q-sec"><h3 className="q-h">Your business</h3>
              <div className="q-grid">
                {txt('legal entity name', 'Legal name of the business (first named insured)')}
                {txt(INTERNAL.street, 'Business street address')}
                {txt(INTERNAL.city, 'City')}
                {sel(INTERNAL.state, 'State', STATES.map(s => [s, s]))}
                {txt(INTERNAL.zip, 'ZIP code')}
              </div>
              <div className="q-grid">
                {txt('name', 'Who should we contact about this application?')}
                {txt('phone', 'Phone', { type: 'tel' })}
                {txt('email', 'Email', { type: 'email' })}
              </div>
              {area('description of operations', 'In a sentence or two, what does your company do?', 'The form box fits about this much.', 3)}
              {txt('names and locations of any subsidiary companies', 'Any subsidiary companies? Names and locations', { req: false, help: 'Leave blank if there are none.' })}
              <div className="q-grid">
                {txt('annual payroll', 'Annual payroll', { money: true, ph: '$1,450,000' })}
                {txt('annual gross sales', 'Annual gross sales', { money: true, ph: '$6,200,000' })}
                {txt('foreign gross sales', 'Annual gross sales outside the U.S.', { money: true, help: 'Type $0 if none.' })}
                {txt('number of employees', 'Number of employees')}
              </div>
              {area('describe the typical jobs you perform', 'Describe the typical jobs you perform', 'The form box is on page 2.', 3)}
            </section>

            <section className="q-sec"><h3 className="q-h">The umbrella you want</h3>
              <div className="q-grid">
                {sel('new or renewal', 'Is this a new umbrella or a renewal?', [['New', 'New'], ['Renewal', 'Renewal']])}
                {txt('umbrella effective date', 'Start date', { type: 'date' })}
                {txt('umbrella expiration date', 'End date', { type: 'date', help: 'Filled in as one year after the start date. Change it if needed.' })}
              </div>
              <div className="q-grid">
                {txt('umbrella limit requested - each occurrence', 'Limit wanted, each occurrence', { money: true, ph: '$5,000,000' })}
                {txt('umbrella limit requested - aggregate', 'Limit wanted, aggregate', { money: true, ph: '$5,000,000' })}
                {txt('self-insured retention requested', 'Retention you will pay before the umbrella responds', { money: true, help: 'Retained limit. Type $0 if none.' })}
              </div>
              {radio('do you want first dollar defense', 'Do you want first dollar defense (the umbrella pays defense costs from the first dollar)?')}
              {sel('billing preference', 'How do you want to be billed?', [['Agency bill', 'Agency bill (through your agent)'], ['Direct bill', 'Direct bill (from the insurance company)']])}
            </section>

            <section className="q-sec"><h3 className="q-h">Your current underlying policies</h3>
              <p className="q-help">The umbrella sits on top of these. Insurance company names only, no policy numbers.</p>
              <h4 className="q-h4">Business auto</h4>
              {txt('underlying auto carrier and policy number', 'Insurance company', { help: 'Company name only.' })}
              {term('underlying auto policy term', 'Auto')}
              {txt('underlying auto combined single limit', 'Combined single limit', { money: true, ph: '$1,000,000' })}

              <h4 className="q-h4">General liability</h4>
              {txt('underlying general liability carrier and policy number', 'Insurance company', { help: 'Company name only.' })}
              {term(GL, 'General liability')}
              {sel(K_OCC, 'Is the general liability policy written on an occurrence or claims-made basis?', OCC_CM.map(x => [x, x]))}
              {v[K_OCC] === 'Claims made' && (
                <div className="q-detail" style={{ display: 'block' }}>
                  <div className="q-grid">
                    {txt('retroactive date of the current underlying GL policy', 'Retroactive date of this general liability policy', { type: 'date' })}
                    {txt('date you entered uninterrupted claims made coverage', 'Date you entered uninterrupted claims-made coverage', { type: 'date' })}
                    {txt('retroactive date you are proposing for the umbrella', 'Retroactive date you want on the umbrella', { type: 'date' })}
                  </div>
                  {radio(K_TAIL, 'Was "tail" coverage bought for any previous primary or excess policy?')}
                </div>
              )}
              <div className="q-grid">{GL_LIMITS.map(g => txt(g.key, g.label, { money: true, ph: '$1,000,000' }))}</div>
              {sel('are defense costs within the aggregate, a separate limit, or unlimited', 'Are defense costs inside the aggregate limit, a separate limit, or unlimited?', DEFENSE.map(x => [x, x]))}
              {radio(K_EXCLUDED, 'Has any product, work, accident or location been excluded, uninsured or self-insured under previous coverage?')}

              <h4 className="q-h4">Workers compensation (employers liability)</h4>
              {txt('underlying employers liability carrier and policy number', 'Insurance company', { help: 'Company name only.' })}
              {term('underlying employers liability policy term', 'Employers liability')}
              <div className="q-grid">
                {txt('underlying employers liability each accident limit', 'Each accident limit', { money: true, ph: '$1,000,000' })}
                {txt('underlying employers liability disease each employee limit', 'Disease, each employee limit', { money: true, ph: '$1,000,000' })}
              </div>
            </section>

            <section className="q-sec"><h3 className="q-h">Past claims</h3>
              {radio(INTERNAL.anyClaims, 'In the past 5 years, any liability claims over $10,000, or events that could lead to one (insured or not)?')}
              {v[INTERNAL.anyClaims] === 'Yes' && area(K_CLAIMS, 'Tell us about each one', 'Date, coverage, what happened, amount paid, amount still open.', 4)}
            </section>

            <section className="q-sec"><h3 className="q-h">Yes-or-no questions</h3>
              <p className="q-help">Every question needs an answer. A blank is never read as No.</p>
              {secs.map(s => (
                <div key={s} className="q-sec-in">
                  <h4 className="q-h4">{s}</h4>
                  {YN_131.filter(q => q.sec === s).map(q => (
                    <React.Fragment key={q.key}>
                      {radio(q.key, q.q)}
                      {q.key === K_PRODUCT_LOSS && yes(v, K_PRODUCT_LOSS) && <div className="q-detail" style={{ display: 'block' }}>{area('describe the product liability loss', 'Describe the loss', 'Date, what happened, amount.', 3)}</div>}
                      {q.key === K_WATERCRAFT && yes(v, K_WATERCRAFT) && <div className="q-detail" style={{ display: 'block' }}>{txt('watercraft owned - number, length and horsepower', 'How many, how long, how much horsepower', { ph: '2 boats, 24 ft, 150 hp' })}</div>}
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </section>

            {status !== 'idle' && <p className={status === 'ok' ? 'q-ok' : 'q-bad'} role="status" data-testid="submit-status">{message}</p>}
            <button type="submit" className="q-btn" disabled={busy}>{busy ? 'Sending...' : 'Request my umbrella quote'}</button>
          </form>
        </section>
        <section className="right" aria-label="ACORD 131 form pages">
          <AcordPane pages={[1, 2]} page={page} onPage={setPage} items={items} focusField={focus} title="ACORD 131" png={png} widgetsOf={widgets131} totalPages={2} />
          {hint && <p className="hint" role="status">{hint}</p>}
          <p className="fine">Your typed answers are drawn over the blank form for preview. Signature, signed date and policy numbers are never filled in here, and the producer, rating and company blocks stay blank.</p>
          {!hasAnyAnswer(payload) && null}
        </section>
      </div>
    </div>
  )
}
