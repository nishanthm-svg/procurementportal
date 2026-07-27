import { NavLink } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getMeta } from '../lib/dataLoader'

const TABS = [
  { to: '/', label: 'Lookup', icon: '🔍', end: true },
  { to: '/meeting', label: 'Meeting', icon: '📊' },
  { to: '/leaderboard', label: 'Top 5', icon: '🏆' },
  { to: '/bmcu-summary', label: 'BMCU', icon: '🏭' },
  { to: '/aco-summary', label: 'ACO', icon: '🗺️' },
]

function OnlineBadge() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  return online
    ? <span className="badge-green">● Online</span>
    : <span className="badge-blue">Offline — using saved data</span>
}

export default function NavBar() {
  const meta = getMeta()
  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥛</span>
            <div>
              <div className="font-display font-bold text-slate-800 leading-tight">Shreeja Producer Incentive</div>
              <div className="text-[11px] text-slate-400 leading-tight">Data as of {meta.generated_at?.slice(0, 10)}</div>
            </div>
          </div>
          <OnlineBadge />
        </div>
        <nav className="max-w-5xl mx-auto px-2 hidden sm:flex gap-1 pb-2">
          {TABS.map(t => (
            <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) =>
              `nav-tab ${isActive ? 'nav-tab-active' : ''}`
            }>
              <span>{t.icon}</span> {t.label}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* bottom tab bar for mobile / field use */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-20 flex">
        {TABS.map(t => (
          <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 text-[11px] font-medium ${isActive ? 'text-sky-600' : 'text-slate-400'}`
          }>
            <span className="text-lg leading-none">{t.icon}</span>
            {t.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
