export const FAQ = [
  { q: 'What is a managing general agent?', a: 'A managing general agent, or MGA, is an insurance intermediary that works between insurance carriers and retail agents. Depending on the arrangement, it supports functions such as underwriting, binding and program administration.' },
  { q: 'How is an MGA different from a retail agent?', a: 'A retail agent works directly with the insured and places the coverage. An MGA works with retail agents and carriers, offering a place to submit risks and support in getting them to the carrier.' },
  { q: 'How is an MGA different from an insurance carrier?', a: 'The carrier is the insurer that takes on the risk and makes the underwriting decision. An MGA is an intermediary and acts for the carrier only where the carrier has authorized it.' },
  { q: 'Who can submit a risk?', a: 'Submissions come through retail agents. The ACORD applications on this site are the starting point for a submission.' },
  { q: 'Does answering an application bind coverage?', a: 'No. Answering here is a request for a quote. Nothing on this site binds coverage, and signatures are never collected.' },
]

export function Faq() {
  return (
    <section className="mg-sec" id="faq" aria-labelledby="mg-faq">
      <p className="kicker">Questions</p>
      <h2 id="mg-faq">About managing general agents.</h2>
      <div className="mg-faq">
        {FAQ.map(f => (
          <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
        ))}
      </div>
    </section>
  )
}
