import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from 'recharts'
import { api } from '../api'
import Loader, { PageHeader } from '../components/Loader'
import DataTable, { fmtNum } from '../components/DataTable'
import FilterBar from '../components/FilterBar'

const AO_COLS = [
  { key: 'ao', label: 'Area Officer', sortable: true },
  { key: 'cluster_manager', label: 'Cluster' },
  { key: 'total_shifts', label: 'Total Shifts', align: 'right', fmt: 'num', sortable: true },
  { key: 'gprs_shifts', label: 'GPRS Shifts', align: 'right', fmt: 'num', sortable: true },
  { key: 'gprs_pct', label: 'GPRS%', align: 'right', sortable: true,
    render: v => { const p = v != null ? (Math.abs(v) <= 1 ? v * 100 : v).toFixed(1) : null; return p == null ? '—' : <span className={Number(p) >= 95 ? 'pos' : Number(p) >= 90 ? 'warn' : 'neg'}>{p}%</span> }
  },
]

const BMCU_COLS = [
  { key: 'plant_code', label: 'Code' },
  { key: 'plant_name', label: 'BMCU', sortable: true },
  { key: 'ao', label: 'AO' },
  { key: 'cluster_manager', label: 'Cluster' },
  { key: 'total_shifts', label: 'Total Shifts', align: 'right', fmt: 'num', sortable: true },
  { key: 'gprs_shifts', label: 'GPRS Shifts', align: 'right', fmt: 'num', sortable: true },
  { key: 'gprs_pct', label: 'GPRS%', align: 'right', sortable: true,
    render: v => { const p = v != null ? (Math.abs(v) <= 1 ? v * 100 : v).toFixed(1) : null; return p == null ? '—' : <span className={Number(p) >= 95 ? 'pos' : Number(p) >= 90 ? 'warn' : 'neg'}>{p}%</span> }
  },
]

export default function GPRSView() {
  const [aoData, setAoData] = useState([])
  const [bmcuData, setBmcuData] = useState([])
  const [enums, setEnums] = useState({ clusters: [] })
  const [cluster, setCluster] = useState('')
  const [tab, setTab] = useState('ao')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.gprsAo(), api.gprsBmcu(), api.enums()])
      .then(([a, b, e]) => { setAoData(a); setBmcuData(b); setEnums(e) })
      .finally(() => setLoading(false))
  }, [])

  const filtAo = cluster ? aoData.filter(r => r.cluster_manager === cluster) : aoData
  const filtBmcu = cluster ? bmcuData.filter(r => r.cluster_manager === cluster) : bmcuData

  const aoPct = v => v != null ? (Math.abs(v) <= 1 ? v * 100 : v) : 0

  const aoChart = filtAo.map(r => ({
    name: r.ao?.split(' ').slice(-1)[0],
    full: r.ao,
    pct: Math.round(aoPct(r.gprs_pct) * 10) / 10,
  }))

  const belowTarget = filtBmcu.filter(r => aoPct(r.gprs_pct) < 95)
  const avgPct = filtBmcu.length ? filtBmcu.reduce((a, r) => a + aoPct(r.gprs_pct), 0) / filtBmcu.length : 0

  if (loading) return <Loader />

  return (
    <div>
      <PageHeader title="GPRS Tracking" sub="GPS-based milk collection shift compliance · Mar'26" />

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="kpi-card border-t-4 border-t-primary">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Avg GPRS%</div>
          <div className={`text-2xl font-bold font-display ${avgPct >= 95 ? 'text-success' : avgPct >= 90 ? 'text-warning' : 'text-danger'}`}>{avgPct.toFixed(1)}%</div>
          <div className="text-[11px] text-slate-400">Overall compliance</div>
        </div>
        <div className="kpi-card border-t-4 border-t-success">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">≥95% Compliant</div>
          <div className="text-2xl font-bold font-display text-success">{filtBmcu.filter(r => aoPct(r.gprs_pct) >= 95).length}</div>
          <div className="text-[11px] text-slate-400">BMCUs on target</div>
        </div>
        <div className="kpi-card border-t-4 border-t-danger">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Below 95%</div>
          <div className="text-2xl font-bold font-display text-danger">{belowTarget.length}</div>
          <div className="text-[11px] text-slate-400">BMCUs needing attention</div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h3 className="section-title mb-3">AO-wise GPRS Compliance</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={aoChart} margin={{ top: 0, right: 40, left: 0, bottom: 45 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} domain={[85, 100]} tickFormatter={v => v + '%'} />
              <Tooltip formatter={v => v + '%'} labelFormatter={(l, p) => p?.[0]?.payload?.full || l} />
              <ReferenceLine y={95} stroke="#12a362" strokeDasharray="5 5" label={{ value: '95% target', position: 'right', fontSize: 10, fill: '#12a362' }} />
              <Bar dataKey="pct" radius={[3, 3, 0, 0]} label={{ position: 'top', fontSize: 9, formatter: v => v + '%' }}>
                {aoChart.map((d, i) => <Cell key={i} fill={d.pct >= 95 ? '#12a362' : d.pct >= 90 ? '#d4850c' : '#d93843'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-1 mb-3">
        {['ao','bmcu'].map(t => (
          <button key={t} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${tab === t ? 'bg-primary text-white' : 'btn-ghost'}`} onClick={() => setTab(t)}>
            {t === 'ao' ? '👥 AO Level' : '🏭 BMCU Level'}
          </button>
        ))}
        <select className="select ml-auto" value={cluster} onChange={e => setCluster(e.target.value)}>
          <option value="">All Clusters</option>
          {enums.clusters.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="p-4">
          {tab === 'ao'
            ? <DataTable columns={AO_COLS} data={filtAo} maxH="55vh" />
            : <DataTable columns={BMCU_COLS} data={filtBmcu} maxH="55vh" />
          }
        </div>
      </div>
    </div>
  )
}
