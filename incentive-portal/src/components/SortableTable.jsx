import { useMemo, useState } from 'react'

/**
 * columns: [{ key, label, align, render, sortable }]
 */
export default function SortableTable({ columns, rows, defaultSortKey, defaultSortDir = 'desc' }) {
  const [sortKey, setSortKey] = useState(defaultSortKey)
  const [sortDir, setSortDir] = useState(defaultSortDir)

  const sorted = useMemo(() => {
    if (!sortKey) return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      let cmp
      if (typeof av === 'number' && typeof bv === 'number') cmp = av - bv
      else cmp = String(av ?? '').localeCompare(String(bv ?? ''))
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [rows, sortKey, sortDir])

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  return (
    <div className="tbl-wrap max-h-[65vh]">
      <table className="tbl">
        <thead>
          <tr>
            {columns.map(c => (
              <th key={c.key} className={c.align === 'right' ? 'r' : ''} onClick={() => c.sortable !== false && toggleSort(c.key)}>
                {c.label}{sortKey === c.key ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={i}>
              {columns.map(c => (
                <td key={c.key} className={c.align === 'right' ? 'r' : ''}>
                  {c.render ? c.render(row[c.key], row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
