import { useEffect, useState, useCallback } from 'react'
import { api } from '../api'
import Loader, { PageHeader } from '../components/Loader'
import DataTable, { fmtNum, fmtLpd } from '../components/DataTable'
import FilterBar from '../components/FilterBar'
import { useParams } from 'react-router-dom'

const TABS = {
  'low-lpd':       { label: '<30 LPD MPPs', icon: '⚠️', color: 'amber', desc: 'MPPs with average daily procurement below 30 litres' },
  'single-pourer': { label: 'Single Pourer MPPs', icon: '👤', color: 'red', desc: 'MPPs with only one active pouring member' },
  'low-ts':        { label: '<12 TS MPPs', icon: '🔻', color: 'red', desc: 'MPPs with Total Solids below 12%' },
  'closed':        { label: 'Closed MPPs', icon: '🚫', color: 'red', desc: 'Procurement points currently closed / inactive' },
}

const LOW_LPD_COLS = [
  { key: 'plant_code', label: 'Code' },
  { key: 'plant_name', label: 'BMCU' },
  { key: 'ao', label: 'AO' },
  { key: 'cluster_manager', label: 'Cluster' },
  { key: 'fa', label: 'FA' },
  { key: 'mpp', label: 'MPP#' },
  { key: 'mpp_name', label: 'MPP Name' },
  { key: 'lpd', label: 'LPD', align: 'right', sortable: true, render: v => <span className={v < 15 ? 'neg' : 'warn'}>{fmtLpd(v)}</span> },
]

const SINGLE_COLS = [
  { key: 'plant_code', label: 'Code' },
  { key: 'plant_name', label: 'BMCU' },
  { key: 'ao', label: 'AO' },
  { key: 'cluster_manager', label: 'Cluster' },
  { key: 'mpp_name', label: 'MPP Name' },
  { key: 'lpd', label: 'LPD', align: 'right', fmt: 'lpd', sortable: true },
  { key: 'feed', label: 'Feed', align: 'right', fmt: 'num' },
  { key: 'pouring_members', label: 'Members', align: 'right', sortable: true },
  { key: 'total_shifts', label: 'Shifts', align: 'right', fmt: 'num' },
  { key: 'gprs_shifts', label: 'GPRS Shifts', align: 'right', fmt: 'num' },
]

export default function AlertsView() {
  const { type } = useParams()
  const tab = TABS[type] || TABS['low-lpd']

  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [enums, setEnums] = useState({ clusters: [] })
  const [cluster, setCluster] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    setLoading(true)
    const fn = {
      'low-lpd': api.lowLpd,
      'single-pourer': api.singlePourer,
      'low-ts': api.lowTs,
      'closed': api.closedMpp,
    }[type] || api.lowLpd

    fn({ cluster, page, limit: 100 }).then(r => {
      if (Array.isArray(r)) { setRows(r); setTotal(r.length) }
      else { setRows(r.data || []); setTotal(r.total || 0) }
    }).finally(() => setLoading(false))
  }, [type, cluster, page])

  useEffect(() => { api.enums().then(setEnums) }, [])
  useEffect(() => { setPage(1) }, [type, cluster])
  useEffect(() => { fetchData() }, [fetchData])

  const cols = type === 'single-pourer' ? SINGLE_COLS : LOW_LPD_COLS

  const colorMap = { amber: 'text-warning', red: 'text-danger', green: 'text-success' }

  return (
    <div>
      <PageHeader title={`${tab.icon} ${tab.label}`} sub={tab.desc} badge={`${total} found`} />

      <div className="card mb-4">
        <div className="card-body">
          <div className="flex items-start gap-3">
            <div className={`text-3xl ${colorMap[tab.color]}`}>{tab.icon}</div>
            <div>
              <div className={`text-4xl font-bold font-display ${colorMap[tab.color]}`}>{total}</div>
              <div className="text-sm text-slate-500 mt-0.5">{tab.label} in Mar'26</div>
            </div>
          </div>
        </div>
      </div>

      <FilterBar count={total}>
        <select className="select" value={cluster} onChange={e => setCluster(e.target.value)}>
          <option value="">All Clusters</option>
          {enums.clusters.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </FilterBar>

      <div className="card">
        <div className="p-4">
          {loading ? <Loader /> : (
            <>
              {type === 'closed' ? (
                <div className="tbl-wrap" style={{ maxHeight: '65vh' }}>
                  <table className="tbl">
                    <thead><tr><th>#</th><th>Data</th></tr></thead>
                    <tbody>
                      {rows.slice((page - 1) * 100, page * 100).map((row, i) => (
                        <tr key={i}><td>{(page - 1) * 100 + i + 1}</td><td>{Array.isArray(row) ? row.filter(Boolean).join(' | ') : JSON.stringify(row)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <DataTable columns={cols} data={rows} maxH="65vh" />
              )}
              {total > 100 && (
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                  <span>Page {page} of {Math.ceil(total / 100)}</span>
                  <div className="flex gap-2">
                    <button className="btn-ghost py-1 text-xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    <button className="btn-ghost py-1 text-xs" disabled={page >= Math.ceil(total / 100)} onClick={() => setPage(p => p + 1)}>Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
