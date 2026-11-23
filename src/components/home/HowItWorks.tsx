const Arrow = () => (
  <svg className="mg-arrow" viewBox="0 0 80 24" aria-hidden="true" focusable="false">
    <line x1="2" y1="12" x2="68" y2="12" stroke="currentColor" strokeWidth="2" />
    <polyline points="60,5 70,12 60,19" fill="none" stroke="currentColor" strokeWidth="2" />
  </svg>
)

const STEPS = [
  { n: '1', who: 'Retail agent', what: 'Has the client and the need. Sends the risk and the application to Central MGA.' },
  { n: '2', who: 'Central MGA', what: 'Reviews the submission for completeness, supports underwriting and coordinates with the carrier.', mid: true },
  { n: '3', who: 'Insurance carrier', what: 'Underwrites the risk and decides on terms. Carrier decisions stay with the carrier.' },
]

export function HowItWorks() {
  return (
    <section className="mg-sec" id="how" aria-labelledby="mg-how">
      <p className="kicker">How an MGA works</p>
      <h2 id="mg-how">One point of contact between the agent and the carrier.</h2>
      <p className="mg-sub">An MGA is not the retail agent and not the carrier. It is the intermediary in the middle, which is why the submission, the questions and the answers all travel through one place.</p>
      <ol className="mg-flow">
        {STEPS.map((s, i) => (
          <li key={s.n} className={s.mid ? 'mg-step mid' : 'mg-step'}>
            <span className="mg-step-n">{s.n}</span>
            <h3>{s.who}</h3>
            <p>{s.what}</p>
            {i < STEPS.length - 1 && <Arrow />}
          </li>
        ))}
      </ol>
    </section>
  )
}
