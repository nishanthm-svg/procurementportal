import { useMemo, useState } from 'react'
import { PageHeader } from '../components/Loader'
import SortableTable from '../components/SortableTable'
import { getBmcus } from '../lib/dataLoader'
import { fmtRs, fmtNum, fmtInt } from '../lib/format'

const COLUMNS = [
  { key: 'name', label: 'BMCU' },
  { key: 'code', label: 'Code' },
  { key: 'aco', label: 'ACO' },
  { key: 'mpp_count', label: 'MPPs', align: 'right' },
  { key: 'member_count', label: 'Members', align: 'right', render: fmtInt },
  { key: 'total_qty', label: 'Milk Qty (L)', align: 'right', render: v => fmtNum(v) },
  { key: 'total_bonus', label: 'Total Bonus', align: 'right', render: fmtRs },
]

export default function BMCUSummary() {
  const bmcus = getBmcus()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return bmcus
    return bmcus.filter(b => `${b.name} ${b.code} ${b.aco}`.toLowerCase().includes(q))
  }, [bmcus, search])

  const grand = useMemo(() => ({
    member_count: bmcus.reduce((s, b) => s + b.member_count, 0),
    total_qty: bmcus.reduce((s, b) => s + b.total_qty, 0),
    total_bonus: bmcus.reduce((s, b) => s + b.total_bonus, 0),
  }), [bmcus])

  return (
    <div>
      <PageHeader title="BMCU Summary" sub="Incentive totals by BMCU, highest to lowest" badge={`${bmcus.length} BMCUs`} />

      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <input className="input max-w-xs" placeholder="Search BMCU or ACO…" value={search} onChange={e => setSearch(e.target.value)} />
        <div className="ml-auto flex gap-4 text-sm">
          <span className="text-slate-500">Total Members: <b className="text-slate-800">{fmtInt(grand.member_count)}</b></span>
          <span className="text-slate-500">Total Qty: <b className="text-slate-800">{fmtNum(grand.total_qty)} L</b></span>
          <span className="text-slate-500">Total Bonus: <b className="text-emerald-600">{fmtRs(grand.total_bonus)}</b></span>
        </div>
      </div>

      <SortableTable columns={COLUMNS} rows={filtered} defaultSortKey="total_bonus" />
    </div>
  )
}
