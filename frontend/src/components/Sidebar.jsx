import { useLocation, useNavigate } from 'react-router-dom'

const NAV = [
  { section: 'Hierarchy', items: [
    { to: '/', icon: '🏢', label: 'Organisation' },
    { to: '/cluster', icon: '🏛️', label: 'All Clusters' },
    { to: '/ao', icon: '👥', label: 'All AOs' },
  ]},
  { section: 'Data Views', items: [
    { to: '/bmcu', icon: '🏭', label: 'BMCUs' },
    { to: '/mpp', icon: '📍', label: 'MPPs' },
  ]},
  { section: 'Analytics', items: [
    { to: '/budget', icon: '📈', label: 'Budget vs Actual' },
    { to: '/lfl', icon: '🔁', label: 'LFL Analysis' },
    { to: '/gprs', icon: '📡', label: 'GPRS Tracking' },
  ]},
  { section: 'Alerts', items: [
    { to: '/alerts/low-lpd', icon: '⚠️', label: '<30 LPD MPPs', badgeKey: 'low_lpd_count' },
    { to: '/alerts/single-pourer', icon: '👤', label: 'Single Pourer', badgeKey: 'single_pourer_count' },
    { to: '/alerts/low-ts', icon: '🔻', label: '<12 TS MPPs' },
    { to: '/alerts/closed', icon: '🚫', label: 'Closed MPPs' },
  ]},
  { section: 'Operations', items: [
    { to: '/recoveries', icon: '💳', label: 'Pending Recoveries' },
    { to: '/manpower', icon: '👷', label: 'Manpower Costs' },
  ]},
  { section: 'Grievances', items: [
    { to: '/grievance', icon: '📣', label: 'Grievance Dashboard', badgeKey: 'grievance_overdue' },
  ]},
]

export default function Sidebar({ summary, open, onClose }) {
  const loc = useLocation()
  const nav = useNavigate()

  function go(to) { nav(to); onClose?.() }
  function isActive(to) {
    if (to === '/') return loc.pathname === '/'
    return loc.pathname.startsWith(to)
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onClose} />}

      <aside className={`
        fixed top-0 left-0 h-screen w-56 bg-white border-r border-slate-200
        flex flex-col z-50 transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:top-14 lg:h-[calc(100vh-56px)] lg:z-30
      `}>
        {/* Mobile header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-100 lg:hidden">
          <span className="font-display font-bold text-sm text-slate-800">Menu</span>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV.map(({ section, items }) => (
            <div key={section}>
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-3 pt-3 pb-1">{section}</div>
              {items.map(({ to, icon, label, badgeKey }) => {
                const active = isActive(to)
                const badge = badgeKey && summary?.[badgeKey]
                return (
                  <div key={to} className={`nav-item ${active ? 'active' : ''} relative`} onClick={() => go(to)}>
                    <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
                    <span className="flex-1 leading-tight">{label}</span>
                    {badge > 0 && (
                      <span className="badge-red text-[10px] font-bold px-1.5 py-0">{badge}</span>
                    )}
                    {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r" />}
                  </div>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-slate-100">
          <div className="text-[10px] text-slate-400 text-center">Data: Mar&apos;26</div>
        </div>
      </aside>
    </>
  )
}
