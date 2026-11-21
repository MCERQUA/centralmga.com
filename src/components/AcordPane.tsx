"use client"
// Right pane: ONE real ACORD page at a time (page switcher), host poppler PNG, with the typed answers overlaid at each PDF widget /Rect (pt, 612x792).
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { PNG_PATTERN } from '@/lib/config'
import { widgetsFor, type Item } from '@/lib/overlay'

const PW = 612, PH = 792

export function AcordPane(props: {
  pages: [number, number]
  page: number
  onPage: (n: number) => void
  items: Item[]
  focusField: string
  title: string
  png?: (n: number) => string          // page picture url (default: 125/126/140 set)
  widgetsOf?: (field: string) => Item[]   // focus highlight source (default: 125/126/140 rules)
  totalPages?: number                      // pages in the source PDF (default 11)
}) {
  const { pages, page, onPage, items, focusField } = props
  const png = props.png ?? PNG_PATTERN, widgetsOf = props.widgetsOf ?? widgetsFor, totalPages = props.totalPages ?? 11
  const wrap = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(560)
  const [err, setErr] = useState('')
  useEffect(() => { setErr('') }, [page])

  useEffect(() => {
    const el = wrap.current; if (!el) return
    const ro = new ResizeObserver(() => setW(Math.max(320, Math.floor(el.clientWidth))))
    ro.observe(el); setW(Math.max(320, Math.floor(el.clientWidth)))
    return () => ro.disconnect()
  }, [])

  const k = w / PW
  const here = useMemo(() => items.filter(i => i.page === page), [items, page])
  const focusW = useMemo(() => (focusField ? widgetsOf(focusField).filter(i => i.page === page) : []), [focusField, page])
  const pill = (n: number) => {
    const c = items.filter(i => i.page === n).length
    return (
      <button key={n} type="button" className={`pg${n === page ? ' on' : ''}`} onClick={() => onPage(n)} aria-current={n === page ? 'page' : undefined}>
        <span>p{n}</span>{c > 0 && <em>{c}</em>}
      </button>
    )
  }
  const nums: number[] = []; for (let n = pages[0]; n <= pages[1]; n++) nums.push(n)

  return (
    <div className="pane" data-testid="acord-pane">
      <div className="pane-bar">
        <div className="pane-title">{props.title}<small> , page {page - pages[0] + 1} of {nums.length} (PDF page {page} of {totalPages})</small></div>
        <div className="pgs" role="group" aria-label="ACORD page switcher">
          <button type="button" className="nav" disabled={page <= pages[0]} onClick={() => onPage(page - 1)} aria-label="Previous page">Prev</button>
          {nums.map(pill)}
          <button type="button" className="nav" disabled={page >= pages[1]} onClick={() => onPage(page + 1)} aria-label="Next page">Next</button>
        </div>
      </div>
      <div className="sheet" ref={wrap}>
        <div className="paper" style={{ width: w, height: Math.round(w * PH / PW) }}>
          <img src={png(page)} alt={`ACORD form page ${page}`} width={w} height={Math.round(w * PH / PW)} data-testid="page-img" onError={() => setErr(`page image ${page} missing`)} />
          {err && <div className="loading bad">Could not load the page: {err}</div>}
          <div className="ov" aria-hidden>
            {focusW.map((i, n) => <div key={`f${n}`} className="hl" style={box(i.rect, k)} />)}
            {here.map((i, n) => {
              const b = box(i.rect, k); const hpt = i.rect[3] - i.rect[1], wpt = i.rect[2] - i.rect[0]
              if (i.check) return <div key={`${i.pdf}${n}`} className={`ink chk${i.pending ? ' pending' : ''}`} style={{ ...b, fontSize: Math.max(8, Math.min(hpt, wpt) * 0.95 * k) }} data-pdf={i.pdf}>X</div>
              const multi = hpt > 20
              const fs = multi ? 7.2 : Math.max(5, Math.min(hpt * 0.72, (wpt / Math.max(1, (i.text ?? '').length)) * 1.9, 10))
              return <div key={`${i.pdf}${n}`} className={`ink${multi ? ' multi' : ''}${i.pending ? ' pending' : ''}`} style={{ ...b, fontSize: fs * k }} data-pdf={i.pdf}>{i.text}</div>
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// PDF rect (origin bottom-left, pt) -> CSS box in the pane
function box(r: number[], k: number): React.CSSProperties {
  return { left: r[0] * k, top: (PH - r[3]) * k, width: (r[2] - r[0]) * k, height: (r[3] - r[1]) * k }
}
