import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { api } from '../api'
import Loader, { PageHeader } from '../components/Loader'
import DataTable, { fmtNum, fmtLpd } from '../components/DataTable'

const COLS = [
  { key: 'plant_code', label: 'Code', sortable: true },
  { key: 'plant_name', label: 'BMCU Name', sortable: true },
  { key: 'lpd', label: 'LPD', align: 'right', fmt: 'lpd', sortable: true },
  { key: 'ctc_operator', label: 'Op CTC (₹)', align: 'right', fmt: 'num', sortable: true },
  { key: 'ctc_helper', label: 'Helper CTC (₹)', align: 'right', fmt: 'num', sortable: true },
  { key: 'ctc_tester', label: 'Tester CTC (₹)', align: 'right', fmt: 'num', sortable: true },
  { key: 'total_ctc', label: 'Total CTC (₹)', align: 'right', fmt: 'num', sortable: true },
  { key: 'persons_operator', label: 'Operators', align: 'right', fmt: 'num', sortable: true },
  { key: 'persons_helper', label: 'Helpers', align: 'right', fmt: 'num', sortable: true },
  { key: 'persons_tester', label: 'Testers', align: 'right', fmt: 'num', sortable: true },
  { key: 'total_persons', label: 'Total Staff', align: 'right', fmt: 'num', sortable: true },
  { key: '_ctc_per_lpd', label: 'CTC/LPD', align: 'right', sortable: true, render: (_, row) => row.lpd && row.total_ctc ? '₹' + (row.total_ctc / row.lpd).toFixed(1) : '—' },
]

export default function ManpowerView() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.manpower().then(setData).finally(() => setLoading(false))
  }, [])

  const totals = {
    total_ctc: data.reduce((a, r) => a + (r.total_ctc || 0), 0),
    total_persons: data.reduce((a, r) => a + (r.total_persons || 0), 0),
  }

  const top10 = [...data].filter(r => r.total_ctc).sort((a, b) => b.total_ctc - a.total_ctc).slice(0, 10).map(r => ({
    name: r.plant_name?.slice(0, 12),
    CTC: Math.round(r.total_ctc || 0),
    Persons: r.total_persons || 0,
  }))

  if (loading) return <Loader />

  return (
    <div>
      <PageHeader title="Manpower Costs" sub="BMCU-wise staffing costs and headcount" badge={`${data.length} BMCUs`} />

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="kpi-card border-t-4 border-t-primary">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Total CTC</div>
          <div className="text-2xl font-bold font-display">₹{fmtNum(Math.round(totals.total_ctc / 1000))}K</div>
          <div className="text-[11px] text-slate-400">Monthly manpower cost</div>
        </div>
        <div className="kpi-card border-t-4 border-t-success">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Total Staff</div>
          <div className="text-2xl font-bold font-display">{fmtNum(totals.total_persons)}</div>
          <div className="text-[11px] text-slate-400">Across all BMCUs</div>
        </div>
        <div className="kpi-card border-t-4 border-t-amber-400">
          <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">Avg CTC / BMCU</div>
          <div className="text-2xl font-bold font-display">₹{data.length ? fmtNum(Math.round(totals.total_ctc / data.length)) : '—'}</div>
          <div className="text-[11px] text-slate-400">Per plant per month</div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h3 className="section-title mb-3">Top 10 BMCUs by Total CTC</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={top10} margin={{ top: 0, right: 10, left: 10, bottom: 45 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-40} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => '₹' + fmtNum(v)} />
              <Tooltip formatter={v => '₹' + fmtNum(v)} />
              <Bar dataKey="CTC" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
          <h3 className="section-title">Manpower Details</h3>
          <div className="text-xs text-slate-500">Total CTC: <b>₹{fmtNum(Math.round(totals.total_ctc))}</b> · Staff: <b>{fmtNum(totals.total_persons)}</b></div>
        </div>
        <div className="p-4">
          <DataTable columns={COLS} data={data} maxH="60vh" />
        </div>
      </div>
    </div>
  )
}
