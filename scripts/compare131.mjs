// Synthetic scenarios -> validate131 + buildPayload131 -> (a) real map_acord131.py (python3 3.9, NO -I), (b) the site's TS port. Diffs {PDF field: text}.
// Usage: node scripts/compare131.mjs <outdir>   (nothing is sent anywhere; all data synthetic)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { validate131, buildPayload131, YN_131, TERMS, termFrom, termTo, GL_LIMITS, K_OCC, K_TAIL, K_EXCLUDED, INTERNAL } from '../src/lib/acord131Spec.ts'
import { mapPayload131 } from '../src/lib/map131.ts'
const out = process.argv[2]; mkdirSync(out, { recursive: true })
const N = JSON.parse(readFileSync('src/data/acord131-map.json', 'utf8')).names
const base = () => {
  const v = {
    'legal entity name': 'Synthetic Concrete LLC', [INTERNAL.street]: '100 Test Way', [INTERNAL.city]: 'Tucson', [INTERNAL.state]: 'AZ', [INTERNAL.zip]: '85701',
    name: 'Synthetic Contact', phone: '520-555-0142', email: 'synthetic-131@example.com',
    'description of operations': 'Residential and light commercial concrete flatwork', 'annual payroll': '1450000', 'annual gross sales': '6200000', 'foreign gross sales': '0',
    'number of employees': '24', 'describe the typical jobs you perform': 'Driveways, sidewalks, footings and slabs.',
    'new or renewal': 'New', 'umbrella effective date': '2027-01-01', 'umbrella expiration date': '2028-01-01',
    'umbrella limit requested - each occurrence': '5000000', 'umbrella limit requested - aggregate': '5000000', 'self-insured retention requested': '10000',
    'do you want first dollar defense': 'No', 'billing preference': 'Agency bill',
    'underlying auto carrier and policy number': 'Pinnacle West Casualty', 'underlying auto combined single limit': '1000000',
    'underlying general liability carrier and policy number': 'Pinnacle West Casualty', [K_OCC]: 'Occurrence',
    'underlying employers liability carrier and policy number': 'Copper State Work Comp',
    'underlying employers liability each accident limit': '1000000', 'underlying employers liability disease each employee limit': '1000000',
    'are defense costs within the aggregate, a separate limit, or unlimited': 'A separate limit', [K_EXCLUDED]: 'No', [INTERNAL.anyClaims]: 'No',
  }
  for (const t of TERMS) { v[termFrom(t)] = '2026-03-01'; v[termTo(t)] = '2027-03-01' }
  for (const g of GL_LIMITS) v[g.key] = '1000000'
  for (const q of YN_131) v[q.key] = 'No'
  return v
}
const A = base(); A['do you carry hired and non-owned auto coverage'] = 'Yes'
const B = base(); Object.assign(B, {
  'new or renewal': 'Renewal', 'do you want first dollar defense': 'Yes', 'billing preference': 'Direct bill', [K_OCC]: 'Claims made', [K_TAIL]: 'Yes',
  'retroactive date of the current underlying GL policy': '2019-05-01', 'date you entered uninterrupted claims made coverage': '2018-02-01', 'retroactive date you are proposing for the umbrella': '2019-05-01',
  'are defense costs within the aggregate, a separate limit, or unlimited': 'Within aggregate limits', [K_EXCLUDED]: 'Yes',
  'names and locations of any subsidiary companies': 'Synthetic Paving LLC, Tucson AZ',
  [INTERNAL.anyClaims]: 'Yes', 'liability claims over $10,000 in the past 5 years': '03/2024 slab collapse, paid $42,000, $0 open',
  'do you own or lease watercraft': 'Yes', 'watercraft owned - number, length and horsepower': '2 boats, 24 ft, 150 hp',
  'have you had a product liability loss in the past 3 years': 'Yes', 'describe the product liability loss': '2025 mix defect, $9,000',
  'do you perform bridge, dam or marine work': 'Yes', 'do your products contain hazardous materials needing special disposal': 'Yes', 'do you own or lease watercraft ': undefined,
})
const C = base(); Object.assign(C, { 'underlying general liability policy term:from': '2026-07-01', 'underlying general liability policy term:to': '2027-07-01', 'do your subcontractors carry lower coverages or limits than you do': 'Yes', 'do you use an advertising agency': 'Yes', "is any coverage provided under that agency's policy": 'Yes', 'are you self-insured in any state': 'Yes', 'do you provide coverage for doctors or nurses': 'Yes' })
let bad = 0
for (const [id, v] of [['A', A], ['B', B], ['C', C]]) {
  const errs = validate131(v); if (Object.keys(errs).length) { console.log(id, 'VALIDATION FAILED', errs); bad++; continue }
  const P = buildPayload131(v, 'centralmga.com')
  writeFileSync(join(out, `payload-${id}.json`), JSON.stringify(P, null, 1))
  const real = JSON.parse(execFileSync('python3', [join(homedir(), 'josh-workspace/skills/acord-forms/scripts/map_acord131.py'), join(out, `payload-${id}.json`)], { stdio: ['ignore', 'pipe', 'pipe'] }).toString()).text
  const mine = mapPayload131(P, N)
  const keys = [...new Set([...Object.keys(real), ...Object.keys(mine)])].sort(); let d = 0
  for (const k of keys) if (real[k] !== mine[k]) { d++; console.log(id, 'DIFF', k, JSON.stringify(real[k]), JSON.stringify(mine[k])) }
  console.log(id, `real=${Object.keys(real).length} ts=${Object.keys(mine).length} diffs=${d}`); bad += d
}
process.exit(bad ? 1 : 0)
