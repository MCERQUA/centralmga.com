// Emit [{name, kind, sample|values}] for every posted field, from the shared spec. node scripts/fields-list.mjs > /tmp/fields.json
import { fieldsFor, SELECT_OPTIONS, YN_QUESTIONS, MONEY_FIELDS, COUNT_FIELDS, PERCENT_FIELDS, OTHER_COVERAGES, SAFETY_ELEMENTS, POOL_FEATURES, RENT_EQUIPMENT_TYPES } from '../src/lib/quote/quoteSpec.ts'
const dates = new Set(['businessStartDate','desiredEffectiveDate','desiredExpirationDate','currentPolicyExpiration','lossDate'])
const out = []
for (const n of fieldsFor({})) {
  if (['name','traffic_source','landing_url'].includes(n)) continue
  if (n.startsWith('yn_')) { out.push({ name: n, kind: 'choice', values: ['Yes', 'No'] }); continue }
  if (n === 'otherCoverages') { out.push({ name: n, kind: 'choice', values: OTHER_COVERAGES.map(c => c.key) }); continue }
  if (n === 'safetyProgramElements') { out.push({ name: n, kind: 'choice', values: SAFETY_ELEMENTS }); continue }
  if (n === 'poolSafetyFeatures') { out.push({ name: n, kind: 'choice', values: POOL_FEATURES }); continue }
  if (n === 'rentEquipmentTypes') { out.push({ name: n, kind: 'choice', values: RENT_EQUIPMENT_TYPES }); continue }
  if (n.startsWith('general_coverageTerminated__') && !n.endsWith('Description')) { out.push({ name: n, kind: 'choice', values: ['Yes'] }); continue }
  if (SELECT_OPTIONS[n] && n !== 'tradeType') { out.push({ name: n, kind: 'choice', values: SELECT_OPTIONS[n] }); continue }
  let sample = 'Zebra Test'
  if (dates.has(n) || /occurenceDate|resolutionDate/.test(n)) sample = '2026-12-15'
  else if (MONEY_FIELDS.includes(n)) sample = '1234567'
  else if (COUNT_FIELDS.includes(n)) sample = '7'
  else if (PERCENT_FIELDS.includes(n) || /ownershipPercentage/.test(n)) sample = '12'
  else if (n === 'zip' || n === 'physicalZip') sample = '85004'
  else if (n === 'fein') sample = '98-7654321'
  else if (n === 'phone') sample = '(480) 555-0199'
  else if (n === 'email') sample = 'zebra@example.com'
  else if (n === 'yearBusinessStarted') sample = '2011'
  out.push({ name: n, kind: 'text', sample })
}
// property section (_info_ names; mapped today by map_quote_125.py): construction, protectionClass, buildingValue, contentsValue
out.push({ name: '_info_construction', kind: 'choice', values: ['Frame', 'Joisted Masonry', 'Non-Combustible', 'Masonry Non-Combustible', 'Modified Fire Resistive', 'Fire Resistive'] })
out.push({ name: '_info_protectionClass', kind: 'text', sample: '4' })
out.push({ name: '_info_buildingValue', kind: 'text', sample: '1234567' })
out.push({ name: '_info_contentsValue', kind: 'text', sample: '1234567' })
out.push({ name: 'name', kind: 'text', sample: 'Zebra Test' })
console.log(JSON.stringify(out))
