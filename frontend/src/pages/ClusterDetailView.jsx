import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { api } from '../api'
import KPICard from '../components/KPICard'
import Loader, { PageHeader } from '../components/Loader'
import { fmtNum, fmtRs, fmtLpd } from '../components/DataTable'

function fmt(v) { return v == null ? 0 : v }

export default function ClusterDetailView() {
  const { clusterName } = useParams()
  const navigate = useNavigate()
  const cluster = decodeURIComponent(clusterName)

  const [aos, setAos] = useState([])
  const [bva, setBva] = useState([])
  const [lowLpd, setLowLpd] = useState([])
  const [clusterData, setClusterData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.cluster(),
      api.ao({ cluster }),
      api.budgetVsActual({ cluster }),
      api.lowLpd({ cluster, limit: 500 }),
    ]).then(([cl, ao, bv, ll]) => {
      const cd = cl.find(r => r.cluster_manager === cluster)
      setClusterData(cd || null)
      setAos(ao)
      setBva(bv)
      setLowLpd(ll.data || [])
    }).finally(() => setLoading(false))
  }, [cluster])

  if (loading) return <Loader />

  const totalBudget = bva.reduce((a, r) => a + (r.budget || 0), 0)
  const totalActual = bva.reduce((a, r) => a + (r.actual || 0), 0)
  const budgetAch = totalBudget ? Math.round(totalActual / totalBudget * 100) : 0

  const aoBarData = aos.map(r => ({
    name: r.ao?.split(' ').slice(-1)[0] || r.ao,
    full: r.ao,
    'Cow LPD': Math.round(fmt(r.cow_lpd)),
    'Bud LPD': Math.round(fmt(r.bud_lpd)),
  }))

  const achData = aos.map(r => ({
    name: r.ao?.split(' ').slice(-1)[0] || r.ao,
    full: r.ao,
    pct: r.ach_pct != null ? Math.round(r.ach_pct * 100) : (r.bud_lpd ? Math.round((r.cow_lpd || 0) / r.bud_lpd * 100) : 0),
  }))

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
        <Link to="/" className="hover:text-primary">Organisation</Link>
        <span>›</span>
        <span className="text-slate-800 font-medium">{cluster}</span>
      </div>

      <PageHeader
        title={cluster}
        sub={`Cluster performance · Mar'26`}
        badge={`${aos.length} AOs`}
      />

      {/* Cluster KPIs */}
      {clusterData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-6 gap-3 mb-5">
          <KPICard label="Cow LPD" value={fmtNum(Math.round(fmt(clusterData.cow_lpd)))} sub="Liters/day" color="blue" icon="🥛" />
          <KPICard label="Buf LPD" value={fmtNum(Math.round(fmt(clusterData.buf_lpd)))} sub="Buffalo" color="green" icon="🐃" />
          <KPICard label="Total Qty" value={fmtNum(Math.round(fmt(clusterData.cow_qty) / 1000)) + 'K'} sub="Liters this month" color="blue" icon="📦" />
          <KPICard label="Fat%" value={fmt(clusterData.cow_fat).toFixed(3) + '%'} sub="Cow milk" color="green" icon="🔬" />
          <KPICard label="SNF%" value={fmt(clusterData.cow_snf).toFixed(3) + '%'} sub="Cow milk" color="green" icon="🧪" />
          <KPICard label="Amount" value={fmtRs(clusterData.cow_amount)} sub="Farmer payments" color="amber" icon="💰" />
        </div>
      )}

      {/* Budget Achievement */}
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <KPICard label="Budget Achievement" value={budgetAch + '%'} sub={`${bva.filter(r=>r.variance>=0).length} above / ${bva.filter(r=>r.variance<0).length} below`} color={budgetAch >= 100 ? 'green' : 'red'} icon="🎯" pct={budgetAch} />
        <KPICard label="Low LPD MPPs" value={fmtNum(lowLpd.length)} sub="<30 LPD in cluster" color="red" icon="⚠️" />
        <KPICard label="Total AOs" value={aos.length} sub="Area officers" color="purple" icon="👥" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <div className="card">
          <div className="card-body">
            <h3 className="section-title mb-3">AO-wise LPD vs Budget</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={aoBarData} margin={{ top: 0, right: 10, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" interval={0} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => fmtNum(v)} />
                <Tooltip formatter={(v, n) => [fmtNum(v) + ' L/day', n]} labelFormatter={(l, p) => p?.[0]?.payload?.full || l} />
                <Bar dataKey="Cow LPD" fill="#0c7fd4" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Bud LPD" fill="#d4850c" radius={[3, 3, 0, 0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <h3 className="section-title mb-3">AO Budget Achievement %</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={achData} layout="vertical" margin={{ top: 0, right: 50, left: 80, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 120]} tick={{ fontSize: 10 }} tickFormatter={v => v + '%'} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={80} />
                <Tooltip formatter={v => v + '%'} labelFormatter={(l, p) => p?.[0]?.payload?.full || l} />
                <ReferenceLine x={100} stroke="#12a362" strokeDasharray="4 2" label={{ value: '100%', position: 'top', fontSize: 10, fill: '#12a362' }} />
                <Bar dataKey="pct" radius={[0, 3, 3, 0]} label={{ position: 'right', fontSize: 10, formatter: v => v + '%' }}
                  fill="#0c7fd4"
                  background={{ fill: '#f8fafc', radius: 3 }}>
                  {achData.map((d, i) => {
                    const color = d.pct >= 100 ? '#12a362' : d.pct >= 90 ? '#d4850c' : '#d93843'
                    return <rect key={i} fill={color} />
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* AO Table — clickable */}
      <div className="card">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="section-title">Area Officers — Click to View Details</h3>
          <span className="badge-blue">{aos.length} AOs</span>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Area Officer</th>
                  <th className="r">Cow LPD</th>
                  <th className="r">Bud LPD</th>
                  <th className="r">Ach%</th>
                  <th className="r">Cow Qty</th>
                  <th className="r">Fat%</th>
                  <th className="r">SNF%</th>
                  <th className="r">Amount</th>
                  <th className="r">GPRS%</th>
                  <th className="r">Members</th>
                  <th className="r">Action</th>
                </tr>
              </thead>
              <tbody>
                {aos.map(r => {
                  const ach = r.ach_pct != null ? Math.round(r.ach_pct * 100) : (r.bud_lpd ? Math.round((r.cow_lpd || 0) / r.bud_lpd * 100) : null)
                  return (
                    <tr key={r.ao} className="cursor-pointer hover:bg-primary/5 transition-colors"
                      onClick={() => navigate(`/ao/${encodeURIComponent(r.ao)}`)}>
                      <td className="font-medium text-primary">{r.ao}</td>
                      <td className="r font-display font-bold">{fmtNum(Math.round(fmt(r.cow_lpd)))}</td>
                      <td className="r text-slate-500">{r.bud_lpd ? fmtNum(Math.round(r.bud_lpd)) : '—'}</td>
                      <td className="r">
                        {ach != null ? (
                          <span className={ach >= 100 ? 'pos font-bold' : ach >= 90 ? 'text-warning font-bold' : 'neg font-bold'}>{ach}%</span>
                        ) : '—'}
                      </td>
                      <td className="r">{fmtNum(Math.round(fmt(r.cow_qty)))}</td>
                      <td className="r">{r.cow_fat ? r.cow_fat.toFixed(3) + '%' : '—'}</td>
                      <td className="r">{r.cow_snf ? r.cow_snf.toFixed(3) + '%' : '—'}</td>
                      <td className="r">{fmtRs(r.cow_amount)}</td>
                      <td className="r">
                        {r.gprs_pct != null ? (
                          <span className={r.gprs_pct >= 0.95 ? 'pos' : r.gprs_pct >= 0.9 ? 'text-warning' : 'neg'}>
                            {Math.round(r.gprs_pct * 100)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td className="r">{r.pouring_members ? fmtNum(r.pouring_members) : '—'}</td>
                      <td className="r"><span className="badge-blue text-[10px]">View →</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
