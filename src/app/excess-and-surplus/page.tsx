import Link from 'next/link'
import { HomeHeader } from '@/components/home/HomeHeader'
import { HomeFooter } from '@/components/home/HomeFooter'

export const metadata = {
  title: 'Excess and Surplus Lines | Central MGA',
  description: 'Plain-language guide to excess and surplus (E&S) lines: what it is, why some risks are hard to place in the standard market, and how a managing general agent works with retail agents. Available in all 50 states.',
}

const HARD = [
  { t: 'Unusual or specialized operations', d: 'Work that does not fit the standard classes an insurer has filed rates and forms for.' },
  { t: 'Loss history', d: 'A run of past claims can move a risk outside what standard programs will take.' },
  { t: 'High hazard', d: 'Exposures that standard insurers choose not to write at all, or only with narrow terms.' },
  { t: 'New or thin history', d: 'A new business, or one with little record, gives an underwriter less to rely on.' },
  { t: 'Size or limits', d: 'A need for limits, or a total exposure, beyond what a standard program offers.' },
  { t: 'Coverage not on the shelf', d: 'Needs that standard forms do not address, so the policy has to be written to fit.' },
]

const FLOW = [
  { n: '1', t: 'The retail agent starts the application', d: 'Pick the ACORD application that fits the risk on the Acord Apps page. Plain-language questions sit beside the real ACORD pages, which fill in as you answer.' },
  { n: '2', t: 'Complete the questions you can', d: 'A complete, clear submission is easier for an underwriter to evaluate. Skipped questions stay blank.' },
  { n: '3', t: 'Save the completed form as a PDF', d: 'Each app has a button that builds the PDF in your browser. Nothing is uploaded or sent by that button.' },
  { n: '4', t: 'The carrier decides', d: 'The submission goes to the carrier through the MGA. The carrier underwrites the risk and decides on terms. Answering an application is a request for a quote and does not bind coverage.' },
]

export default function ExcessAndSurplus() {
  return (
    <div className="mg">
      <HomeHeader current="es" />
      <main>
        <section className="mg-sec" aria-labelledby="es-h1">
          <p className="kicker">Excess and surplus lines</p>
          <h1 id="es-h1" className="mg-h1s">Some insurance is hard to place. Excess and surplus lines exists for that.</h1>
          <p className="mg-sub">Most business insurance is placed in the standard market. When a risk does not fit there, the answer is often the excess and surplus market, usually shortened to E&amp;S. This page explains it in plain terms.</p>
        </section>

        <section className="mg-sec" aria-labelledby="es-what">
          <p className="kicker">What it is</p>
          <h2 id="es-what">The market for risks the standard market will not take.</h2>
          <p className="mg-sub">Excess and surplus lines insurance covers risks that standard insurers decline or cannot fit into their standard programs. Policies are often written to suit the risk rather than from a fixed form. Rules for this market are set state by state and differ from one state to the next.</p>
        </section>

        <section className="mg-sec" aria-labelledby="es-hard">
          <p className="kicker">Why placement is difficult</p>
          <h2 id="es-hard">What makes a risk hard to place.</h2>
          <p className="mg-sub">None of these means a risk cannot be insured. They mean the standard market may not be the right place to look.</p>
          <ul className="mg-do mg-three">
            {HARD.map(x => <li key={x.t}><h3>{x.t}</h3><p>{x.d}</p></li>)}
          </ul>
        </section>

        <section className="mg-sec" aria-labelledby="es-mga">
          <p className="kicker">How an MGA fits</p>
          <h2 id="es-mga">An intermediary between the retail agent and the carrier.</h2>
          <p className="mg-sub">A managing general agent works with retail agents on one side and carriers on the other. For a hard-to-place risk, that means one place to send the submission, help making it complete and clear, and coordination with the carrier, which makes the underwriting decision. Binding and similar functions happen only where the carrier has authorized them.</p>
        </section>

        <section className="mg-sec" aria-labelledby="es-flow">
          <p className="kicker">How a submission flows</p>
          <h2 id="es-flow">From the Acord Apps pages to the carrier.</h2>
          <ol className="mg-steps">
            {FLOW.map(s => <li key={s.n}><span className="mg-step-n">{s.n}</span><h3>{s.t}</h3><p>{s.d}</p></li>)}
          </ol>
          <p className="mg-cta"><Link className="mg-btn" href="/acord-apps">Open Acord Apps</Link></p>
          <p className="mg-sub mg-after">Submissions come through retail agents only, not the general public. We can refer you to someone in our network. Available in all 50 states.</p>
        </section>
      </main>
      <HomeFooter />
    </div>
  )
}
