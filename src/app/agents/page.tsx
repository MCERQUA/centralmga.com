import { HomeHeader } from '@/components/home/HomeHeader'
import { HomeFooter } from '@/components/home/HomeFooter'
import { AgentSignup } from '@/components/AgentSignup'

export const metadata = {
  title: 'Agents | Central MGA',
  description: 'Retail agents: sign in to the Central MGA agent portal (coming soon) or sign up to sell with Central MGA. Available in all 50 states.',
}

export default function Agents() {
  return (
    <div className="mg">
      <HomeHeader current="agents" />
      <main>
        <section className="mg-sec" aria-labelledby="ag-h1">
          <p className="kicker">Agents</p>
          <h1 id="ag-h1" className="mg-h1s">For retail agents.</h1>
          <p className="mg-sub">Sign in to the agent portal, or ask to sell with Central MGA. Submissions come through retail agents only, not the general public.</p>
          <div className="ag-portal" role="group" aria-labelledby="ag-portal-h">
            <h2 id="ag-portal-h">Agent portal sign-in: coming soon</h2>
            <p>The portal is not open yet, so there is nothing to sign in to. Sign-in will appear here when it is ready.</p>
            <p><span className="ag-soon" aria-disabled="true">Sign in (not available yet)</span></p>
          </div>
        </section>
        <section className="mg-sec" id="sign-up" aria-labelledby="ag-su">
          <p className="kicker">Sign up</p>
          <h2 id="ag-su">Sign up to sell with Central.</h2>
          <p className="mg-sub">Tell us about your agency. Only name, agency, phone and email are required.</p>
          <AgentSignup />
        </section>
      </main>
      <HomeFooter hideQuoteNote />
    </div>
  )
}
