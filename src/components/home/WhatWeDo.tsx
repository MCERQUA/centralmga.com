const DO = [
  { t: 'Underwriting support', d: 'Helping make a submission complete and clear so the carrier can evaluate the risk.' },
  { t: 'Carrier and agent partnerships', d: 'Working with carriers on one side and retail agents on the other.' },
  { t: 'Binding support', d: 'Supporting the binding process where authorized by the carrier.' },
  { t: 'Program administration', d: 'Administering insurance programs on behalf of carriers.' },
]

export function WhatWeDo() {
  return (
    <section className="mg-sec" id="what" aria-labelledby="mg-what">
      <p className="kicker">What we do</p>
      <h2 id="mg-what">Support for the agent. Reach for the carrier.</h2>
      <ul className="mg-do">
        {DO.map(x => (
          <li key={x.t}><h3>{x.t}</h3><p>{x.d}</p></li>
        ))}
      </ul>
      <div className="mg-two">
        <div>
          <h3>For retail agents</h3>
          <ul>
            <li>A single point to submit a risk.</li>
            <li>Underwriting support along the way.</li>
            <li>Coordination of policy service and claims questions with the carrier.</li>
          </ul>
        </div>
        <div>
          <h3>For carriers</h3>
          <ul>
            <li>Distribution through retail agents.</li>
            <li>Program administration.</li>
            <li>Submissions arrive organized and complete.</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
