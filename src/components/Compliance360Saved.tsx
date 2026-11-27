'use client'
// Compliance360 saved subcontractors + COI request. Browser only: records live in this browser's localStorage, export/import is a JSON
// file the user downloads or picks, reminders are downloadable .ics files, and the request is text the user copies or opens in their own
// mail app. No fetch, no form post, no upload, no beacon.
import { useEffect, useMemo, useRef, useState } from 'react'
import { money, type CoiInput, type Template } from '@/lib/compliance360'
import {
  STATUS_LABEL, SUBS_KEY, exportJson, mailtoFor, mergeSubs, newId, parseSubs, policiesOf, policyIcs, requestMessage, sortSubs,
  type SubRecord,
} from '@/lib/compliance360Subs'
import s from './Compliance360.module.css'

type Props = { tpl: Template; coi: CoiInput; overall: 'pass' | 'fail' | 'empty'; today: Date | null; onOpen: (coi: CoiInput) => void }

function download(name: string, mime: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'sub'
const when = (iso: string) => { const d = new Date(iso); return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US') }

export function Compliance360Saved({ tpl, coi, overall, today, onOpen }: Props) {
  const [subs, setSubs] = useState<SubRecord[]>([])
  const [loaded, setLoaded] = useState(false)
  const [name, setName] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const [yourName, setYourName] = useState('')
  const [reqSub, setReqSub] = useState('')
  const [copied, setCopied] = useState(false)
  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try { setSubs(parseSubs(window.localStorage.getItem(SUBS_KEY))) } catch { /* storage blocked: start empty */ }
    setLoaded(true)
  }, [])
  useEffect(() => {
    if (!loaded) return
    try { window.localStorage.setItem(SUBS_KEY, JSON.stringify(subs)) } catch { setMsg('This browser is blocking storage, so saved subcontractors will not be remembered. Use Export to keep a copy.') }
  }, [subs, loaded])

  const rows = useMemo(() => (today ? sortSubs(subs, today) : []), [subs, today])

  const save = () => {
    const n = name.trim()
    if (!n) { setMsg('Type the subcontractor’s name first.'); return }
    const rec: SubRecord = { id: editId ?? newId(), name: n.slice(0, 120), savedAt: new Date().toISOString(), overall, coi: JSON.parse(JSON.stringify(coi)) }
    setSubs(cur => (editId && cur.some(x => x.id === editId) ? cur.map(x => (x.id === editId ? rec : x)) : [...cur, rec]))
    setMsg(editId ? `Updated ${rec.name}.` : `Saved ${rec.name}.`)
    setEditId(rec.id)
  }
  const open = (r: SubRecord) => { onOpen(JSON.parse(JSON.stringify(r.coi))); setName(r.name); setEditId(r.id); setMsg(`Opened ${r.name} in step 2. Change anything, then press Update.`) }
  const startNew = () => { setName(''); setEditId(null); setMsg('') }
  const remove = (r: SubRecord) => {
    if (!window.confirm(`Delete ${r.name} from this browser? This cannot be undone.`)) return
    setSubs(cur => cur.filter(x => x.id !== r.id))
    if (editId === r.id) { setEditId(null) }
    setMsg(`Deleted ${r.name}.`)
  }
  const exportAll = () => { download(`compliance360-subs-${new Date().toISOString().slice(0, 10)}.json`, 'application/json', exportJson(subs)); setMsg(`Exported ${subs.length} subcontractor${subs.length === 1 ? '' : 's'} to a file on this device.`) }
  const importFile = async (f: File | undefined) => {
    if (!f) return
    if (f.size > 5 * 1024 * 1024) { setMsg('That file is over 5 MB, so it is not a Compliance360 export.'); return }
    const got = parseSubs(await f.text())
    if (importRef.current) importRef.current.value = ''
    if (!got.length) { setMsg('No subcontractor records were found in that file.'); return }
    setSubs(cur => mergeSubs(cur, got))
    setMsg(`Imported ${got.length} subcontractor${got.length === 1 ? '' : 's'}.`)
  }

  const body = useMemo(() => requestMessage(reqSub, tpl, yourName), [reqSub, tpl, yourName])
  const copyReq = async () => { try { await navigator.clipboard.writeText(body); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { setCopied(false) } }

  return (
    <>
      <section className={s.card} aria-labelledby="sc-save">
        <h2 id="sc-save">4. Saved subcontractors</h2>
        <p className={s.privacy}><b>Privacy:</b> saved records stay in this browser on this device. Nothing is uploaded or sent anywhere, and no one else can see them. Clearing your browser data deletes them, so use Export to keep a copy.</p>
        <label className={s.field0}>
          <span>Subcontractor name</span>
          <input type="text" autoComplete="off" value={name} maxLength={120} onChange={e => setName(e.target.value)} aria-label="Subcontractor name" />
        </label>
        <div className={s.btns}>
          <button type="button" className={s.pick2} onClick={save}>{editId ? 'Update this subcontractor' : 'Save this subcontractor'}</button>
          {editId && <button type="button" className={s.ghost} onClick={startNew}>Start a new one</button>}
        </div>
        <p className={s.hint}>Saves the certificate details typed in step 2 (policies, limits, dates, endorsements) and the result.</p>
        <p role="status" aria-live="polite" className={s.note}>{msg}</p>

        <h3>Your list{subs.length ? ` (${subs.length})` : ''}</h3>
        {subs.length === 0 && <p className={s.hint}>Nothing saved yet.</p>}
        <ul className={s.list}>
          {rows.map(({ sub, worst, next }) => (
            <li key={sub.id} className={s.item}>
              <div className={s.subhead}>
                <b className={s.subname}>{sub.name}</b>
                <span className={`${s.badge} ${s['b_' + worst]}`}>{STATUS_LABEL[worst]}</span>
              </div>
              <small className={s.sm}>
                {sub.overall === 'pass' ? 'Passed' : sub.overall === 'fail' ? 'Failed' : 'Not checked'} when saved{when(sub.savedAt) ? ` on ${when(sub.savedAt)}` : ''}.
                {next ? ` Next expiry: ${next.label}, ${next.expires}.` : ' No policy dates saved.'}
              </small>
              <ul className={s.pols}>
                {today && policiesOf(sub.coi, today).map(p => (
                  <li key={p.key}>
                    <span className={`${s.badge} ${s['b_' + p.status]}`}>{p.days === null ? 'No date' : p.days < 0 ? `Expired ${-p.days}d ago` : p.days === 0 ? 'Expires today' : `${p.days}d left`}</span>
                    <span className={s.polname}>{p.label}{p.expires ? `, ${p.expires}` : ''}{sub.coi.lines[p.key].limit > 0 ? `, ${money(sub.coi.lines[p.key].limit)}` : ''}</span>
                    {p.days !== null && today && (
                      <button type="button" className={s.mini} onClick={() => download(`${slug(sub.name)}-${p.key}-expiry.ics`, 'text/calendar', policyIcs(sub.name, p, new Date()))} aria-label={`Download a calendar reminder for ${sub.name}, ${p.label}`}>Calendar reminder (.ics)</button>
                    )}
                  </li>
                ))}
              </ul>
              <div className={s.btns}>
                <button type="button" className={s.mini} onClick={() => open(sub)}>Open and edit</button>
                <button type="button" className={s.mini} onClick={() => { setReqSub(sub.name); document.getElementById('sc-req')?.scrollIntoView({ behavior: 'smooth' }) }}>Request a new certificate</button>
                <button type="button" className={s.miniDanger} onClick={() => remove(sub)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
        <div className={s.btns}>
          <button type="button" className={s.ghost} onClick={exportAll} disabled={!subs.length}>Export all (JSON file)</button>
          <label className={s.pick3}>
            Import a file
            <input ref={importRef} type="file" accept="application/json,.json" onChange={e => importFile(e.target.files?.[0])} className={s.hidden} />
          </label>
        </div>
        <p className={s.hint}>A calendar reminder is a file you add to your own calendar app. It alerts you 30 and 7 days before the policy expires. Nothing is emailed.</p>
      </section>

      <section className={s.card} aria-labelledby="sc-req">
        <h2 id="sc-req">5. Ask a subcontractor for a certificate</h2>
        <p className={s.hint}>Builds a message from your requirements in step 1. Copy it, or open it in your own email app. Nothing is sent from this page.</p>
        <label className={s.field0}>
          <span>Subcontractor name</span>
          <input type="text" autoComplete="off" value={reqSub} maxLength={120} onChange={e => setReqSub(e.target.value)} aria-label="Subcontractor to ask" />
        </label>
        <label className={s.field0}>
          <span>Your name (signs the message)</span>
          <input type="text" autoComplete="off" value={yourName} maxLength={120} onChange={e => setYourName(e.target.value)} aria-label="Your name" />
        </label>
        <label className={s.field0}>
          <span>Message</span>
          <textarea readOnly value={body} rows={14} className={s.ta} aria-label="Certificate request message" />
        </label>
        <div className={s.btns}>
          <button type="button" className={s.pick2} onClick={copyReq}>{copied ? 'Copied' : 'Copy the message'}</button>
          <a className={s.ghostA} href={mailtoFor(`Certificate of insurance request${reqSub.trim() ? ' - ' + reqSub.trim() : ''}`, body)}>Open in my email app</a>
        </div>
        <p className={s.hint}>You choose who it goes to and press send yourself. It lists only the lines and limits you required in step 1.</p>
      </section>
    </>
  )
}
