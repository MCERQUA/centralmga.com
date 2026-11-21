import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Central MGA | ACORD applications in plain language',
  description: 'Answer plain-language questions and watch the matching ACORD 125, 126 and 140 form pages fill in.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
