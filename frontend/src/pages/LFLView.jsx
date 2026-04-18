import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { api } from '../api'
import Loader, { PageHeader, SectionHeader } from '../components/Loader'
import DataTable, { fmtNum, fmtLpd, fmtGrowth } from '../components/DataTable'
import FilterBar from '../components/FilterBar'

const BMCU_COLS = [
  { key: 'plant_code', label: 'Code' },
  { key: 'plant_name', label: 'BMCU Name' },
  { key: 'ao', label: 'AO' },
  { key: 'cluster', label: 'Cluster' },
  { key: 'lpd_prev', label: "Mar'25 LPD", align: 'right', fmt: 'lpd', sortable: true },
  { key: 'lpd_curr', label: "Mar'26 LPD", align: 'right', fmt: 'lpd', sortable: true },
  { key: 'diff', label: 'Diff', align: 'right', sortable: true, render: v => v != null ? <span className={v >= 0 ? 'pos' : 'neg'}>{v >= 0 ? '+' : ''}{v.toFixed(1)}</span> : '—' },
  { key: 'growth_pct', label: 'Growth', align: 'right', sortable: true, render: v => { if (v == null) return '—'; const p = (Math.abs(v) <= 1 ? v * 100 : v).toFixed(1); return <span className={v >= 0 ? 'pos' : 'neg'}>{v >= 0 ? '+' : ''}{p}%</span> } },
]

const FEED_COLS = [
  { key: 'plant_code', label: 'Code' },
  { key: 'plant_name', label: 'BMCU Name' },
  { key: 'ao', label: 'AO' },
  { key: 'cluster', label: 'Cluster' },
  { key: 'feed_prev', label: "Mar'25 Feed", align: 'right', fmt: 'num', sortable: true },
  { key: 'feed_curr', label: "Mar'26 Feed", align: 'right', fmt: 'num', sortable: true },
  { key: 'diff', label: 'Diff', align: 'right', sortable: true, render: v => v != null ? <span className={v >= 0 ? 'pos' : 'neg'}>{v >= 0 ? '+' : ''}{fmtNum(v)}</span> : '—' },
]

export default function LFLView() {
  const [bmcu, setBmcu] = useState([])
  const [feed, setFeed] = useState([])
  const [enums, setEnums] = useState({ clusters: [] })
  const [cluster, setCluster] = useState('')
  const [tab, setTab] = useState('bmcu')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.lflBmcu(), api.lflFeed(), api.enums()])
      .then(([b, f, e]) => { setBmcu(b); setFeed(f); setEnums(e) })
      .finally(() => setLoading(false))
  }, [])

  const filteredBmcu = cluster ? bmcu.filter(r => r.cluster === cluster) : bmcu
  const filteredFeed = cluster ? feed.filter(r => r.cluster === cluster) : feed

  const growing = filteredBmcu.filter(r => (r.diff || 0) >= 0)
  const declining = filteredBmcu.filter(r => (r.diff || 0) < 0)
  const avgGrowth = filteredBmcu.length ? filteredBmcu.reduce((a, r) => a + (r.growth_pct || 0), 0) / filteredBmcu.length * 100 : 0

  const top10 = [...filteredBmcu].sort((a, b) => (b.diff || 0) - (a.diff || 0)).slice(0, 10).map(r => ({
    name: r.plant_name?.slice(0, 12),
    diff: Math.round(r.diff || 0),
  }))

  if (loading) return <Loader />

  return (
    <div>
      <PageHeader title="LFL Analysis" sub="Like-for-Like comparison: Mar'25 vs Mar'26" />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="kpi-card border-t-4 border-t-success">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Growing BMCUs</div>
          <div className="text-2xl font-bold font-display text-success">{growing.length}</div>
          <div className="text-[11px] text-slate-400">vs Mar'25</div>
        </div>
        <div className="kpi-card border-t-4 border-t-danger">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Declining BMCUs</div>
          <div className="text-2xl font-bold font-display text-danger">{declining.length}</div>
          <div className="text-[11px] text-slate-400">vs Mar'25</div>
        </div>
        <div className={`kpi-card border-t-4 ${avgGrowth >= 0 ? 'border-t-success' : 'border-t-danger'}`}>
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Avg Growth Rate</div>
          <div className={`text-2xl font-bold font-display ${avgGrowth >= 0 ? 'text-success' : 'text-danger'}`}>{avgGrowth >= 0 ? '+' : ''}{avgGrowth.toFixed(2)}%</div>
          <div className="text-[11px] text-slate-400">Mean LFL growth</div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h3 className="section-title mb-3">Top 10 Gainers / Losers (LPD Diff)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={top10} margin={{ top: 0, right: 10, left: 0, bottom: 45 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={v => [fmtNum(v) + ' L/day', 'LPD Diff']} />
              <Bar dataKey="diff" radius={[3, 3, 0, 0]}>
                {top10.map((d, i) => <Cell key={i} fill={d.diff >= 0 ? '#12a362' : '#d93843'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex gap-1 mb-3">
        {['bmcu','feed'].map(t => (
          <button key={t} className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${tab === t ? 'bg-primary text-white' : 'btn-ghost'}`} onClick={() => setTab(t)}>
            {t === 'bmcu' ? '🏭 BMCU LFL' : '🌾 Feed LFL'}
          </button>
        ))}
        <select className="select ml-auto" value={cluster} onChange={e => setCluster(e.target.value)}>
          <option value="">All Clusters</option>
          {enums.clusters.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="card">
        <div className="p-4">
          {tab === 'bmcu'
            ? <DataTable columns={BMCU_COLS} data={filteredBmcu} maxH="55vh" caption={`${filteredBmcu.length} BMCUs compared`} />
            : <DataTable columns={FEED_COLS} data={filteredFeed} maxH="55vh" caption={`${filteredFeed.length} BMCUs compared`} />
          }
        </div>
      </div>
    </div>
  )
}
