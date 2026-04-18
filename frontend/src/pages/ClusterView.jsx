import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { api } from '../api'
import Loader, { PageHeader } from '../components/Loader'
import DataTable, { fmtNum, fmtRs, fmtLpd } from '../components/DataTable'

function fmt(v, mul) { return v == null ? 0 : mul ? v * mul : v }

const COW_COLS = [
  { key: 'cluster_manager', label: 'Cluster Manager', sortable: true },
  { key: 'cow_qty', label: 'Total Qty (L)', align: 'right', fmt: 'num', sortable: true },
  { key: 'cow_lpd', label: 'LPD', align: 'right', fmt: 'lpd', sortable: true },
  { key: 'cow_fat', label: 'Fat%', align: 'right', sortable: true, render: v => v ? v.toFixed(3) + '%' : '—' },
  { key: 'cow_snf', label: 'SNF%', align: 'right', sortable: true, render: v => v ? v.toFixed(3) + '%' : '—' },
  { key: 'cow_ts', label: 'T.S.%', align: 'right', sortable: true, render: v => v ? v.toFixed(3) + '%' : '—' },
  { key: 'cow_fat_kgs', label: 'Fat Kgs', align: 'right', fmt: 'num', sortable: true },
  { key: 'cow_snf_kgs', label: 'SNF Kgs', align: 'right', fmt: 'num', sortable: true },
  { key: 'cow_amount', label: 'Amount (₹)', align: 'right', fmt: 'rs', sortable: true },
  { key: 'cow_rate', label: 'Rate/Ltr', align: 'right', sortable: true, render: v => v ? '₹' + v.toFixed(2) : '—' },
]

export default function ClusterView() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.cluster().then(d => setData(d.filter(r => r.cluster_manager !== 'Grand Total'))).finally(() => setLoading(false))
  }, [])

  if (loading) return <Loader />

  const totals = {
    cow_qty: data.reduce((a, r) => a + fmt(r.cow_qty), 0),
    cow_lpd: data.reduce((a, r) => a + fmt(r.cow_lpd), 0),
    cow_amount: data.reduce((a, r) => a + fmt(r.cow_amount), 0),
  }

  const barData = data.map(r => ({
    name: r.cluster_manager?.split(' ').slice(-2).join(' '),
    full: r.cluster_manager,
    'Cow LPD': Math.round(fmt(r.cow_lpd)),
    'Buf LPD': Math.round(fmt(r.buf_lpd)),
  }))

  const fatData = data.map(r => ({
    name: r.cluster_manager?.split(' ').slice(-2).join(' '),
    'Fat%': parseFloat(fmt(r.cow_fat).toFixed(3)),
    'SNF%': parseFloat(fmt(r.cow_snf).toFixed(3)),
  }))

  return (
    <div>
      <PageHeader title="Cluster Performance" sub="Cluster manager-wise milk procurement summary · Mar'26" />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {data.map(r => (
          <div key={r.cluster_manager} className="kpi-card border-t-4 border-t-primary">
            <div className="text-[10px] font-bold uppercase text-slate-400 mb-1 truncate">{r.cluster_manager?.split(' ').slice(-2).join(' ')}</div>
            <div className="text-xl font-bold font-display">{fmtNum(Math.round(fmt(r.cow_lpd)))}</div>
            <div className="text-[11px] text-slate-400">LPD Cow</div>
            <div className="mt-1.5 text-xs flex gap-3">
              <span>Fat: <b>{fmt(r.cow_fat).toFixed(3)}%</b></span>
              <span>SNF: <b>{fmt(r.cow_snf).toFixed(3)}%</b></span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mb-5">
        <div className="card">
          <div className="card-body">
            <h3 className="section-title mb-3">LPD Comparison</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
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
        <div className="card">
          <div className="card-body">
            <h3 className="section-title mb-3">Quality Parameters</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={fatData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[3, 9]} />
                <Tooltip formatter={v => v + '%'} />
                <Bar dataKey="Fat%" fill="#d4850c" radius={[3, 3, 0, 0]} />
                <Bar dataKey="SNF%" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="section-title">Cow Milk Details</h3>
          <span className="badge-blue">4 Clusters</span>
        </div>
        <div className="p-4">
          <DataTable columns={COW_COLS} data={data} maxH="50vh" />
          <div className="mt-2 pt-2 border-t border-slate-100 grid grid-cols-3 gap-4 text-xs text-slate-500">
            <div>Total Qty: <b className="text-slate-800 font-display">{fmtNum(Math.round(totals.cow_qty))} L</b></div>
            <div>Total LPD: <b className="text-slate-800 font-display">{fmtNum(Math.round(totals.cow_lpd))}</b></div>
            <div>Total Amount: <b className="text-slate-800 font-display">{fmtRs(totals.cow_amount)}</b></div>
          </div>
        </div>
      </div>
    </div>
  )
}
