export default function Breadcrumb({ items }) {
  return (
    <div className="flex items-center flex-wrap gap-1.5 text-sm mb-4">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-300">/</span>}
          {it.onClick ? (
            <button onClick={it.onClick} className="text-sky-600 font-medium hover:underline">{it.label}</button>
          ) : (
            <span className="text-slate-700 font-semibold">{it.label}</span>
          )}
        </span>
      ))}
    </div>
  )
}
