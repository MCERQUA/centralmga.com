"use client"
// ACORD 140 property section. Asked ONLY when the visitor says property coverage is wanted (_info_property_requested = Yes).
// Labels are the ACORD 140 / FIELDS.md wording made plain. Nothing is pre-answered; blank stays blank.
// Names: canonical `buildingAreaSqFt`; everything else posts as `_info_<name>` (map_quote_125.py skips that prefix; it reads the first
// five below today, the rest are listed for josh-sms to map: see PENDING_PROPERTY in scripts/probe_map.py).
import React from 'react'

export const CONSTRUCTION = ['Frame', 'Joisted Masonry', 'Non-Combustible', 'Masonry Non-Combustible', 'Modified Fire Resistive', 'Fire Resistive']
export const ROOF = ['Asphalt shingle', 'Metal', 'Tile', 'Wood shake', 'Built-up / flat', 'Single-ply', 'Other']
export const ALARM_GRADE = ['AA', 'A', 'BB', 'B', 'CC', 'C']
export const PROTECTION_ALARM_EXTENT = ['Partial', 'Full', 'Perimeter only', 'Interior only']
export const PROPERTY_INFO = [
  'property_requested', 'construction', 'protectionClass', 'buildingValue', 'contentsValue', 'yearBuilt',
  'historicalProperty', 'openSides', 'storeys', 'basements', 'buildingCodeGrade', 'roofMaterial',
  'solidFuelHeater', 'solidFuelHeaterInstalled', 'solidFuelHeaterMaker',
  'burglarAlarmDescription', 'burglarAlarmCertificateId', 'burglarAlarmCertificateExpires', 'burglarAlarmCentralStation',
  'burglarAlarmWithKeys', 'burglarAlarmInstalledBy', 'burglarAlarmExtent', 'burglarAlarmGrade',
]
export const propertyFilter = (info: Record<string, string>) =>
  info.property_requested === 'Yes' ? info : Object.fromEntries(Object.entries(info).filter(([k]) => k === 'property_requested'))

type Api = Parameters<NonNullable<React.ComponentProps<typeof import('@/components/quote/QuoteForm').QuoteForm>['extra']>>[0]

export function PropertySection({ v, set, info, setInfo, err, touch, classes: C }: Api) {
  const i = (n: string) => info[n] ?? ''
  const text = (n: string, label: string, o: { type?: string; ph?: string; canonical?: boolean } = {}) => (
    <div key={n}>
      <label className={C.label} htmlFor={`f-${o.canonical ? n : '_info_' + n}`}>{label}</label>
      <input id={`f-${o.canonical ? n : '_info_' + n}`} name={o.canonical ? n : `_info_${n}`} type={o.type ?? 'text'} placeholder={o.ph} className={C.input}
        value={o.canonical ? (v[n] ?? '') : i(n)} onChange={e => (o.canonical ? set(n, e.target.value) : setInfo(n, e.target.value))} onBlur={() => touch(n)} />
      {err(n) && <p className={C.error} role="alert">{err(n)}</p>}
    </div>
  )
  const select = (n: string, label: string, opts: string[]) => (
    <div key={n}>
      <label className={C.label} htmlFor={`f-_info_${n}`}>{label}</label>
      <select id={`f-_info_${n}`} name={`_info_${n}`} className={C.input} value={i(n)} onChange={e => setInfo(n, e.target.value)}>
        <option value="">Select</option>{opts.map(o => <option key={o}>{o}</option>)}
      </select>
    </div>
  )
  const yn = (n: string, label: string) => (
    <fieldset key={n}>
      <legend className={C.legend}>{label}</legend>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        {['Yes', 'No'].map(o => (
          <label key={o} className={C.option}><input type="radio" name={`_info_${n}`} value={o} checked={i(n) === o} onChange={() => setInfo(n, o)} />{o}</label>
        ))}
      </div>
    </fieldset>
  )
  const wanted = i('property_requested') === 'Yes'
  return (
    <section className={C.section} data-testid="property-section">
      <h3 className={C.heading}>Building and property (ACORD 140)</h3>
      {yn('property_requested', 'Do you want property coverage quoted for a building or its contents?')}
      {wanted && (
        <>
          <p className="text-sm">Answer what you know. Skipped questions stay blank on the form.</p>
          <div className={C.grid}>
            {select('construction', 'What is the building mostly built from?', CONSTRUCTION)}
            {text('protectionClass', 'Fire protection class (1 to 10, from your fire district)', { ph: 'e.g. 4' })}
            {text('buildingAreaSqFt', 'Building area in square feet', { canonical: true, ph: 'numbers only' })}
            {text('yearBuilt', 'Year the building was built', { ph: 'e.g. 1998' })}
            {text('buildingValue', 'Building value to insure, in dollars', { ph: 'numbers only' })}
            {text('contentsValue', 'Contents value to insure, in dollars', { ph: 'numbers only' })}
            {text('storeys', 'Stories above ground (not counting basement)')}
            {text('basements', 'Number of basements')}
            {text('openSides', 'Number of open sides on the structure')}
            {select('roofMaterial', 'Roof material', ROOF)}
            {text('buildingCodeGrade', 'Building code effectiveness grade')}
            {yn('historicalProperty', 'Is the building a historical property?')}
          </div>
          <div className={C.detail} style={{ gridTemplateColumns: '1fr' }}>
            {yn('solidFuelHeater', 'Does the building have a solid fuel heater (wood stove or similar)?')}
            {i('solidFuelHeater') === 'Yes' && (
              <div className={C.grid}>
                {text('solidFuelHeaterInstalled', 'Heater installation date', { type: 'date' })}
                {text('solidFuelHeaterMaker', 'Heater manufacturer')}
              </div>
            )}
          </div>
          <div className={C.detail} style={{ gridTemplateColumns: '1fr' }}>
            <p className={C.legend}>Burglar alarm (leave blank if none)</p>
            <div className={C.grid}>
              {text('burglarAlarmDescription', 'Describe the alarm protecting the building or contents')}
              {text('burglarAlarmInstalledBy', 'Alarm company that installed and services it')}
              {text('burglarAlarmCertificateId', 'Alarm certificate number')}
              {text('burglarAlarmCertificateExpires', 'Certificate expiration date', { type: 'date' })}
              {select('burglarAlarmExtent', 'How much of the building is covered', PROTECTION_ALARM_EXTENT)}
              {select('burglarAlarmGrade', 'Alarm grade', ALARM_GRADE)}
            </div>
            {yn('burglarAlarmCentralStation', 'Does the alarm ring at an alarm company (central station)?')}
            {yn('burglarAlarmWithKeys', 'Does the alarm company hold keys?')}
          </div>
        </>
      )}
    </section>
  )
}
