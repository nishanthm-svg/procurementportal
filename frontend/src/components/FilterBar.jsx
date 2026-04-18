export default function FilterBar({ children, count, label = 'records' }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      {children}
      {count != null && (
        <span className="ml-auto text-[11px] text-slate-400 font-medium">
          {count.toLocaleString()} {label}
        </span>
      )}
    </div>
  )
}
