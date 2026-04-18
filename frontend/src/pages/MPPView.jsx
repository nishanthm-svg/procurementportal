import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import Loader, { PageHeader } from '../components/Loader'
import DataTable, { fmtNum, fmtLpd } from '../components/DataTable'
import FilterBar from '../components/FilterBar'

const COLS = [
  { key: 'plant_code', label: 'Plant', sortable: true },
  { key: 'plant_name', label: 'BMCU' },
  { key: 'mpp', label: 'MPP#' },
  { key: 'mpp_name', label: 'MPP Name' },
  { key: 'ao', label: 'AO' },
  { key: 'cluster_manager', label: 'Cluster' },
  { key: 'fa', label: 'FA' },
  { key: 'qty', label: 'Qty (L)', align: 'right', fmt: 'num', sortable: true },
  { key: 'lpd', label: 'LPD', align: 'right', fmt: 'lpd', sortable: true },
  { key: 'fat', label: 'Fat%', align: 'right', sortable: true, render: v => v ? (v).toFixed(3) + '%' : '—' },
  { key: 'snf', label: 'SNF%', align: 'right', sortable: true, render: v => v ? (v).toFixed(3) + '%' : '—' },
  { key: 'pouring_members', label: 'Members', align: 'right', fmt: 'num', sortable: true },
]

export default function MPPView() {
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
    api.mpp({ cluster, ao, search, page, limit: 100 })
      .then(r => { setRows(r.data); setTotal(r.total) })
      .finally(() => setLoading(false))
  }, [cluster, ao, search, page])

  useEffect(() => { api.enums().then(setEnums) }, [])
  useEffect(() => { setPage(1) }, [cluster, ao, search])
  useEffect(() => { fetchData() }, [fetchData])

  const totalPages = Math.ceil(total / 100)

  return (
    <div>
      <PageHeader title="MPP Performance" sub="Village-level milk procurement points · Mar'26" badge={`${total} MPPs`} />

      <FilterBar count={total} label="MPPs">
        <select className="select" value={cluster} onChange={e => { setCluster(e.target.value); setAo('') }}>
          <option value="">All Clusters</option>
          {enums.clusters.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="select" value={ao} onChange={e => setAo(e.target.value)}>
          <option value="">All AOs</option>
          {enums.aos.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <input className="input w-52" placeholder="Search MPP / village name…" value={search} onChange={e => setSearch(e.target.value)} />
      </FilterBar>

      <div className="card">
        <div className="p-4">
          {loading ? <Loader /> : (
            <>
              <DataTable columns={COLS} data={rows} maxH="65vh" />
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Showing {rows.length} of {total} MPPs (Page {page}/{totalPages})</span>
                <div className="flex gap-2">
                  <button className="btn-ghost py-1 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pg = Math.max(1, page - 2) + i
                    if (pg > totalPages) return null
                    return <button key={pg} className={`px-2 py-1 rounded text-xs ${pg === page ? 'bg-primary text-white' : 'btn-ghost'}`} onClick={() => setPage(pg)}>{pg}</button>
                  })}
                  <button className="btn-ghost py-1 text-xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
