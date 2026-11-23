import { HomeHeader } from '@/components/home/HomeHeader'
import { Hero } from '@/components/home/Hero'
import { HowItWorks } from '@/components/home/HowItWorks'
import { WhatWeDo } from '@/components/home/WhatWeDo'
import { SubmitRisk } from '@/components/home/SubmitRisk'
import { Faq, FAQ } from '@/components/home/Faq'
import { HomeFooter } from '@/components/home/HomeFooter'

const SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'InsuranceAgency',
    name: 'Central MGA',
    url: 'https://centralmga.com/',
    description: 'Central MGA is a managing general agent: an insurance intermediary that works between insurance carriers and retail agents.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  },
]

export default function Home() {
  return (
    <div className="mg">
      <HomeHeader />
      <main>
        <Hero />
        <HowItWorks />
        <WhatWeDo />
        <SubmitRisk />
        <Faq />
      </main>
      <HomeFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA).replace(/</g, '\\u003c') }} />
    </div>
  )
}
