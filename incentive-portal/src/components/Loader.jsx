export default function Loader() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-sky-200 border-t-primary rounded-full animate-spin" />
    </div>
  )
}

export function PageHeader({ title, sub, badge, right }) {
  return (
    <div className="mb-5 pb-4 border-b border-slate-200 flex items-start justify-between gap-3 flex-wrap">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold font-display text-slate-800">{title}</h1>
          {badge && <span className="badge-blue">{badge}</span>}
        </div>
        {sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  )
}
