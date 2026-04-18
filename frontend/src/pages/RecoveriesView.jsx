import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import Loader, { PageHeader } from '../components/Loader'
import DataTable, { fmtRs, fmtNum } from '../components/DataTable'
import FilterBar from '../components/FilterBar'

const COLS = [
  { key: 'plant_code', label: 'Code' },
  { key: 'plant_name', label: 'Plant' },
  { key: 'mpp_code', label: 'MPP' },
  { key: 'member_name', label: 'Member Name' },
  { key: 'ao', label: 'AO' },
  { key: 'amount', label: 'Amount (₹)', align: 'right', sortable: true, render: v => <span className="neg font-bold">{fmtRs(v)}</span> },
  { key: 'status', label: 'Status', render: v => <span className="badge-amber">{v || 'Pending'}</span> },
]

export default function RecoveriesView() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [enums, setEnums] = useState({ clusters: [], aos: [] })
  const [ao, setAo] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    setLoading(true)
    api.recoveries({ ao, search, page, limit: 100 }).then(r => {
      setRows(r.data || []); setTotal(r.total || 0)
    }).finally(() => setLoading(false))
  }, [ao, search, page])

  useEffect(() => { api.enums().then(setEnums) }, [])
  useEffect(() => { setPage(1) }, [ao, search])
  useEffect(() => { fetchData() }, [fetchData])

  const totalAmt = rows.reduce((a, r) => a + (r.amount || 0), 0)

  return (
    <div>
      <PageHeader title="Pending Recoveries" sub="Cattle feed pending recovery (16/03/26 – 31/03/26)" badge={`₹${fmtRs(totalAmt)} shown`} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <div className="kpi-card border-t-4 border-t-danger">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Total Pending (shown)</div>
          <div className="text-2xl font-bold font-display text-danger">{fmtRs(totalAmt)}</div>
        </div>
        <div className="kpi-card border-t-4 border-t-amber-400">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Total Records</div>
          <div className="text-2xl font-bold font-display text-warning">{fmtNum(total)}</div>
          <div className="text-[11px] text-slate-400">Members with pending</div>
        </div>
        <div className="kpi-card border-t-4 border-t-slate-400">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Avg per Member</div>
          <div className="text-2xl font-bold font-display">{total ? fmtRs(totalAmt / rows.length) : '—'}</div>
        </div>
      </div>

      <FilterBar count={total} label="records">
        <select className="select" value={ao} onChange={e => setAo(e.target.value)}>
          <option value="">All AOs</option>
          {enums.aos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input className="input w-52" placeholder="Search member / plant…" value={search} onChange={e => setSearch(e.target.value)} />
      </FilterBar>

      <div className="card">
        <div className="p-4">
          {loading ? <Loader /> : (
            <>
              <DataTable columns={COLS} data={rows} maxH="65vh" />
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Page {page} of {Math.ceil(total / 100)} ({total} total)</span>
                <div className="flex gap-2">
                  <button className="btn-ghost py-1 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  <button className="btn-ghost py-1 text-xs" disabled={page >= Math.ceil(total / 100)} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
