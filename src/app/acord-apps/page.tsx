import { HomeHeader } from '@/components/home/HomeHeader'
import { HomeFooter } from '@/components/home/HomeFooter'
import { AppsList } from '@/components/home/AppsList'

export const metadata = {
  title: 'Acord Apps | Central MGA',
  description: 'The Central MGA ACORD applications: 125, 126, 130, 131 and 140. Plain-language questions beside the real ACORD pages. Available in all 50 states.',
}

export default function AcordApps() {
  return (
    <div className="mg">
      <HomeHeader current="apps" />
      <main>
        <section className="mg-sec" aria-labelledby="mg-apps-h">
          <p className="kicker">Acord Apps</p>
          <h1 id="mg-apps-h" className="mg-h1s">Start with the ACORD application.</h1>
          <p className="mg-sub">Each application is a plain-language questionnaire beside the real ACORD pages, which fill in as you answer. Pick the one that fits the risk. Submissions come through retail agents.</p>
          <AppsList />
        </section>
      </main>
      <HomeFooter />
    </div>
  )
}
