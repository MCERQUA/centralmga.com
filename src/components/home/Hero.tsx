export function Hero() {
  return (
    <section className="mg-hero" aria-labelledby="mg-h1">
      <div className="mg-hero-copy">
        <p className="kicker">Insurance intermediary &middot; Available in all 50 states</p>
        <h1 id="mg-h1">Central MGA is a Managing General Agent.</h1>
        <p className="mg-lede">We sit between insurance carriers and retail agents. Agents bring us the risk, we organize it for underwriting, and the carrier decides. Everything we do is built to make that handoff clear and complete. Available in all 50 states.</p>
        <p className="mg-cta">
          <a className="mg-btn" href="/acord-apps">Acord Apps</a>
          <a className="mg-link" href="#how">How an MGA works</a>
        </p>
      </div>
      <aside className="mg-def" aria-label="Definition">
        <p className="mg-def-term">MGA</p>
        <p className="mg-def-say">noun, insurance</p>
        <p className="mg-def-body"><b>Managing general agent.</b> An insurance intermediary that works between carriers and retail agents, handling parts of the process such as underwriting support and program administration where authorized by the carrier.</p>
      </aside>
    </section>
  )
}
