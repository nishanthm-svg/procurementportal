import { useState } from 'react'

export default function DataTable({ columns, data, maxH = '65vh', caption }) {
  const [sort, setSort] = useState({ key: null, dir: 1 })

  const sorted = sort.key
    ? [...data].sort((a, b) => {
        const av = a[sort.key], bv = b[sort.key]
        if (av == null) return 1; if (bv == null) return -1
        return (av < bv ? -1 : av > bv ? 1 : 0) * sort.dir
      })
    : data

  function toggleSort(key) {
    setSort(s => s.key === key ? { key, dir: -s.dir } : { key, dir: -1 })
  }

  function fmtCell(col, row) {
    const v = row[col.key]
    if (col.render) return col.render(v, row)
    if (v == null) return <span className="text-slate-300">—</span>
    if (col.fmt === 'num') return fmtNum(v)
    if (col.fmt === 'pct') return fmtPct(v)
    if (col.fmt === 'rs') return fmtRs(v)
    if (col.fmt === 'lpd') return fmtLpd(v)
    return v
  }

  return (
    <div className="tbl-wrap" style={{ maxHeight: maxH }}>
      <table className="tbl">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className={col.align === 'right' ? 'r cursor-pointer select-none' : 'cursor-pointer select-none'}
                onClick={() => col.sortable !== false && toggleSort(col.key)}>
                {col.label}
                {sort.key === col.key && <span className="ml-1 text-primary">{sort.dir === -1 ? '↓' : '↑'}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center py-8 text-slate-400">No data</td></tr>
          ) : sorted.map((row, i) => (
            <tr key={i}>
              {columns.map(col => (
                <td key={col.key} className={col.align === 'right' ? 'r' : ''}>
                  {fmtCell(col, row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {caption && <div className="text-[11px] text-slate-400 px-3 py-2 border-t border-slate-100">{caption}</div>}
    </div>
  )
}

export function fmtNum(v, dec = 0) {
  if (v == null) return '—'
  return Number(v).toLocaleString('en-IN', { maximumFractionDigits: dec })
}
export function fmtPct(v, dec = 2) {
  if (v == null) return '—'
  return (Number(v) * (Math.abs(v) <= 1 ? 100 : 1)).toFixed(dec) + '%'
}
export function fmtRs(v) {
  if (v == null) return '—'
  const n = Number(v)
  if (Math.abs(n) >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr'
  if (Math.abs(n) >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L'
  return '₹' + n.toLocaleString('en-IN')
}
export function fmtLpd(v) {
  if (v == null) return '—'
  return Number(v).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}
export function fmtGrowth(v) {
  if (v == null) return '—'
  const pct = (Math.abs(v) <= 1 ? v * 100 : v).toFixed(1)
  return <span className={v >= 0 ? 'pos' : 'neg'}>{v >= 0 ? '+' : ''}{pct}%</span>
}
