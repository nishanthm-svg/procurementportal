import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { api } from '../api'
import Loader, { PageHeader } from '../components/Loader'
import DataTable, { fmtNum, fmtRs, fmtLpd } from '../components/DataTable'
import FilterBar from '../components/FilterBar'

const COLS = [
  { key: 'ao', label: 'Area Officer' },
  { key: 'cluster_manager', label: 'Cluster Manager' },
  { key: 'cow_qty', label: 'Cow Qty (L)', align: 'right', fmt: 'num', sortable: true },
  { key: 'cow_lpd', label: 'Cow LPD', align: 'right', fmt: 'lpd', sortable: true },
  { key: 'cow_fat', label: 'Fat%', align: 'right', sortable: true, render: v => v ? v.toFixed(3) + '%' : '—' },
  { key: 'cow_snf', label: 'SNF%', align: 'right', sortable: true, render: v => v ? v.toFixed(3) + '%' : '—' },
  { key: 'cow_fat_kgs', label: 'Fat Kgs', align: 'right', fmt: 'num', sortable: true },
  { key: 'cow_snf_kgs', label: 'SNF Kgs', align: 'right', fmt: 'num', sortable: true },
  { key: 'cow_amount', label: 'Amount (₹)', align: 'right', fmt: 'rs', sortable: true },
  { key: 'cow_rate', label: 'Rate/Ltr', align: 'right', sortable: true, render: v => v ? '₹' + v.toFixed(2) : '—' },
  { key: 'buf_lpd', label: 'Buf LPD', align: 'right', fmt: 'lpd', sortable: true },
]

export default function AOView() {
  const [data, setData] = useState([])
  const [clusters, setClusters] = useState([])
  const [cluster, setCluster] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.ao(), api.enums()]).then(([d, e]) => {
      setData(d); setClusters(e.clusters)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = data.filter(r => {
    if (cluster && r.cluster_manager !== cluster) return false
    if (search && !r.ao?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const barData = filtered.slice(0, 15).map(r => ({
    name: r.ao?.split(' ').slice(-1)[0],
    full: r.ao,
    LPD: Math.round(r.cow_lpd || 0),
  }))

  if (loading) return <Loader />

  return (
    <div>
      <PageHeader title="Area Officer Performance" sub="AO-wise cow & buffalo milk procurement · Mar'26" />

      <FilterBar count={filtered.length} label="AOs">
        <select className="select" value={cluster} onChange={e => setCluster(e.target.value)}>
          <option value="">All Clusters</option>
          {clusters.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input className="input w-44" placeholder="Search AO name…" value={search} onChange={e => setSearch(e.target.value)} />
      </FilterBar>

      <div className="card mb-4">
        <div className="card-body">
          <h3 className="section-title mb-3">AO-wise Cow LPD (Top 15)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 0, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtNum(v)} />
              <Tooltip formatter={(v, n) => [fmtNum(v) + ' L/day', n]} labelFormatter={(l, p) => p?.[0]?.payload?.full || l} />
              <Bar dataKey="LPD" radius={[3, 3, 0, 0]} fill="#0c7fd4">
                {barData.map((d, i) => <Cell key={i} fill={i % 2 === 0 ? '#0c7fd4' : '#3898ec'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="section-title">AO Performance Table</h3>
          <span className="badge-blue">{filtered.length} records</span>
        </div>
        <div className="p-4">
          <DataTable columns={COLS} data={filtered} maxH="60vh" />
        </div>
      </div>
    </div>
  )
}
