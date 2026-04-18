import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import Loader, { PageHeader } from '../components/Loader'
import DataTable, { fmtNum, fmtLpd, fmtRs } from '../components/DataTable'
import FilterBar from '../components/FilterBar'

const COLS = [
  { key: 'plant_code', label: 'Code', sortable: true },
  { key: 'plant_name', label: 'BMCU Name', sortable: true },
  { key: 'ao', label: 'AO' },
  { key: 'cluster_manager', label: 'Cluster' },
  { key: 'type', label: 'Type', render: v => v ? <span className="badge-blue">{v}</span> : '—' },
  { key: 'cow_lpd', label: 'Cow LPD', align: 'right', fmt: 'lpd', sortable: true },
  { key: 'cow_qty', label: 'Cow Qty', align: 'right', fmt: 'num', sortable: true },
  { key: 'cow_fat', label: 'Fat%', align: 'right', sortable: true, render: v => v ? v.toFixed(3) + '%' : '—' },
  { key: 'cow_snf', label: 'SNF%', align: 'right', sortable: true, render: v => v ? v.toFixed(3) + '%' : '—' },
  { key: 'cow_amount', label: 'Amount', align: 'right', fmt: 'rs', sortable: true },
  { key: 'cow_rate', label: 'Rate/L', align: 'right', sortable: true, render: v => v ? '₹' + v.toFixed(2) : '—' },
  { key: 'buf_lpd', label: 'Buf LPD', align: 'right', fmt: 'lpd', sortable: true },
]

export default function BMCUView() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [enums, setEnums] = useState({ clusters: [], aos: [] })
  const [cluster, setCluster] = useState('')
  const [ao, setAo] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    setLoading(true)
    api.bmcu({ cluster, ao, search, page, limit: 50 })
      .then(r => { setRows(r.data); setTotal(r.total) })
      .finally(() => setLoading(false))
  }, [cluster, ao, search, page])

  useEffect(() => { api.enums().then(setEnums) }, [])
  useEffect(() => { setPage(1) }, [cluster, ao, search])
  useEffect(() => { fetchData() }, [fetchData])

  const aoOptions = ao ? enums.aos : enums.aos.filter(a => !cluster || rows.some(r => r.ao === a && r.cluster_manager === cluster))

  return (
    <div>
      <PageHeader title="BMCU Performance" sub="Plant-level milk procurement data · Mar'26" badge={`${total} Plants`} />

      <FilterBar count={total} label="BMCUs">
        <select className="select" value={cluster} onChange={e => { setCluster(e.target.value); setAo('') }}>
          <option value="">All Clusters</option>
          {enums.clusters.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="select" value={ao} onChange={e => setAo(e.target.value)}>
          <option value="">All AOs</option>
          {enums.aos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input className="input w-48" placeholder="Search plant name…" value={search} onChange={e => setSearch(e.target.value)} />
      </FilterBar>

      <div className="card">
        <div className="p-4">
          {loading ? <Loader /> : (
            <>
              <DataTable columns={COLS} data={rows} maxH="65vh" />
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Page {page} of {Math.ceil(total / 50)} ({total} total)</span>
                <div className="flex gap-2">
                  <button className="btn-ghost py-1 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  <button className="btn-ghost py-1 text-xs" disabled={page >= Math.ceil(total / 50)} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
