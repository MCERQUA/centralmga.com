import Link from 'next/link'
import { APPS } from './apps'

export function HomeFooter() {
  return (
    <footer className="mg-foot">
      <div className="mg-foot-in">
        <div>
          <p className="mg-foot-brand">Central MGA</p>
          <p>A managing general agent: an insurance intermediary working between carriers and retail agents.</p>
          <p className="mg-50">Available in all 50 states.</p>
        </div>
        <nav aria-label="Applications">
          <Link href="/acord-apps">Acord Apps</Link>
          <Link href="/excess-and-surplus">Excess &amp; surplus lines</Link>
          {APPS.map(a => <Link key={a.href} href={a.href}>{a.code} <span>{a.name}</span></Link>)}
        </nav>
      </div>
      <p className="mg-foot-note">Answering here is a request for a quote. Nothing on this site binds coverage, and signatures are never collected.</p>
    </footer>
  )
}
