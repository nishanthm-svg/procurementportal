import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts'
import { api } from '../api'
import KPICard from '../components/KPICard'
import Loader, { PageHeader } from '../components/Loader'
import { fmtNum, fmtRs, fmtLpd } from '../components/DataTable'

const COLORS = ['#0c7fd4', '#12a362', '#d4850c', '#d93843', '#8b5cf6']

function fmt(n) { return n == null ? 0 : n }

export default function Dashboard() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [clusters, setClusters] = useState([])
  const [gprsAo, setGprsAo] = useState([])
  const [bva, setBva] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.summary(), api.cluster(), api.gprsAo(), api.budgetVsActual()])
      .then(([s, cl, gp, bv]) => { setSummary(s); setClusters(cl.filter(r => r.cluster_manager !== 'Grand Total')); setGprsAo(gp); setBva(bv) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />

  const s = summary || {}
  const totalLpd = fmt(s.total_lpd)
  const budgetTotalMar = bva.reduce((a, r) => a + (r.budget || 0), 0)
  const actualTotalMar = bva.reduce((a, r) => a + (r.actual || 0), 0)
  const budgetAchPct = budgetTotalMar ? Math.round(actualTotalMar / budgetTotalMar * 100) : 0

  const clusterChartData = clusters.map(r => ({
    name: r.cluster_manager?.split(' ').slice(-1)[0] || r.cluster_manager,
    full: r.cluster_manager,
    'Cow LPD': Math.round(fmt(r.cow_lpd)),
    'Buf LPD': Math.round(fmt(r.buf_lpd)),
  }))

  const gprsData = gprsAo.map(r => ({
    name: r.ao?.split(' ').slice(-1)[0] || r.ao,
    pct: Math.round(fmt(r.gprs_pct) * 100),
  })).slice(0, 12)

  const milkMix = [
    { name: 'Cow Milk', value: fmt(s.total_cow_qty) },
    { name: 'Buffalo Milk', value: fmt(s.total_buf_qty) },
  ]

  const belowBudget = bva.filter(r => r.variance < 0)
  const aboveBudget = bva.filter(r => r.variance >= 0)

  return (
    <div>
      <PageHeader
        title="Procurement Overview"
        sub={`Monthly performance report · ${s.month || "Mar'26"}`}
        badge={`${fmtNum(Math.round(totalLpd / 1000))}K LPD`}
      />

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        <KPICard label="Total LPD" value={fmtNum(Math.round(totalLpd))} sub="Liters per day" color="blue" icon="🥛" />
        <KPICard label="Total Qty" value={fmtNum(Math.round(fmt(s.total_qty) / 1000)) + 'K'} sub="Liters this month" color="blue" icon="📦" />
        <KPICard label="Avg Fat%" value={fmt(s.avg_fat).toFixed(3) + '%'} sub="Cow milk" color="green" icon="🔬" />
        <KPICard label="Avg SNF%" value={fmt(s.avg_snf).toFixed(3) + '%'} sub="Cow milk" color="green" icon="🧪" />
        <KPICard label="Total Amount" value={fmtRs(s.total_amount_rs)} sub="Farmer payments" color="amber" icon="💰" />
        <KPICard label="Budget Achievement" value={budgetAchPct + '%'} sub={`${aboveBudget.length} above / ${belowBudget.length} below`} color={budgetAchPct >= 100 ? 'green' : 'red'} icon="🎯" pct={budgetAchPct} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <KPICard label="BMCUs" value={fmtNum(s.total_bmcu)} sub="Active plants" color="purple" icon="🏭" />
        <KPICard label="MPPs" value={fmtNum(s.total_mpp)} sub="Procurement points" color="purple" icon="📍" />
        <KPICard label="⚠️ Low LPD MPPs" value={fmtNum(s.low_lpd_count)} sub="<30 LPD" color="red" icon="⚠️" />
        <KPICard label="Pending Recovery" value={fmtRs(s.pending_recovery_amount)} sub="Cattle feed" color="red" icon="💳" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        {/* Cluster LPD Bar */}
        <div className="card lg:col-span-2">
          <div className="card-body">
            <div className="flex items-center justify-between mb-3">
              <h3 className="section-title">Cluster-wise LPD</h3>
              <span className="badge-blue">Mar&apos;26</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={clusterChartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmtNum(v)} />
                <Tooltip formatter={(v, n) => [fmtNum(v) + ' L/day', n]} labelFormatter={(l, p) => p?.[0]?.payload?.full || l} />
                <Bar dataKey="Cow LPD" fill="#0c7fd4" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Buf LPD" fill="#12a362" radius={[3, 3, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Milk Mix Pie */}
        <div className="card">
          <div className="card-body">
            <h3 className="section-title mb-3">Milk Composition</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={milkMix} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(1)}%`} labelLine={false} fontSize={11}>
                  {milkMix.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={v => fmtNum(Math.round(v)) + ' L'} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {milkMix.map((d, i) => (
                <div key={d.name} className="text-center">
                  <div className="text-[10px] text-slate-400">{d.name}</div>
                  <div className="font-bold font-display text-sm" style={{ color: COLORS[i] }}>{fmtNum(Math.round(d.value / 1000))}K L</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GPRS Chart */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">GPRS Compliance by AO (%)</h3>
            <span className="badge-green">Target: 95%+</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={gprsData} layout="vertical" margin={{ top: 0, right: 40, left: 60, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" domain={[80, 100]} tick={{ fontSize: 10 }} tickFormatter={v => v + '%'} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={60} />
              <Tooltip formatter={v => v + '%'} />
              <Bar dataKey="pct" radius={[0, 3, 3, 0]} fill="#0c7fd4"
                label={{ position: 'right', fontSize: 10, formatter: v => v + '%' }}
                background={{ fill: '#f8fafc', radius: 3 }}>
                {gprsData.map((d, i) => <Cell key={i} fill={d.pct >= 95 ? '#12a362' : d.pct >= 90 ? '#d4850c' : '#d93843'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cluster Summary — clickable drill-down */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="flex items-center justify-between mb-3">
            <h3 className="section-title">Cluster Overview — Click to Drill Down</h3>
            <span className="badge-blue">4 Clusters</span>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Cluster Manager</th>
                  <th className="r">Cow LPD</th>
                  <th className="r">Buf LPD</th>
                  <th className="r">Total Qty (L)</th>
                  <th className="r">Fat%</th>
                  <th className="r">SNF%</th>
                  <th className="r">Amount</th>
                  <th className="r">Action</th>
                </tr>
              </thead>
              <tbody>
                {clusters.map(r => (
                  <tr key={r.cluster_manager} className="cursor-pointer hover:bg-primary/5 transition-colors"
                    onClick={() => navigate(`/cluster/${encodeURIComponent(r.cluster_manager)}`)}>
                    <td className="font-medium text-primary">{r.cluster_manager}</td>
                    <td className="r font-display font-bold">{fmtNum(Math.round(r.cow_lpd || 0))}</td>
                    <td className="r">{fmtNum(Math.round(r.buf_lpd || 0))}</td>
                    <td className="r">{fmtNum(Math.round((r.cow_qty || 0) + (r.buf_qty || 0)))}</td>
                    <td className="r">{r.cow_fat ? r.cow_fat.toFixed(3) + '%' : '—'}</td>
                    <td className="r">{r.cow_snf ? r.cow_snf.toFixed(3) + '%' : '—'}</td>
                    <td className="r">{fmtRs(r.cow_amount)}</td>
                    <td className="r"><span className="badge-blue text-[10px]">View →</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Budget vs Actual Summary */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="card">
          <div className="card-body">
            <h3 className="section-title mb-3">Budget Achievement</h3>
            <div className="space-y-1.5">
              {[...new Set(bva.map(r => r.cluster_manager).filter(Boolean))].map(cm => {
                const cmBva = bva.filter(r => r.cluster_manager === cm)
                const bud = cmBva.reduce((a, r) => a + (r.budget || 0), 0)
                const act = cmBva.reduce((a, r) => a + (r.actual || 0), 0)
                const pct = bud ? Math.round(act / bud * 100) : 0
                return (
                  <div key={cm}>
                    <div className="flex justify-between text-[11px] mb-0.5">
                      <span className="text-slate-600 truncate max-w-[140px]">{cm.split(' ').slice(-2).join(' ')}</span>
                      <span className={pct >= 100 ? 'pos' : 'neg'}>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${pct >= 100 ? 'bg-success' : pct >= 90 ? 'bg-warning' : 'bg-danger'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h3 className="section-title mb-3">Cluster Fat% Comparison</h3>
            <div className="space-y-2">
              {clusters.map(r => (
                <div key={r.cluster_manager} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 w-28 truncate">{r.cluster_manager?.split(' ').slice(-2).join(' ')}</span>
                  <div className="flex gap-3">
                    <span>Fat: <b>{fmt(r.cow_fat).toFixed(3)}%</b></span>
                    <span>SNF: <b>{fmt(r.cow_snf).toFixed(3)}%</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <h3 className="section-title mb-3">Alert Summary</h3>
            <div className="space-y-2">
              {[
                { label: 'BMCUs Above Budget', val: s.above_budget_count, color: 'text-success' },
                { label: 'BMCUs Below Budget', val: s.below_budget_count, color: 'text-danger' },
                { label: '<30 LPD MPPs', val: s.low_lpd_count, color: 'text-warning' },
                { label: 'Single Pourer MPPs', val: s.single_pourer_count, color: 'text-warning' },
                { label: 'Pending Recovery', val: fmtRs(s.pending_recovery_amount), color: 'text-danger' },
              ].map(({ label, val, color }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-slate-500">{label}</span>
                  <span className={`font-bold font-display ${color}`}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
