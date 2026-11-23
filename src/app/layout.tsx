import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Central MGA | Managing General Agent',
  description: 'Central MGA is a managing general agent, an insurance intermediary working between carriers and retail agents. Submit a risk with our ACORD applications.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
