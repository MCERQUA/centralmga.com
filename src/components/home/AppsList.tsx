import Link from 'next/link'
import { APPS } from './apps'

export function AppsList() {
  return (
    <ol className="cards mg-apps">
      {APPS.map((a, i) => (
        <li key={a.href}>
          <Link href={a.href}>
            <span className="num">{String(i + 1).padStart(2, '0')}</span>
            <h3>{a.code}</h3>
            <p className="what">{a.name}</p>
            <p>{a.note}</p>
            <span className="go">Open the application</span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
