"use client"
// Drop zone: Josh drops a fillable ACORD PDF, the page prefills its questions from the form fields. Everything happens in this browser tab:
// the file is read from memory by the bundled pdf-lib, then dropped. Nothing is sent, stored or logged.
import React, { useEffect, useRef, useState } from 'react'
import { readFillablePdf, NOT_FILLABLE_MSG, PrefillError, type PdfRead } from '@/lib/pdfRead'

export type DropOutcome = { count: number; unmatched: string[]; ambiguous: string[]; notShown?: string[] }
type State = { kind: 'idle' } | { kind: 'busy' } | { kind: 'bad'; message: string } | { kind: 'ok'; name: string; out: DropOutcome }

export function PdfDrop(props: { formName: string; recognise: (r: PdfRead) => boolean; run: (r: PdfRead) => DropOutcome }) {
  const [st, setSt] = useState<State>({ kind: 'idle' })
  const [over, setOver] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  // a missed drop must never make the browser open (and leave the page for) the dropped file
  useEffect(() => {
    const stop = (e: DragEvent) => { if (e.dataTransfer?.types?.includes('Files')) e.preventDefault() }
    window.addEventListener('dragover', stop); window.addEventListener('drop', stop)
    return () => { window.removeEventListener('dragover', stop); window.removeEventListener('drop', stop) }
  }, [])

  const take = async (files: FileList | null | undefined) => {
    const f = files?.[0]; if (!f) return
    const looksPdf = f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
    if (!looksPdf) { setSt({ kind: 'bad', message: NOT_FILLABLE_MSG }); return }
    setSt({ kind: 'busy' })
    try {
      const r = await readFillablePdf(f)
      if (!props.recognise(r)) { setSt({ kind: 'bad', message: `This PDF has form fields, but none match ${props.formName}. Nothing was changed. Please drop a fillable ${props.formName} PDF.` }); return }
      const out = props.run(r)
      if (!out.count) { setSt({ kind: 'bad', message: `This looks like ${props.formName}, but its fields are empty (or hold nothing these questions use). Nothing was changed.` }); return }
      setSt({ kind: 'ok', name: f.name, out })
    } catch (e) {
      setSt({ kind: 'bad', message: e instanceof PrefillError ? e.message : 'That PDF could not be read here. Please drop a fillable ACORD PDF.' })
    } finally { if (input.current) input.current.value = '' }
  }

  const out = st.kind === 'ok' ? st.out : null
  return (
    <div className="pfd" data-testid="pdf-drop">
      <div
        className={`pfd-zone${over ? ' over' : ''}`}
        role="button" tabIndex={0} aria-label={`Drop a fillable ${props.formName} PDF here, or press Enter to choose a file`}
        onClick={() => input.current?.click()}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click() } }}
        onDragOver={e => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={e => { e.preventDefault(); setOver(false); void take(e.dataTransfer.files) }}
      >
        <b>Drop a fillable {props.formName} PDF here</b>
        <span>or click to choose one. Your questions fill in from it. It is read in this browser only, never uploaded or sent.</span>
        <input ref={input} type="file" accept="application/pdf,.pdf" hidden data-testid="pdf-file" onChange={e => void take(e.target.files)} />
      </div>
      <div role="status" aria-live="polite" data-testid="pdf-status">
        {st.kind === 'busy' && <p className="pfd-msg">Reading the PDF...</p>}
        {st.kind === 'bad' && <p className="pfd-msg bad" data-testid="pdf-msg">{st.message}</p>}
        {out && (
          <div className="pfd-ok" data-testid="pdf-banner">
            <p><b>Prefilled {out.count} field{out.count === 1 ? '' : 's'}, please review.</b> Marked answers came from {st.kind === 'ok' ? st.name : 'your PDF'}; every one is editable and a mark clears when you change it. Nothing was submitted or sent.</p>
            {(out.unmatched.length > 0 || out.ambiguous.length > 0 || (out.notShown?.length ?? 0) > 0) && (
              <details className="pfd-nf" data-testid="pdf-notfound">
                <summary>Not carried over ({out.unmatched.length + out.ambiguous.length + (out.notShown?.length ?? 0)})</summary>
                {out.ambiguous.length > 0 && <p>Could not read safely, left blank: {out.ambiguous.slice(0, 10).join('; ')}{out.ambiguous.length > 10 ? `; and ${out.ambiguous.length - 10} more` : ''}.</p>}
                {(out.notShown?.length ?? 0) > 0 && <p>Filled, but no matching box on screen yet: {out.notShown!.slice(0, 10).join(', ')}{out.notShown!.length > 10 ? `, and ${out.notShown!.length - 10} more` : ''}.</p>}
                {out.unmatched.length > 0 && <p>In the PDF but not used by these questions: {out.unmatched.slice(0, 10).join(', ')}{out.unmatched.length > 10 ? `, and ${out.unmatched.length - 10} more` : ''}. Signature, signed date and policy number are never carried over.</p>}
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
