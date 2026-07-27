import { useMemo, useState } from 'react'
import { PageHeader } from '../components/Loader'
import SortableTable from '../components/SortableTable'
import { getAcoSummary } from '../lib/dataLoader'
import { fmtRs, fmtNum, fmtInt } from '../lib/format'

const COLUMNS = [
  { key: 'aco', label: 'ACO' },
  { key: 'bmcu_count', label: 'BMCUs', align: 'right' },
  { key: 'mpp_count', label: 'MPPs', align: 'right' },
  { key: 'member_count', label: 'Members', align: 'right', render: fmtInt },
  { key: 'total_qty', label: 'Milk Qty (L)', align: 'right', render: v => fmtNum(v) },
  { key: 'total_bonus', label: 'Total Bonus', align: 'right', render: fmtRs },
]

export default function ACOSummary() {
  const acos = getAcoSummary()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return acos
    return acos.filter(a => a.aco.toLowerCase().includes(q))
  }, [acos, search])

  return (
    <div>
      <PageHeader title="ACO Summary" sub="Incentive totals aggregated by Area Coordinator / Officer" badge={`${acos.length} ACOs`} />

      <input className="input max-w-xs mb-4" placeholder="Search ACO…" value={search} onChange={e => setSearch(e.target.value)} />

      <SortableTable columns={COLUMNS} rows={filtered} defaultSortKey="total_bonus" />
    </div>
  )
}
