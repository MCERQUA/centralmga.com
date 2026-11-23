import Link from 'next/link'
import { APPS } from './apps'

export function HomeHeader() {
  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-current="page"><b>Central MGA</b><span>Managing general agent</span></Link>
      <nav aria-label="Applications">
        {APPS.map(a => <Link key={a.href} href={a.href}>{a.code}</Link>)}
      </nav>
    </header>
  )
}
