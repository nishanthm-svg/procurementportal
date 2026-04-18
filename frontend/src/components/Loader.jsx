export default function Loader() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-primary rounded-full animate-spin" />
    </div>
  )
}

export function PageHeader({ title, sub, badge }) {
  return (
    <div className="mb-5 pb-4 border-b border-slate-200">
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold font-display text-slate-800">{title}</h1>
        {badge && <span className="badge-blue">{badge}</span>}
      </div>
      {sub && <p className="text-sm text-slate-500 mt-0.5">{sub}</p>}
    </div>
  )
}

export function SectionHeader({ title, count, colorCount }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0 pb-2 border-b border-slate-200">
      <h2 className="text-[13px] font-bold font-display text-slate-700">{title}</h2>
      {count != null && (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${colorCount === 'red' ? 'bg-danger-light text-danger' : 'bg-blue-50 text-primary'}`}>
          {count}
        </span>
      )}
    </div>
  )
}
