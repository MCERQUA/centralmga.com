"use client"
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { QuoteForm } from '@/components/quote/QuoteForm'
import { AcordPane } from '@/components/AcordPane'
import { computeItems, widgetsFor } from '@/lib/overlay'
import { FORM_NAME, LEADS_WEBHOOK_URL, NETLIFY_FALLBACK, ROUTES, SITE, STORAGE_KEY, type RouteKey } from '@/lib/config'
import { TODO_140 } from '@/lib/todo140'
import { PropertySection, propertyFilter } from '@/components/PropertySection'

type Flat = Record<string, string>
const CONNECTED = LEADS_WEBHOOK_URL !== ''
const TRADES = ['General Contractor', 'Remodeling / Handyman', 'Roofing', 'Spray Foam / Insulation', 'Concrete / Masonry', 'Carpentry / Framing', 'Drywall / Painting', 'Electrical', 'Plumbing', 'HVAC', 'Flooring / Tile', 'Excavation / Grading', 'Landscaping', 'Specialty Trade', 'Other']

const FORM_CLASSES = {
  form: 'q-form', section: 'q-sec', heading: 'q-h', grid: 'q-grid', label: 'q-label', input: 'q-input', error: 'q-err',
  legend: 'q-legend', option: 'q-opt', button: 'q-btn', ok: 'q-ok', bad: 'q-bad', detail: 'q-detail',
}

export function SplitApp({ route }: { route: RouteKey }) {
  const R = ROUTES[route]
  const [vals, setVals] = useState<Flat>({})
  const [restore, setRestore] = useState<{ key: number; defaults: Flat }>({ key: 0, defaults: {} })
  const [page, setPage] = useState<number>(R.pages[0])
  const [focus, setFocus] = useState('')
  const [hint, setHint] = useState('')
  const loaded = useRef(false)

  // carry answers across the three routes (tab-scoped sessionStorage; cleared when the tab closes or after a successful send)
  useEffect(() => {
    try {
      const s = sessionStorage.getItem(STORAGE_KEY)
      if (s) { const d = JSON.parse(s) as Flat; setRestore(r => ({ key: r.key + 1, defaults: d })); setVals(d) }
    } catch { /* storage unavailable: still works, answers just do not carry */ }
    loaded.current = true
  }, [])
  const onValues = useCallback((v: Flat) => {
    setVals(v)
    if (!loaded.current) return
    try {
      const keep = Object.fromEntries(Object.entries(v).filter(([, x]) => x !== '' && x !== undefined))
      if (Object.keys(keep).length > 1) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(keep)); else sessionStorage.removeItem(STORAGE_KEY)
    } catch { /* ignore */ }
  }, [])
  useEffect(() => { setPage(R.pages[0]) }, [route]) // eslint-disable-line react-hooks/exhaustive-deps

  const items = useMemo(() => computeItems(vals), [vals])

  // focusing a left field jumps the right pane to the page that field prints on (when that page belongs to this route)
  const onFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const t = e.target as HTMLInputElement
    const name = t.name || t.id?.replace(/^f-/, '')
    if (!name) return
    setFocus(name)
    const ws = widgetsFor(name)
    if (!ws.length) { setHint('This answer is kept with your request but has no printed box on the form pages.'); return }
    const inRoute = ws.find(w => w.page >= R.pages[0] && w.page <= R.pages[1])
    if (inRoute) { setPage(inRoute.page); setHint('') }
    else {
      const p = ws[0].page; const where = (Object.entries(ROUTES) as [RouteKey, typeof ROUTES[RouteKey]][]).find(([, r]) => p >= r.pages[0] && p <= r.pages[1])
      setHint(`This answer prints on ${where ? where[1].title : 'another form'}, page ${p}.`)
    }
  }

  return (
    <div className="split">
      <header className="topbar">
        <Link href="/" className="brand"><b>Central MGA</b><span>ACORD applications, in plain language</span></Link>
        <nav aria-label="Applications">
          {(Object.keys(ROUTES) as RouteKey[]).map(k => (
            <Link key={k} href={`/${ROUTES[k].slug}`} className={k === route ? 'on' : ''} aria-current={k === route ? 'page' : undefined}>{ROUTES[k].title}</Link>
          ))}
          <Link href="/acord-130">ACORD 130</Link>
        </nav>
      </header>
      <div className="cols">
        <section className="left" onFocusCapture={onFocus} aria-label="Questionnaire">
          <div className="lead">
            <h1>{R.title}: {R.sub}</h1>
            <p>Answer in your own words on this side. The matching page of the real ACORD form fills in on the right as you type.
              One set of answers feeds ACORD 125, 126 and 140, so you only answer once.</p>
            {route === '140' && (
              <aside className="todo" role="note">
                <b>ACORD 140 is not built out yet.</b> The pages on the right are the real blank form. The core premises block (building, construction, protection, values) is marked TODO:
                <ul>{TODO_140.map(t => <li key={t}>{t}</li>)}</ul>
              </aside>
            )}
            {!CONNECTED && (
              <aside className="notconn" role="status" data-testid="not-connected">
                <b>Not connected.</b> This build has no leads endpoint configured, so pressing the button validates your answers but sends nothing.
              </aside>
            )}
          </div>
          <QuoteForm
            key={restore.key}
            formName={FORM_NAME}
            tradeName="Commercial"
            endpoint={LEADS_WEBHOOK_URL}
            format="json"
            netlifyFallback={NETLIFY_FALLBACK}
            extraFields={{ form_name: FORM_NAME, source: SITE }}
            options={{ yn: true, ynRequired: true }}
            tradeTypeOptions={TRADES}
            defaults={restore.defaults}
            onValues={onValues}
            extra={api => <PropertySection {...api} />}
            infoFilter={propertyFilter}
            disabled={!CONNECTED}
            disabledMessage="Not connected: your answers are complete and valid, but this build has no leads endpoint, so nothing was sent."
            classes={FORM_CLASSES}
          />
        </section>
        <section className="right" aria-label="ACORD form pages">
          <AcordPane pages={R.pages} page={page} onPage={setPage} items={items} focusField={focus} title={R.title} />
          {hint && <p className="hint" role="status">{hint}</p>}
          <p className="fine">Your typed answers are drawn over the blank form for preview. Signature, signed date and policy number are never filled in here.</p>
        </section>
      </div>
    </div>
  )
}
