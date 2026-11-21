// Overlay for /acord-130: mirrors what map_acord130.py (site_to_intake + build) writes for the POSTED payload, at the real PDF widget rects.
// Verified against the real mapper by scripts/compare130.mjs-style check (see build report): same leaves, same text.
import map from '../data/acord130-map.json'
import { YN_130, COVER_130, STATE_NAME, MAX_OWNERS, MAX_CLASSES, MAX_PRIOR, MAX_TRAVEL_STATES, ownerKeys, classKeys, priorKeys, ENTITY_130, parseStates } from './acord130Spec'

export type Item = { pdf: string; page: number; rect: number[]; text?: string; check?: boolean; pending?: boolean }
const M = map as unknown as { rects: Record<string, { page: number; rect: number[] }[]>; yn: Record<string, string>; expl: Record<string, string> }
type Kind = 'raw' | 'date' | 'code' | 'statename' | 'yn' | 'inc'
type Tgt = { leaf: string; kind: Kind; onlyInc?: boolean }
const L = 'ABCDEFGHIJKLMN'
const ENT: Record<string, string> = { 'Sole proprietor': 'SoleProprietor', Partnership: 'Partnership', Corporation: 'Corporation', 'Subchapter S Corporation': 'SubchapterSCorporation',
  'Limited Liability Corporation': 'LimitedLiabilityCorporation', 'Joint venture': 'JointVenture', Trust: 'Trust', 'Unincorporated association': 'UnincorporatedAssociation' }
const entLeaf = (k: string) => `NamedInsured_LegalEntity_${k}Indicator_A[0]`

const T: Record<string, Tgt[]> = {}
const add = (name: string, leaf: string, kind: Kind = 'raw', onlyInc = false) => { (T[name] ??= []).push({ leaf, kind, onlyInc }) }
const SINGLE: Record<string, string> = {
  businessName: 'NamedInsured_FullName_A[0]', phone: 'NamedInsured_Primary_PhoneNumber_A[0]', secondaryPhone: 'NamedInsured_Secondary_PhoneNumber_A[0]',
  email: 'NamedInsured_Primary_EmailAddress_A[0]', websiteUrl: 'NamedInsured_Primary_WebsiteAddress_A[0]', yearsInBusiness: 'NamedInsured_InBusinessYearCount_A[0]',
  fein: 'NamedInsured_TaxIdentifier_A[0]', sicCode: 'NamedInsured_SICCode_A[0]', naicsCode: 'NamedInsured_NAICSCode_A[0]', ncciRiskId: 'NamedInsured_NCCIRiskIdentifier_A[0]',
  ratingBureauId: 'NamedInsured_RatingBureauIdentifier_A[0]', streetAddress: 'Location_PhysicalAddress_LineOne_A[0]', city: 'Location_PhysicalAddress_CityName_A[0]',
  physicalCounty: 'Location_PhysicalAddress_CountyName_A[0]', zip: 'Location_PhysicalAddress_PostalCode_A[0]',
  mailingAddress: 'NamedInsured_MailingAddress_LineOne_A[0]', mailingCity: 'NamedInsured_MailingAddress_CityName_A[0]', mailingZip: 'NamedInsured_MailingAddress_PostalCode_A[0]',
  experienceMod: 'WorkersCompensationStateCoverage_ExperienceOrMerit_ModificationFactor_A[0]', operationsDescription: 'CommercialPolicy_OperationsDescription_A[0]',
  inspectionContactName: 'NamedInsured_InspectionContact_FullName_A[0]', inspectionContactPhone: 'NamedInsured_InspectionContact_PhoneNumber_A[0]',
  accountingContactName: 'NamedInsured_AccountingContact_FullName_A[0]', accountingContactPhone: 'NamedInsured_AccountingContact_PhoneNumber_A[0]',
  claimsContactName: 'NamedInsured_ClaimContact_FullName_A[0]', claimsContactPhone: 'NamedInsured_ClaimContact_PhoneNumber_A[0]',
  elEachAccident: 'WorkersCompensationEmployersLiability_EmployersLiability_EachAccidentLimitAmount_A[0]',
  elDiseasePolicy: 'WorkersCompensationEmployersLiability_EmployersLiability_DiseasePolicyLimitAmount_A[0]',
  elDiseaseEachEmployee: 'WorkersCompensationEmployersLiability_EmployersLiability_DiseaseEachEmployeeLimitAmount_A[0]',
}
for (const [k, l] of Object.entries(SINGLE)) add(k, l)
add('physicalState', 'Location_PhysicalAddress_StateOrProvinceCode_A[0]', 'code')
add('mailingState', 'NamedInsured_MailingAddress_StateOrProvinceCode_A[0]', 'code')
add('desiredEffectiveDate', 'Policy_EffectiveDate_A[0]', 'date'); add('desiredExpirationDate', 'Policy_ExpirationDate_A[0]', 'date')
add('workStates', 'WorkersCompensation_PartOne_StateOrProvinceCode_A[0]', 'code')
add('workStates', 'WorkersCompensation_RateState_StateOrProvinceName_A[0]', 'statename'); add('workStates', 'WorkersCompensation_RateState_StateOrProvinceName_A[1]', 'statename')
for (let n = 1; n <= MAX_OWNERS; n++) {
  const k = ownerKeys(n), l = L[n - 1]
  add(k.name, `WorkersCompensation_Individual_FullName_${l}[0]`); add(k.dob, `WorkersCompensation_Individual_BirthDate_${l}[0]`, 'date')
  add(k.title, `WorkersCompensation_Individual_TitleRelationshipCode_${l}[0]`); add(k.pct, `WorkersCompensation_Individual_OwnershipPercent_${l}[0]`)
  add(k.duties, `WorkersCompensation_Individual_DutiesDescription_${l}[0]`); add(k.inc, `WorkersCompensation_Individual_IncludedExcludedCode_${l}[0]`, 'inc')
  add(k.cls, `WorkersCompensation_Individual_RatingClassificationCode_${l}[0]`, 'raw', true); add(k.pay, `WorkersCompensation_Individual_RemunerationAmount_${l}[0]`, 'raw', true)
}
for (let n = 1; n <= MAX_CLASSES; n++) {
  const k = classKeys(n), l = L[n - 1]
  add(k.code, `WorkersCompensation_RateClass_ClassificationCode_${l}[0]`); add(k.duties, `WorkersCompensation_RateClass_DutiesDescription_${l}[0]`)
  add(k.ft, `WorkersCompensation_RateClass_FullTimeEmployeeCount_${l}[0]`); add(k.pt, `WorkersCompensation_RateClass_PartTimeEmployeeCount_${l}[0]`)
  add(k.pay, `WorkersCompensation_RateClass_RemunerationAmount_${l}[0]`)
}
for (let n = 1; n <= MAX_PRIOR; n++) {
  const k = priorKeys(n), l = L[n - 1]
  add(k.year, `PriorCoverage_EffectiveYear_${l}[0]`); add(k.carrier, `PriorCoverage_InsurerFullName_${l}[0]`); add(k.prem, `PriorCoverage_TotalPremiumAmount_${l}[0]`)
  add(k.mod, `PriorCoverage_ModificationFactor_${l}[0]`); add(k.claims, `LossHistory_ClaimCount_${l}[0]`); add(k.paid, `LossHistory_PaidAmount_${l}[0]`); add(k.res, `LossHistory_ReservedAmount_${l}[0]`)
}
for (const q of YN_130) { add(`yn_${q.key}`, M.yn[q.key], 'yn'); add(`ynExplain_${q.key}`, M.expl[q.key]) }
const BOX: Record<string, string> = { wcCoverageUSLH: 'WorkersCompensation_Coverage_USLHIndicator_A[0]', wcCoverageVoluntaryComp: 'WorkersCompensation_Coverage_VoluntaryCompensationIndicator_A[0]',
  wcCoverageForeign: 'WorkersCompensation_Coverage_ForeignCoverageIndicator_A[0]', wcCoverageManagedCare: 'WorkersCompensation_Coverage_ManagedCareOptionIndicator_A[0]',
  wcDeductibleMedical: 'WorkersCompensation_DeductibleType_MedicalIndicator_A[0]', wcDeductibleIndemnity: 'WorkersCompensation_DeductibleType_IndemnityIndicator_A[0]',
  wcCoverageOther: 'WorkersCompensation_Coverage_OtherIndicator_A[0]', wcDeductibleOther: 'WorkersCompensation_DeductibleType_OtherIndicator_A[0]',
  lossRunsAttached: 'WorkersCompensationLineOfBusiness_Attachment_LossRunIndicator_A[0]', informationPracticesNotice: 'Policy_InformationPracticesNoticeIndicator_A[0]' }
/** Keys posted by the form that the real map_acord130.py (site_to_intake) does NOT yet read (verified by probe, see build report). Drawn with a dotted underline so the preview never claims more than the mapper writes. */
export const PENDING_130 = new Set(['wcDeductibleOther', 'lossRunsAttached', 'informationPracticesNotice', 'wcCoverageOtherDescription', 'wcDeductibleOtherDescription', 'inspectionContactEmail', 'workFromHomeCount', 'travelStates'])
const PEND_TEXT: Record<string, string> = { wcCoverageOtherDescription: 'WorkersCompensation_Coverage_OtherDescription_A[0]', wcDeductibleOtherDescription: 'WorkersCompensation_DeductibleType_OtherDescription_A[0]',
  inspectionContactEmail: 'NamedInsured_InspectionContact_EmailAddress_A[0]', workFromHomeCount: 'WorkersCompensationLineOfBusiness_Question_AtHomeEmployeeCount_A[0]' }
const travelLeaf = (i: number) => `WorkersCompensation_PartThree_StateOrProvinceCode_${L[i]}[0]`
void COVER_130; void ENTITY_130

const mdY = (v: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v); return m ? `${m[2]}/${m[3]}/${m[1]}` : v }
const rectsOf = (leaf: string) => M.rects[leaf] ?? []
const entityLeaves = () => [...Object.values(ENT).map(entLeaf), entLeaf('Other')]

/** Widgets a posted/typed field prints into (focus -> page + highlight). */
export function widgets130(name: string): Item[] {
  let leaves: string[]
  if (name === 'entityType' || name === 'entityOther') leaves = [...entityLeaves(), 'NamedInsured_LegalEntity_OtherDescription_A[0]']
  else if (name === 'mailingSameAsPhysical') leaves = ['NamedInsured_MailingAddress_LineOne_A[0]']
  else if (BOX[name]) leaves = [BOX[name]]
  else if (PEND_TEXT[name]) leaves = [PEND_TEXT[name]]
  else if (name === 'travelStates') leaves = Array.from({ length: MAX_TRAVEL_STATES }, (_, i) => travelLeaf(i))
  else leaves = (T[name] ?? []).map(t => t.leaf)
  return leaves.flatMap(l => rectsOf(l).map(w => ({ pdf: l, page: w.page, rect: w.rect })))
}

/** Overlay items for a posted payload (see buildPayload130). */
export function computeItems130(P: Record<string, string>): Item[] {
  const text: Record<string, string> = {}, chk = new Set<string>()
  chk.add('Policy_Status_QuoteIndicator_A[0]') // the mapper always marks this as a QUOTE submission
  for (const [name, tg] of Object.entries(T)) {
    const val = (P[name] ?? '').trim(); if (!val) continue
    for (const t of tg) {
      if (t.onlyInc && !/^inc/i.test(P[name.replace(/(ownerClassCode|ownerPayroll)/, 'ownerIncludedExcluded')] ?? '')) continue
      text[t.leaf] = t.kind === 'date' ? mdY(val) : t.kind === 'statename' ? (STATE_NAME[val.toUpperCase()] ?? '') : t.kind === 'yn' ? (/^y/i.test(val) ? 'Y' : 'N') : t.kind === 'inc' ? (/^inc/i.test(val) ? 'INC' : /^exc/i.test(val) ? 'EXC' : '') : val
    }
  }
  // owner rows: state printed is the LOCATION state (mapper rule), only for rows that exist
  for (let n = 1; n <= MAX_OWNERS; n++) { const k = ownerKeys(n); if (Object.values(k).some(x => (P[x] ?? '').trim()) && (P.physicalState ?? '').trim()) text[`WorkersCompensation_Individual_StateOrProvinceCode_${L[n - 1]}[0]`] = P.physicalState.trim() }
  const ent = P.entityType ?? ''
  if (ent) { if (ENT[ent]) chk.add(entLeaf(ENT[ent])); else { chk.add(entLeaf('Other')); text['NamedInsured_LegalEntity_OtherDescription_A[0]'] = ent } }
  const pendingLeaves = new Set<string>()
  for (const [k, leaf] of Object.entries(BOX)) {
    const val = P[k] ?? ''
    if (k === 'lossRunsAttached' ? val === 'Yes' : val !== '') { chk.add(leaf); if (PENDING_130.has(k)) pendingLeaves.add(leaf) }
  }
  for (const [k, leaf] of Object.entries(PEND_TEXT)) { const t = (P[k] ?? '').trim(); if (t) { text[leaf] = t; pendingLeaves.add(leaf) } }
  if ((P.travelStates ?? '').trim()) parseStates(P.travelStates).slice(0, MAX_TRAVEL_STATES).forEach((c, i) => { if (c) { text[travelLeaf(i)] = c; pendingLeaves.add(travelLeaf(i)) } })
  const out: Item[] = []
  for (const [pdf, t] of Object.entries(text)) if (t) for (const w of rectsOf(pdf)) out.push({ pdf, page: w.page, rect: w.rect, text: t, pending: pendingLeaves.has(pdf) })
  for (const pdf of chk) for (const w of rectsOf(pdf)) out.push({ pdf, page: w.page, rect: w.rect, check: true, pending: pendingLeaves.has(pdf) })
  return out
}
/** Leaf -> text map for the comparison against the real mapper output. */
export function leafTexts130(P: Record<string, string>) {
  const o: Record<string, string> = {}
  for (const i of computeItems130(P)) o[i.pdf] = i.check ? '/1' : (i.text ?? '')
  return o
}
