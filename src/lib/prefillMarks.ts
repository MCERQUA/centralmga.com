// Visible "prefilled, please review" marks on the questionnaire inputs. Pure DOM attributes (data-prefilled): no state, no storage.
// A mark disappears as soon as the person edits that field, so what stays marked is exactly what they have not looked at yet.
const esc = (s: string) => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&'))
const MSG = 'Prefilled from your PDF, please review'

function targets(root: HTMLElement, name: string): HTMLElement[] {
  const found = new Set<HTMLElement>()
  root.querySelectorAll<HTMLElement>(`[name="${esc(name)}"]`).forEach(e => found.add(e))
  const byId = root.querySelector<HTMLElement>(`#f-${esc(name)}`); if (byId) found.add(byId)
  return [...found]
}

/** Mark every present input for these answer names. Returns the names that found no input on screen (still prefilled in state, just not marked). */
export function markPrefilled(root: HTMLElement | null, names: string[]): string[] {
  const miss: string[] = []
  if (!root) return names
  for (const n of names) {
    const els = targets(root, n); let any = false
    for (const el of els) {
      const inp = el as HTMLInputElement
      if ((inp.type === 'radio' || inp.type === 'checkbox') && !inp.checked) continue
      const lab = (inp.type === 'radio' || inp.type === 'checkbox') ? inp.closest('label') as HTMLElement | null : null
      const t = lab ?? el
      t.setAttribute('data-prefilled', n); t.setAttribute('title', MSG); any = true
    }
    if (!any) miss.push(n)
  }
  return miss
}

export function clearMarks(root: HTMLElement | null) {
  root?.querySelectorAll('[data-prefilled]').forEach(e => { e.removeAttribute('data-prefilled'); if (e.getAttribute('title') === MSG) e.removeAttribute('title') })
}

/** Drop a field's mark when it is edited. Returns a cleanup function. */
export function unmarkOnEdit(root: HTMLElement | null): () => void {
  if (!root) return () => {}
  const h = (e: Event) => {
    const el = e.target as HTMLElement | null; const nm = (el as HTMLInputElement | null)?.name; if (!el || !nm) return
    root.querySelectorAll<HTMLElement>(`[data-prefilled="${esc(nm)}"]`).forEach(m => { m.removeAttribute('data-prefilled'); if (m.getAttribute('title') === MSG) m.removeAttribute('title') })
  }
  root.addEventListener('input', h); root.addEventListener('change', h)
  return () => { root.removeEventListener('input', h); root.removeEventListener('change', h) }
}
