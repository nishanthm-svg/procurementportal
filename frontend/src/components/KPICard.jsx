export default function KPICard({ label, value, sub, color = 'blue', icon, pct }) {
  const colors = {
    blue:   'border-t-primary',
    green:  'border-t-success',
    red:    'border-t-danger',
    amber:  'border-t-warning',
    purple: 'border-t-purple-500',
  }
  return (
    <div className={`kpi-card border-t-4 ${colors[color]}`}>
      <div className="flex items-start justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        {icon && <span className="text-lg opacity-60">{icon}</span>}
      </div>
      <div className="text-2xl font-bold font-display text-slate-800 leading-tight">{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-1">{sub}</div>}
      {pct != null && (
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
            <span>vs target</span><span>{pct}%</span>
          </div>
          <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-success' : pct >= 90 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
        </div>
      )}
    </div>
  )
}
