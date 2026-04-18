import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from 'recharts'
import { api } from '../api'
import Loader, { PageHeader, SectionHeader } from '../components/Loader'
import DataTable, { fmtNum, fmtLpd } from '../components/DataTable'
import FilterBar from '../components/FilterBar'

const BVA_COLS = [
  { key: 'plant_code', label: 'Code', sortable: true },
  { key: 'plant_name', label: 'BMCU Name', sortable: true },
  { key: 'ao', label: 'AO' },
  { key: 'cluster_manager', label: 'Cluster' },
  { key: 'budget', label: 'Budget LPD', align: 'right', fmt: 'lpd', sortable: true },
  { key: 'actual', label: 'Actual LPD', align: 'right', fmt: 'lpd', sortable: true },
  { key: 'variance', label: 'Variance', align: 'right', sortable: true, render: v => <span className={v >= 0 ? 'pos' : 'neg'}>{v >= 0 ? '+' : ''}{fmtLpd(v)}</span> },
  { key: 'variance_pct', label: 'Var%', align: 'right', sortable: true, render: v => <span className={v >= 0 ? 'pos' : 'neg'}>{v >= 0 ? '+' : ''}{v?.toFixed(1)}%</span> },
]

export default function BudgetView() {
  const [bva, setBva] = useState([])
  const [enums, setEnums] = useState({ clusters: [] })
  const [cluster, setCluster] = useState('')
  const [view, setView] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.budgetVsActual(), api.enums()])
      .then(([d, e]) => { setBva(d); setEnums(e) })
      .finally(() => setLoading(false))
  }, [])

  const filtered = bva.filter(r => {
    if (cluster && r.cluster_manager !== cluster) return false
    if (view === 'above') return r.variance >= 0
    if (view === 'below') return r.variance < 0
    return true
  })

  const above = bva.filter(r => r.variance >= 0)
  const below = bva.filter(r => r.variance < 0)
  const avgVar = filtered.length ? filtered.reduce((a, r) => a + r.variance_pct, 0) / filtered.length : 0

  const worstBelow = [...below].sort((a, b) => a.variance - b.variance).slice(0, 10).map(r => ({
    name: r.plant_name?.slice(0, 14),
    Budget: Math.round(r.budget),
    Actual: Math.round(r.actual),
    var: Math.round(r.variance),
  }))

  if (loading) return <Loader />

  return (
    <div>
      <PageHeader title="Budget vs Actual" sub="Mar'26 LPD achievement against monthly budget targets" />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div className="kpi-card border-t-4 border-t-success">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Above Budget</div>
          <div className="text-2xl font-bold font-display text-success">{above.length}</div>
          <div className="text-[11px] text-slate-400">BMCUs exceeding target</div>
        </div>
        <div className="kpi-card border-t-4 border-t-danger">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Below Budget</div>
          <div className="text-2xl font-bold font-display text-danger">{below.length}</div>
          <div className="text-[11px] text-slate-400">BMCUs below target</div>
        </div>
        <div className="kpi-card border-t-4 border-t-primary">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Total Budget LPD</div>
          <div className="text-2xl font-bold font-display">{fmtNum(Math.round(bva.reduce((a, r) => a + (r.budget || 0), 0)))}</div>
          <div className="text-[11px] text-slate-400">L/day target</div>
        </div>
        <div className="kpi-card border-t-4 border-t-primary">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Total Actual LPD</div>
          <div className="text-2xl font-bold font-display">{fmtNum(Math.round(bva.reduce((a, r) => a + (r.actual || 0), 0)))}</div>
          <div className="text-[11px] text-slate-400">L/day achieved</div>
        </div>
      </div>

      {/* Worst performers chart */}
      <div className="card mb-4">
        <div className="card-body">
          <h3 className="section-title mb-3">Top 10 Below-Budget BMCUs</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={worstBelow} margin={{ top: 0, right: 10, left: 0, bottom: 50 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="Budget" fill="#e2e8f0" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Actual" fill="#d93843" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="card">
        <div className="px-4 py-3 border-b border-slate-100">
          <FilterBar count={filtered.length} label="BMCUs">
            <select className="select" value={cluster} onChange={e => setCluster(e.target.value)}>
              <option value="">All Clusters</option>
              {enums.clusters.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex gap-1">
              {['all','above','below'].map(v => (
                <button key={v} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${view === v ? 'bg-primary text-white' : 'btn-ghost'}`} onClick={() => setView(v)}>
                  {v === 'all' ? 'All' : v === 'above' ? '✅ Above' : '❌ Below'}
                </button>
              ))}
            </div>
          </FilterBar>
        </div>
        <div className="p-4">
          <DataTable columns={BVA_COLS} data={filtered} maxH="60vh" />
        </div>
      </div>
    </div>
  )
}
