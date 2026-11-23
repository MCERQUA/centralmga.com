import Link from 'next/link'
import { APPS } from './apps'

export function SubmitRisk() {
  return (
    <section className="mg-sec" id="submit" aria-labelledby="mg-submit">
      <p className="kicker">Submit a risk</p>
      <h2 id="mg-submit">Start with the ACORD application.</h2>
      <p className="mg-sub">Each application is a plain-language questionnaire beside the real ACORD pages, which fill in as you answer. Pick the one that fits the risk.</p>
      <ol className="cards mg-apps">
        {APPS.map((a, i) => (
          <li key={a.href}>
            <Link href={a.href}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>
              <h3>{a.code}</h3>
              <p className="what">{a.name}</p>
              <p>{a.note}</p>
              <span className="go">Open the application</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  )
}
