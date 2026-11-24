const PARTIES = [
  { who: 'Principal', what: 'The party that needs the bond and promises to perform an obligation.' },
  { who: 'Obligee', what: 'The party that requires the bond and is protected by it.' },
  { who: 'Surety', what: 'The party that backs the principal\'s promise to the obligee.' },
]

export function Surety() {
  return (
    <section className="mg-sec" id="surety" aria-labelledby="mg-surety">
      <p className="kicker">Surety bonds</p>
      <h2 id="mg-surety">Surety bonds, in plain terms.</h2>
      <p className="mg-sub">A surety bond is a three-party agreement. It assures the obligee that the principal will meet an obligation, with the surety standing behind that promise.</p>
      <ul className="mg-do mg-three">
        {PARTIES.map(x => <li key={x.who}><h3>{x.who}</h3><p>{x.what}</p></li>)}
      </ul>
      <p className="mg-sub mg-after">A managing general agent can work with carriers on bond programs, in the same intermediary role it plays for other lines of insurance.</p>
    </section>
  )
}
