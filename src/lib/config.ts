// Leads webhook. EMPTY = form disabled (posts nowhere, shows a visible "not connected" state).
// Host wires delivery later by setting NEXT_PUBLIC_LEADS_WEBHOOK_URL at build time. NEVER hardcode the production webhook here.
export const LEADS_WEBHOOK_URL: string = process.env.NEXT_PUBLIC_LEADS_WEBHOOK_URL ?? ''
export const SITE = 'centralmga.com'
export const FORM_NAME = 'quote'
export const NETLIFY_FALLBACK = '/__forms.html'
export const STORAGE_KEY = 'cmga-acord-answers-v1'
// Right pane page pictures: host poppler PNGs (~150 dpi), copied unmodified from Downloads into public/acord/.
export const PNG_PATTERN = (n: number) => `/acord/acord-125-126-140-p${String(n).padStart(2, '0')}.png`
export const ROUTES = {
  '125': { slug: 'acord-125', title: 'ACORD 125', sub: 'Commercial insurance application', pages: [1, 4] as [number, number] },
  '126': { slug: 'acord-126', title: 'ACORD 126', sub: 'Commercial general liability section', pages: [5, 8] as [number, number] },
  '140': { slug: 'acord-140', title: 'ACORD 140', sub: 'Property section', pages: [9, 11] as [number, number] },
} as const
export type RouteKey = keyof typeof ROUTES
