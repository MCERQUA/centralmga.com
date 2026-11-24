import Link from 'next/link'

export function SubmitRisk() {
  return (
    <section className="mg-sec" id="submit" aria-labelledby="mg-submit">
      <p className="kicker">Submit a risk</p>
      <h2 id="mg-submit">Start with the ACORD application.</h2>
      <p className="mg-sub">Each application is a plain-language questionnaire beside the real ACORD pages, which fill in as you answer. They are on their own page.</p>
      <p className="mg-cta"><Link className="mg-btn" href="/acord-apps">Open Acord Apps</Link></p>
    </section>
  )
}
