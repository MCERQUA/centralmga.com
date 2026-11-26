'use client'
// Compliance360. Everything happens in this browser tab: the requirements template is kept in this browser's localStorage,
// the certificate numbers are typed in and never stored, and an optional certificate file is only previewed from a local object URL.
// Nothing is sent anywhere (no fetch, no form post, no beacon).
import { useEffect, useMemo, useRef, useState } from 'react'
import { HomeHeader } from '@/components/home/HomeHeader'
import { HomeFooter } from '@/components/home/HomeFooter'
import {
  DEFAULT_TEMPLATE, ENDORSEMENTS, LINES, TEMPLATE_KEY, emptyCoi, evaluate, parseTemplate,
  type CoiInput, type EndorsementKey, type LineKey, type Template,
} from '@/lib/compliance360'
import s from './Compliance360.module.css'

const digits = (v: string) => Number(v.replace(/[^0-9]/g, '')) || 0
const fmt = (n: number) => (n > 0 ? n.toLocaleString('en-US') : '')
const MAX_PREVIEW_BYTES = 25 * 1024 * 1024

export function Compliance360() {
  const [tpl, setTpl] = useState<Template>(DEFAULT_TEMPLATE)
  const [loaded, setLoaded] = useState(false)
  const [coi, setCoi] = useState<CoiInput>(emptyCoi)
  const [today, setToday] = useState<Date | null>(null)
  const [file, setFile] = useState<{ url: string; name: string; type: string } | null>(null)
  const [fileMsg, setFileMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try { setTpl(parseTemplate(window.localStorage.getItem(TEMPLATE_KEY))) } catch { /* storage blocked: keep the defaults */ }
    setToday(new Date()); setLoaded(true)
  }, [])
  useEffect(() => {
    if (!loaded) return
    try { window.localStorage.setItem(TEMPLATE_KEY, JSON.stringify(tpl)) } catch { /* storage blocked: template just is not remembered */ }
  }, [tpl, loaded])
  useEffect(() => () => { if (file) URL.revokeObjectURL(file.url) }, [file])

  const result = useMemo(() => (today ? evaluate(tpl, coi, today) : null), [tpl, coi, today])

  const setReq = (k: LineKey, p: Partial<Template['lines'][LineKey]>) => setTpl(t => ({ ...t, lines: { ...t.lines, [k]: { ...t.lines[k], ...p } } }))
  const setEnd = (k: EndorsementKey, v: boolean) => setTpl(t => ({ ...t, endorsements: { ...t.endorsements, [k]: v } }))
  const setLine = (k: LineKey, p: Partial<CoiInput['lines'][LineKey]>) => setCoi(c => ({ ...c, lines: { ...c.lines, [k]: { ...c.lines[k], ...p } } }))
  const setCoiEnd = (k: EndorsementKey, v: boolean) => setCoi(c => ({ ...c, endorsements: { ...c.endorsements, [k]: v } }))

  const pickFile = (f: File | undefined) => {
    setFileMsg('')
    if (!f) return
    const ok = f.type === 'application/pdf' || f.type.startsWith('image/')
    if (!ok) { setFileMsg('Please choose a PDF or a photo (JPG or PNG) of the certificate.'); return }
    if (f.size > MAX_PREVIEW_BYTES) { setFileMsg('That file is over 25 MB. Please choose a smaller one.'); return }
    setFile({ url: URL.createObjectURL(f), name: f.name, type: f.type })
  }
  const clearFile = () => { setFile(null); if (fileRef.current) fileRef.current.value = '' }

  const summary = () => {
    if (!result) return ''
    const head = result.overall === 'pass' ? 'PASS: meets every requirement in the template.' : result.overall === 'fail' ? `FAIL: ${result.fails} requirement${result.fails === 1 ? '' : 's'} not met.` : 'Nothing checked yet.'
    const body = result.rows.filter(r => r.status !== 'na').map(r => `${r.status === 'pass' ? 'PASS' : 'FAIL'} - ${r.label}: ${r.reasons.join(' ')}`)
    return [`Compliance360 subcontractor insurance check, ${today?.toLocaleDateString('en-US') ?? ''}`, head, ...body].join('\n')
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(summary()); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { setCopied(false) }
  }

  const reqLines = LINES.filter(l => tpl.lines[l.key].required)
  const reqEnds = ENDORSEMENTS.filter(e => tpl.endorsements[e.key])

  return (
    <div className="mg">
      <HomeHeader current="compliance360" />
      <main className={s.page}>
        <p className="kicker">Compliance360</p>
        <h1 className="mg-h1s">Compliance360: check subcontractor insurance against your requirements.</h1>
        <p className="mg-sub">Compliance360 is a subcontractor insurance checker. Set the requirements once, type in what the certificate of insurance shows, and get a pass or fail for each line. Your template is remembered in this browser only. The certificate details are not stored, and nothing you enter is sent anywhere.</p>

        <section className={s.card} aria-labelledby="sc-tpl">
          <h2 id="sc-tpl">1. Your requirements</h2>
          <p className={s.hint}>The starting values are generic placeholders, not a recommendation. Change every one to match your contract.</p>
          <ul className={s.list}>
            {LINES.map(l => {
              const r = tpl.lines[l.key]
              return (
                <li key={l.key} className={s.item}>
                  <label className={s.check}>
                    <input type="checkbox" checked={r.required} onChange={e => setReq(l.key, { required: e.target.checked })} />
                    <span><b>{l.label}</b><small>{l.note}</small></span>
                  </label>
                  {r.required && l.kind === 'limit' && (
                    <label className={s.field}>
                      <span>Minimum limit</span>
                      <span className={s.money}><i aria-hidden="true">$</i><input type="text" inputMode="numeric" autoComplete="off" value={fmt(r.min)} onChange={e => setReq(l.key, { min: digits(e.target.value) })} aria-label={`Minimum limit, ${l.label}`} /></span>
                    </label>
                  )}
                </li>
              )
            })}
          </ul>
          <h3>Required endorsements</h3>
          <ul className={s.list}>
            {ENDORSEMENTS.map(e => (
              <li key={e.key} className={s.item}>
                <label className={s.check}>
                  <input type="checkbox" checked={tpl.endorsements[e.key]} onChange={ev => setEnd(e.key, ev.target.checked)} />
                  <span><b>{e.label}</b><small>{e.note}</small></span>
                </label>
              </li>
            ))}
          </ul>
          <label className={s.field}>
            <span>Each policy must still run at least this many days</span>
            <input type="text" inputMode="numeric" autoComplete="off" value={String(tpl.minDaysRemaining)} onChange={e => setTpl(t => ({ ...t, minDaysRemaining: digits(e.target.value) }))} aria-label="Minimum days remaining on each policy" className={s.days} />
          </label>
          <button type="button" className={s.ghost} onClick={() => setTpl(JSON.parse(JSON.stringify(DEFAULT_TEMPLATE)))}>Reset to the starting values</button>
        </section>

        <section className={s.card} aria-labelledby="sc-coi">
          <h2 id="sc-coi">2. The subcontractor&rsquo;s certificate</h2>
          <p className={s.hint}>Type in what the certificate shows. You can also open the certificate here to read it while you type; the file stays on this device and is not read automatically.</p>
          <div className={s.file}>
            <label className={s.pick}>
              Open a certificate (PDF or photo)
              <input ref={fileRef} type="file" accept="application/pdf,image/*" onChange={e => pickFile(e.target.files?.[0])} className={s.hidden} />
            </label>
            {file && <button type="button" className={s.ghost} onClick={clearFile}>Close it</button>}
          </div>
          {fileMsg && <p role="alert" className={s.err}>{fileMsg}</p>}
          {file && (
            <div className={s.preview}>
              {file.type.startsWith('image/')
                ? <img src={file.url} alt={`Certificate: ${file.name}`} />
                : <a href={file.url} target="_blank" rel="noopener">Open {file.name} in a new tab</a>}
            </div>
          )}
          {reqLines.length === 0 && reqEnds.length === 0 && <p className={s.hint}>Turn on at least one requirement above to start checking.</p>}
          <ul className={s.list}>
            {reqLines.map(l => {
              const g = coi.lines[l.key]
              return (
                <li key={l.key} className={s.item}>
                  <label className={s.check}>
                    <input type="checkbox" checked={g.present} onChange={e => setLine(l.key, { present: e.target.checked })} />
                    <span><b>{l.label}</b><small>Tick if the certificate shows this policy.</small></span>
                  </label>
                  {g.present && (
                    <div className={s.row2}>
                      {l.kind === 'limit' && (
                        <label className={s.field}>
                          <span>Limit shown</span>
                          <span className={s.money}><i aria-hidden="true">$</i><input type="text" inputMode="numeric" autoComplete="off" value={fmt(g.limit)} onChange={e => setLine(l.key, { limit: digits(e.target.value) })} aria-label={`Limit shown, ${l.label}`} /></span>
                        </label>
                      )}
                      <label className={s.field}>
                        <span>Policy expires</span>
                        <input type="date" value={g.expires} onChange={e => setLine(l.key, { expires: e.target.value })} aria-label={`Policy expiration, ${l.label}`} />
                      </label>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          {reqEnds.length > 0 && <h3>Endorsements shown</h3>}
          <ul className={s.list}>
            {reqEnds.map(e => (
              <li key={e.key} className={s.item}>
                <label className={s.check}>
                  <input type="checkbox" checked={coi.endorsements[e.key]} onChange={ev => setCoiEnd(e.key, ev.target.checked)} />
                  <span><b>{e.label}</b><small>Tick if the certificate or its endorsements show it.</small></span>
                </label>
              </li>
            ))}
          </ul>
          <button type="button" className={s.ghost} onClick={() => setCoi(emptyCoi())}>Clear this certificate</button>
        </section>

        <section className={s.card} aria-labelledby="sc-res" aria-live="polite">
          <h2 id="sc-res">3. Result</h2>
          {result && (
            <>
              <p className={`${s.banner} ${result.overall === 'pass' ? s.bp : result.overall === 'fail' ? s.bf : s.bn}`}>
                {result.overall === 'pass' && 'PASS. This certificate meets every requirement in your template.'}
                {result.overall === 'fail' && `FAIL. ${result.fails} requirement${result.fails === 1 ? '' : 's'} not met.`}
                {result.overall === 'empty' && 'Nothing to check yet.'}
              </p>
              <ul className={s.results}>
                {result.rows.filter(r => r.status !== 'na').map(r => (
                  <li key={r.key} className={r.status === 'pass' ? s.rp : s.rf}>
                    <span className={s.tag}>{r.status === 'pass' ? 'PASS' : 'FAIL'}</span>
                    <span><b>{r.label}</b><small>{r.reasons.join(' ')}</small></span>
                  </li>
                ))}
              </ul>
              <button type="button" className={s.ghost} onClick={copy}>{copied ? 'Copied' : 'Copy the result as text'}</button>
              <p className={s.hint}>This is a screening aid for comparing numbers. It does not read policy wording, and a pass is not a coverage opinion. Confirm anything important with the policy and the insurer. Today&rsquo;s date is taken from this device&rsquo;s clock{today ? ` (${today.toLocaleDateString('en-US')})` : ''}.</p>
            </>
          )}
        </section>

        <section className={s.card} aria-labelledby="sc-rm">
          <h2 id="sc-rm">Risk management for subcontractors</h2>
          <p className={s.hint}>General information to help you decide what to ask for. It is not legal advice, and it does not say what any policy covers. Your contract, your insurance agent and your attorney decide what is right for your work.</p>
          <h3>Why collect a certificate of insurance</h3>
          <p className={s.copy}>When a subcontractor works on your job, an injury or damage claim can reach you as well as them. A certificate of insurance (COI) is a one-page summary of the policies a subcontractor says it carries. Collecting one before work starts, and again whenever a policy renews, is the usual first step in managing that exposure.</p>
          <h3>What a COI does and does not show</h3>
          <p className={s.copy}>A COI is an information sheet. It lists the insurer, the policy numbers, the policy dates and the limits. It does not change the policy and it does not by itself give anyone rights under it. The policy wording and its endorsements control what is actually covered, so ask for the endorsements when they matter.</p>
          <h3>Limits</h3>
          <p className={s.copy}>Each liability line has limits, for example per occurrence and in total for the policy period (the aggregate). Compare each limit on the certificate with the minimum your contract asks for. Larger or higher-risk jobs often call for higher limits, and an umbrella or excess policy can sit above the underlying policies.</p>
          <h3>Additional insured</h3>
          <p className={s.copy}>An additional insured endorsement adds another party, such as a general contractor or owner, to the subcontractor&rsquo;s liability policy for certain work. The words &ldquo;additional insured&rdquo; typed on a certificate do not replace the endorsement itself, so ask to see it.</p>
          <h3>Primary and non-contributory</h3>
          <p className={s.copy}>This wording says the subcontractor&rsquo;s policy responds first, before any insurance you carry yourself, and that your policy is not asked to share the loss. Many contracts require it.</p>
          <h3>Waiver of subrogation</h3>
          <p className={s.copy}>After paying a claim, an insurer can normally try to recover that money from whoever it says caused the loss. A waiver of subrogation endorsement gives up that right against a named party. Contracts often require it for workers&rsquo; compensation and liability policies.</p>
          <h3>Workers&rsquo; compensation and employers&rsquo; liability</h3>
          <p className={s.copy}>Workers&rsquo; compensation pays for injuries to a subcontractor&rsquo;s own employees. If a subcontractor has none, or does not carry it, an injured worker may look to the party above them. Check that coverage is shown and note the employers&rsquo; liability limits that go with it.</p>
          <h3>Expiration dates</h3>
          <p className={s.copy}>A certificate is a snapshot. Policies expire and can be cancelled after it is issued. Many companies ask that each policy run for a minimum number of days past the check date, then diary the earliest expiration and ask for a fresh certificate before it lapses. The minimum-days setting in the checker does the date arithmetic for you.</p>
          <h3>How to use the checker</h3>
          <ol className={s.steps}>
            <li>Set your requirements in step 1: tick the lines you require, set each minimum limit, choose the endorsements and the minimum days remaining. The starting values are placeholders, so change them to match your contract.</li>
            <li>Open the subcontractor&rsquo;s certificate, then in step 2 tick each policy it shows and type the limit and expiration date.</li>
            <li>Tick the endorsements you can confirm from the certificate or its attached endorsements.</li>
            <li>Read the result. Every FAIL says why. Ask the subcontractor or its agent for a corrected certificate, then check again.</li>
          </ol>
          <p className={s.hint}>Compliance360 compares numbers you type against numbers you set. It does not read policy wording, verify a certificate with an insurer or give coverage opinions.</p>
        </section>
      </main>
      <HomeFooter hideQuoteNote />
    </div>
  )
}

