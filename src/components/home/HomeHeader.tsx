import Link from 'next/link'

export function HomeHeader({ current }: { current?: 'home' | 'apps' | 'es' }) {
  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-current={current === 'home' ? 'page' : undefined}><b>Central MGA</b><span>Managing general agent</span></Link>
      <nav aria-label="Main">
        <Link href="/acord-apps" className={current === 'apps' ? 'on' : undefined} aria-current={current === 'apps' ? 'page' : undefined}>Acord Apps</Link>
        <Link href="/excess-and-surplus" className={current === 'es' ? 'on' : undefined} aria-current={current === 'es' ? 'page' : undefined}>Excess &amp; Surplus</Link>
        <Link href="/#surety">Surety Bonds</Link>
        <Link href="/#faq">FAQ</Link>
      </nav>
    </header>
  )
}
