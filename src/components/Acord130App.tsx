"use client"
// /acord-130: workers compensation questionnaire (left) + the real ACORD 130 pages with a live overlay (right).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { AcordPane } from '@/components/AcordPane'
import { computeItems130, widgets130 } from '@/lib/overlay130'
import { LEADS_WEBHOOK_URL, NETLIFY_FALLBACK, ROUTES, SITE, type RouteKey } from '@/lib/config'
import {
  FORM_NAME_130, STORAGE_130, STATES, ENTITY_130, TITLES, EL_LIMITS, YN_130, COVER_130, MAXLEN, MAX_OWNERS, MAX_CLASSES, MAX_PRIOR,
  ownerKeys, classKeys, priorKeys, validate130, buildPayload130, hasAnyAnswer, isSole, money, fmtFein, oneYearAfter, type Flat,
} from '@/lib/acord130Spec'

const CONNECTED = LEADS_WEBHOOK_URL !== ''
const png = (n: number) => `/acord/acord-130-p${String(n).padStart(2, '0')}.png`
const NOSTORE = /^(fein|ownerDateOfBirth\d*)$/ // sensitive-ish values are never kept in sessionStorage

export function Acord130App() {
  const [v, setV] = useState<Flat>({})
  const [counts, setCounts] = useState({ owners: 1, classes: 1, prior: 1 })
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [page, setPage] = useState(1)
  const [focus, setFocus] = useState('')
  const [hint, setHint] = useState('')
  const [status, setStatus] = useState<'idle' | 'ok' | 'bad'>('idle')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const loaded = useRef(false)

  useEffect(() => {
    try { const s = sessionStorage.getItem(STORAGE_130); if (s) { const d = JSON.parse(s); setV(d.v ?? {}); setCounts(d.counts ?? { owners: 1, classes: 1, prior: 1 }) } } catch { /* ignore */ }
    loaded.current = true
  }, [])
  useEffect(() => {
    if (!loaded.current) return
    try {
      const keep = Object.fromEntries(Object.entries(v).filter(([k, x]) => x !== '' && !NOSTORE.test(k)))
      if (Object.keys(keep).length) sessionStorage.setItem(STORAGE_130, JSON.stringify({ v: keep, counts })); else sessionStorage.removeItem(STORAGE_130)
    } catch { /* ignore */ }
  }, [v, counts])

  const errors = useMemo(() => validate130(v, counts), [v, counts])
  const payload = useMemo(() => buildPayload130(v, counts, SITE), [v, counts])
  const items = useMemo(() => computeItems130(payload), [payload])

  const set = useCallback((name: string, val: string) => {
    setStatus('idle')
    setV(prev => {
      const n = { ...prev, [name]: val }
      if (name === 'physicalState' && (!prev.workStates || prev.workStates === prev.physicalState)) n.workStates = val
      if (name === 'desiredEffectiveDate' && (!prev.desiredExpirationDate || prev.desiredExpirationDate === oneYearAfter(prev.desiredEffectiveDate ?? ''))) n.desiredExpirationDate = oneYearAfter(val)
      return n
    })
  }, [])
  const touch = (n: string) => setTouched(t => (t[n] ? t : { ...t, [n]: true }))
  const err = (n: string) => (touched[n] ? errors[n] : undefined)

  const onFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const t = e.target as HTMLInputElement
    const name = t.name || t.id?.replace(/^f-/, ''); if (!name) return
    setFocus(name)
    const ws = widgets130(name)
    if (!ws.length) { setHint('This answer is kept with your request but has no printed box on the form pages.'); return }
    setPage(ws[0].page); setHint('')
  }

  // ---- field renderers
  const lbl = (name: string, label: string, req?: boolean) => <label className="q-label" htmlFor={`f-${name}`}>{label}{req ? <span aria-hidden className="req"> *</span> : null}</label>
  const help = (h?: string) => (h ? <p className="q-help">{h}</p> : null)
  const E = (name: string) => { const m = err(name); return m ? <p className="q-err" role="alert">{m}</p> : null }
  const txt = (name: string, label: string, o: { req?: boolean; help?: string; type?: string; fmt?: 'money' | 'fein' | 'digits'; ph?: string; max?: number } = {}) => (
    <div key={name} className="q-fld">
      {lbl(name, label, o.req)}
      <input id={`f-${name}`} name={name} type={o.type ?? 'text'} className="q-input" value={v[name] ?? ''} maxLength={o.max ?? MAXLEN[name]} placeholder={o.ph}
        inputMode={o.fmt === 'money' || o.fmt === 'digits' ? 'decimal' : undefined} autoComplete="off" aria-invalid={!!err(name)}
        onChange={e => set(name, e.target.value)}
        onBlur={e => { touch(name); const x = e.target.value; if (o.fmt === 'money' && x.trim()) set(name, money(x)); if (o.fmt === 'fein' && x.trim()) set(name, fmtFein(x)) }} />
      {help(o.help)}{E(name)}
    </div>
  )
  const sel = (name: string, label: string, opts: [string, string][], o: { req?: boolean; help?: string; blank?: string } = {}) => (
    <div key={name} className="q-fld">
      {lbl(name, label, o.req)}
      <select id={`f-${name}`} name={name} className="q-input" value={v[name] ?? ''} onChange={e => set(name, e.target.value)} onBlur={() => touch(name)} aria-invalid={!!err(name)}>
        <option value="">{o.blank ?? 'Choose...'}</option>{opts.map(([a, b]) => <option key={a} value={a}>{b}</option>)}
      </select>
      {help(o.help)}{E(name)}
    </div>
  )
  const stSel = (name: string, label: string, req = true, h?: string) => sel(name, label, STATES.map(s => [s, s]), { req, help: h })
  const chk = (name: string, label: string) => (
    <label key={name} className="q-opt"><input type="checkbox" id={`f-${name}`} name={name} checked={(v[name] ?? '') === 'yes'} onChange={e => set(name, e.target.checked ? 'yes' : '')} /> {label}</label>
  )
  const yn = (key: string, q: string, hintTxt?: string) => {
    const n = `yn_${key}`, x = `ynExplain_${key}`
    return (
      <fieldset key={n} className="q-yn" onBlur={() => touch(n)}>
        <legend className="q-legend">{q}<span aria-hidden className="req"> *</span></legend>
        <div className="q-yn-row">
          {['Yes', 'No'].map(a => <label key={a} className="q-opt"><input type="radio" name={n} value={a} checked={v[n] === a} onChange={() => { set(n, a); touch(n) }} /> {a}</label>)}
        </div>
        {E(n)}
        {v[n] === 'Yes' && (
          <div className="q-detail" style={{ display: 'block' }}>
            {lbl(x, hintTxt ?? 'Tell us a little more', true)}
            <input id={`f-${x}`} name={x} className="q-input" maxLength={MAXLEN.explain} value={v[x] ?? ''} onChange={e => set(x, e.target.value)} onBlur={() => touch(x)} placeholder="One line, up to 136 characters" />
            {E(x)}
          </div>
        )}
      </fieldset>
    )
  }

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
      const body = buildPayload130(v, counts, SITE)
      const urlenc = (to: string) => fetch(to, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ 'form-name': FORM_NAME_130, ...body }).toString() })
      let captured = false
      try {
        const res = await fetch(LEADS_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        if (res.ok) { const j = await res.json().catch(() => null); if (j && j.ok === true && j.stored !== false) captured = true } // a bare 2xx is not acceptance
      } catch { /* fall through to the Netlify fallback */ }
      if (!captured) { const r = await urlenc(NETLIFY_FALLBACK); if (!r.ok) throw new Error(String(r.status)) }
      setStatus('ok'); setMessage('Thank you. We received your workers compensation quote request and will be in touch within 24 hours.')
      setV({}); setCounts({ owners: 1, classes: 1, prior: 1 }); setTouched({})
    } catch { setStatus('bad'); setMessage('Something went wrong. Please call us or try again.') } finally { setBusy(false) }
  }

  const ownerRow = (n: number) => {
    const k = ownerKeys(n), inc = v[k.inc] === 'Included', r = n === 1
    return (
      <div key={n} className="q-row">
        <h4 className="q-h4">Owner or officer {n}</h4>
        <div className="q-grid">
          {txt(k.name, 'Full name', { req: r || undefined })}
          {sel(k.title, 'Role', TITLES.map(t => [t, t]), { req: r || undefined })}
          {txt(k.pct, 'Percent of the company they own', { req: r || undefined, ph: 'e.g. 60' })}
          {txt(k.duties, 'What they do (short)', { req: r || undefined, ph: 'e.g. Field crew lead' })}
          {sel(k.inc, 'Covered by this policy?', [['Included', 'Included (covered)'], ['Excluded', 'Excluded (not covered)']], { req: r || undefined, help: 'Owners can choose to be left off the policy where the state allows it.' })}
          {txt(k.dob, 'Date of birth (optional)', { type: 'date' })}
        </div>
        {inc && <div className="q-detail">
          {txt(k.cls, 'Class code for this owner', { req: true, help: 'The 4-digit code for the work they do (for example 5645). Your current policy or audit shows it.' })}
          {txt(k.pay, 'Yearly pay counted for this owner', { req: true, fmt: 'money', ph: '$60,000' })}
        </div>}
      </div>
    )
  }
  const classRow = (n: number) => {
    const k = classKeys(n), r = n === 1
    return (
      <div key={n} className="q-row">
        <h4 className="q-h4">Type of work {n}</h4>
        <div className="q-grid">
          {txt(k.code, 'Class code', { req: r || undefined, help: 'The 4-digit workers comp code for this work (on your current policy or audit).' })}
          {txt(k.duties, 'What these employees do', { req: r || undefined })}
          {txt(k.ft, 'Full-time employees', { req: r || undefined, fmt: 'digits' })}
          {txt(k.pt, 'Part-time employees', { req: r || undefined, fmt: 'digits' })}
          {txt(k.pay, 'Total yearly payroll for this work', { req: r || undefined, fmt: 'money', ph: '$250,000' })}
        </div>
      </div>
    )
  }
  const priorRow = (n: number) => {
    const k = priorKeys(n), r = n === 1
    return (
      <div key={n} className="q-row">
        <h4 className="q-h4">{n === 1 ? 'Most recent policy year' : `Policy year ${n} back`}</h4>
        <div className="q-grid">
          {txt(k.year, 'Year the policy started', { req: r || undefined, ph: '2026' })}
          {txt(k.carrier, 'Insurance company', { req: r || undefined })}
          {txt(k.prem, 'Premium paid for the year', { req: r || undefined, fmt: 'money' })}
          {txt(k.mod, 'Experience mod used (optional)', { ph: '0.95' })}
          {txt(k.claims, 'Number of claims', { req: r || undefined, fmt: 'digits', help: 'Type 0 if there were none.' })}
          {txt(k.paid, 'Total paid on claims', { req: r || undefined, fmt: 'money', help: 'Type 0 if none.' })}
          {txt(k.res, 'Still reserved on open claims', { req: r || undefined, fmt: 'money', help: 'Type 0 if none.' })}
        </div>
        <button type="button" className="underline" onClick={() => { set(k.claims, '0'); set(k.paid, '$0'); set(k.res, '$0') }}>No claims that year: fill in zeros</button>
      </div>
    )
  }
  const rows = (n: number, count: number, key: 'owners' | 'classes' | 'prior', max: number, render: (i: number) => React.ReactNode, add: string) => (
    <>
      {Array.from({ length: count }, (_, i) => render(i + 1))}
      {count < max && <button type="button" className="q-add" onClick={() => setCounts(c => ({ ...c, [key]: c[key] + 1 }))}>{add}</button>}
      {n > 1 && null}
    </>
  )

  return (
    <div className="split">
      <header className="topbar">
        <Link href="/" className="brand"><b>Central MGA</b><span>ACORD applications, in plain language</span></Link>
        <nav aria-label="Applications">
          {(Object.keys(ROUTES) as RouteKey[]).map(k => <Link key={k} href={`/${ROUTES[k].slug}`}>{ROUTES[k].title}</Link>)}
          <Link href="/acord-130" className="on" aria-current="page">ACORD 130</Link>
          <Link href="/acord-131">ACORD 131</Link>
        </nav>
      </header>
      <div className="cols">
        <section className="left" onFocusCapture={onFocus} aria-label="Questionnaire">
          <div className="lead">
            <h1>ACORD 130: Workers compensation application</h1>
            <p>Answer in plain language on this side. The matching page of the real ACORD 130 fills in on the right as you type. Fields marked * are needed to complete the application.
              We never ask for signatures, Social Security numbers or policy numbers.</p>
            {!CONNECTED && <aside className="notconn" role="status" data-testid="not-connected"><b>Not connected.</b> This build has no leads endpoint configured, so pressing the button validates your answers but sends nothing.</aside>}
          </div>
          <form name={FORM_NAME_130} method="POST" data-netlify="true" data-netlify-honeypot="bot-field" noValidate onSubmit={submit} className="q-form">
            <input type="hidden" name="form-name" value={FORM_NAME_130} />
            <div style={{ display: 'none' }}><input name="bot-field" tabIndex={-1} autoComplete="off" /></div>

            <section className="q-sec"><h3 className="q-h">Your business</h3>
              <div className="q-grid">
                {txt('businessName', 'Business name as it should appear on the policy', { req: true })}
                {sel('entityType', 'What kind of business is it?', ENTITY_130, { req: true })}
                {v.entityType === '__other' && txt('entityOther', 'Describe it (21 characters max)', { req: true })}
                {!isSole(v) && v.entityType && txt('fein', 'Business FEIN (federal tax ID)', { req: true, fmt: 'fein', ph: '12-3456789', help: 'The 9-digit number the IRS gave the business. Never a Social Security number.' })}
                {txt('yearsInBusiness', 'Years in business', { req: true, fmt: 'digits', help: 'Type 0 if under a year.' })}
                {txt('phone', 'Business phone', { req: true, type: 'tel' })}
                {txt('secondaryPhone', 'Second phone (optional)', { type: 'tel' })}
                {txt('email', 'Business email', { req: true, type: 'email' })}
                {txt('websiteUrl', 'Website (optional)')}
              </div>
              <div className="q-fld">
                {lbl('operationsDescription', 'In a sentence or two, what does your company do?', true)}
                <textarea id="f-operationsDescription" name="operationsDescription" className="q-input" rows={3} maxLength={MAXLEN.operationsDescription} value={v.operationsDescription ?? ''}
                  onChange={e => set('operationsDescription', e.target.value)} onBlur={() => touch('operationsDescription')} />
                <p className="q-help">{(v.operationsDescription ?? '').length} of {MAXLEN.operationsDescription} characters (the form box fits this much).</p>{E('operationsDescription')}
              </div>
              <details className="q-more"><summary>Codes you may know (optional)</summary>
                <div className="q-grid">
                  {txt('sicCode', 'SIC code')}{txt('naicsCode', 'NAICS code')}{txt('ncciRiskId', 'NCCI risk ID')}{txt('ratingBureauId', 'State rating bureau ID')}
                </div>
              </details>
            </section>

            <section className="q-sec"><h3 className="q-h">Where you work and where we mail</h3>
              <div className="q-grid">
                {txt('streetAddress', 'Business street address', { req: true })}
                {txt('city', 'City', { req: true })}
                {txt('physicalCounty', 'County', { req: true })}
                {stSel('physicalState', 'State')}
                {txt('zip', 'ZIP code', { req: true })}
              </div>
              {chk('mailingSameAsPhysical', 'Our mailing address is the same as the street address')}
              {v.mailingSameAsPhysical !== 'yes' && (
                <div className="q-grid">
                  {txt('mailingAddress', 'Mailing address', { req: true })}{txt('mailingCity', 'Mailing city', { req: true })}
                  {stSel('mailingState', 'Mailing state')}{txt('mailingZip', 'Mailing ZIP code', { req: true })}
                </div>
              )}
              <div className="q-grid">
                {txt('inspectionContactName', 'Who should we call to set up a site visit?', { req: true })}
                {txt('inspectionContactPhone', 'Their phone', { req: true, type: 'tel' })}
                {txt('accountingContactName', 'Billing / audit contact (optional)')}{txt('accountingContactPhone', 'Their phone (optional)', { type: 'tel' })}
                {txt('claimsContactName', 'Claims contact (optional)')}{txt('claimsContactPhone', 'Their phone (optional)', { type: 'tel' })}
              </div>
            </section>

            <section className="q-sec"><h3 className="q-h">The coverage you want</h3>
              <div className="q-grid">
                {txt('desiredEffectiveDate', 'Start date', { req: true, type: 'date' })}
                {txt('desiredExpirationDate', 'End date', { req: true, type: 'date', help: 'Filled in as one year after the start date. Change it if needed.' })}
                {stSel('workStates', 'State where your employees work', true, 'One state for now. Work in several states? Mention it to your agent; each state needs its own rating page.')}
              </div>
              <p className="q-legend">Employers liability limits (what the policy pays if an employee sues you)</p>
              <div className="q-grid">
                {sel('elEachAccident', 'Each accident', EL_LIMITS.map(x => [x, x]), { req: true })}
                {sel('elDiseasePolicy', 'Disease, whole policy', EL_LIMITS.map(x => [x, x]), { req: true })}
                {sel('elDiseaseEachEmployee', 'Disease, each employee', EL_LIMITS.map(x => [x, x]), { req: true })}
              </div>
              <fieldset className="q-checks"><legend className="q-legend">Optional extras (tick any that apply)</legend>
                {COVER_130.map(c => chk(c.name, c.label))}
              </fieldset>
              <div className="q-grid">
                {txt('experienceMod', 'Experience modification factor ("mod")', { req: true, help: 'Your current mod from the rating bureau, like 0.95. Not experience rated? Enter 1.00.' })}
              </div>
            </section>

            <section className="q-sec"><h3 className="q-h">Owners and officers</h3>
              {rows(0, counts.owners, 'owners', MAX_OWNERS, ownerRow, 'Add another owner or officer')}
            </section>

            <section className="q-sec"><h3 className="q-h">Employees and payroll, by type of work</h3>
              {rows(0, counts.classes, 'classes', MAX_CLASSES, classRow, 'Add another type of work')}
            </section>

            <section className="q-sec"><h3 className="q-h">Past coverage and claims</h3>
              <p className="q-help">Workers comp policies you have had, newest first. Claim-free years need zeros typed in; blank is read as unanswered.</p>
              {rows(0, counts.prior, 'prior', MAX_PRIOR, priorRow, 'Add an earlier policy year')}
            </section>

            <section className="q-sec"><h3 className="q-h">A few yes-or-no questions</h3>
              <p className="q-help">Every question needs an answer. If you pick Yes, add one line of detail.</p>
              {YN_130.map(q => yn(q.key, q.q, q.hint))}
            </section>

            {status !== 'idle' && <p className={status === 'ok' ? 'q-ok' : 'q-bad'} role="status" data-testid="submit-status">{message}</p>}
            <button type="submit" className="q-btn" disabled={busy}>{busy ? 'Sending...' : 'Request my workers comp quote'}</button>
          </form>
        </section>
        <section className="right" aria-label="ACORD 130 form pages">
          <AcordPane pages={[1, 4]} page={page} onPage={setPage} items={items} focusField={focus} title="ACORD 130" png={png} widgetsOf={widgets130} totalPages={4} />
          {hint && <p className="hint" role="status">{hint}</p>}
          <p className="fine">Your typed answers are drawn over the blank form for preview. Signature, signed date, initials and policy numbers are never filled in here, and the agency, carrier and rating blocks stay blank.</p>
          {!hasAnyAnswer(payload) && null}
        </section>
      </div>
    </div>
  )
}
