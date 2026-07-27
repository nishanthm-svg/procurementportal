import { useMemo, useState } from 'react'

/**
 * Touch-friendly searchable picker. Shows a search box + a scrollable list of
 * items; each item renders via `renderItem`. Built for field use — big tap
 * targets, no dropdown menu quirks.
 */
export default function SearchPicker({ items, placeholder, getSearchText, renderItem, onSelect, emptyLabel }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(item => getSearchText(item).toLowerCase().includes(q))
  }, [items, query, getSearchText])

  return (
    <div>
      <input
        className="input mb-3"
        placeholder={placeholder}
        value={query}
        onChange={e => setQuery(e.target.value)}
        autoFocus
      />
      <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">{emptyLabel || 'No matches'}</p>
        )}
        {filtered.map((item, i) => (
          <button key={i} className="pick-item" onClick={() => onSelect(item)}>
            {renderItem(item)}
          </button>
        ))}
      </div>
    </div>
  )
}
