export default function StatCard({ label, value, sub, tone = 'sky' }) {
  const toneClasses = {
    sky: 'border-sky-100 text-sky-600',
    gold: 'border-gold-light text-gold',
    green: 'border-emerald-100 text-emerald-600',
  }[tone]
  return (
    <div className={`card p-4 border-l-4 ${toneClasses}`}>
      <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</div>
      <div className="text-2xl font-bold font-display text-slate-800 mt-1 tabular-nums">{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}
