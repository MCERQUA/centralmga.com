import Link from 'next/link'
import { ROUTES, type RouteKey } from '@/lib/config'

const BLURB: Record<RouteKey, string> = {
  '125': 'The base commercial application: who you are, where you operate, what you do, your history. Pages 1 to 4 of the form.',
  '126': 'The general liability section: limits, class of work, and the long list of operations questions. Pages 5 to 8.',
  '140': 'The property section. Preview only for now: the form pages are shown, the building questions are not built yet. Pages 9 to 11.',
}

export default function Home() {
  return (
    <main className="home">
      <header className="hero">
        <p className="kicker">centralmga.com</p>
        <h1>Fill in the insurance application by answering questions, not by decoding a form.</h1>
        <p className="sub">Plain-language questions on the left. The real ACORD pages on the right, filling in as you type. One set of answers carries across the three commercial applications; workers compensation has its own questions.</p>
      </header>
      <ol className="cards">
        {(Object.keys(ROUTES) as RouteKey[]).map((k, i) => (
          <li key={k}>
            <Link href={`/${ROUTES[k].slug}`}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <h2>{ROUTES[k].title}</h2>
              <p className="what">{ROUTES[k].sub}</p>
              <p>{BLURB[k]}</p>
              <span className="go">Open the split-screen application</span>
            </Link>
          </li>
        ))}
        <li>
          <Link href="/acord-130">
            <span className="num">04</span>
            <h2>ACORD 130</h2>
            <p className="what">Workers compensation application</p>
            <p>Its own questionnaire: your business, owners, payroll by type of work, past claims and the underwriting yes-or-no questions. Pages 1 to 4 of the form.</p>
            <span className="go">Open the split-screen application</span>
          </Link>
        </li>
      </ol>
      <p className="foot">Answering here is a request for a quote. Nothing on this site binds coverage, and signatures are never collected.</p>
    </main>
  )
}
