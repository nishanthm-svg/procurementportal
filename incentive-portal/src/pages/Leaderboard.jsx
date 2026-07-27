import { PageHeader } from '../components/Loader'
import { getLeaderboard } from '../lib/dataLoader'
import { fmtRs, fmtNum, fmtInt } from '../lib/format'

function Medal({ i }) {
  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣']
  return <span className="text-xl">{medals[i] || i + 1}</span>
}

function LeaderCard({ title, subtitle, items, renderRow }) {
  return (
    <div className="card">
      <div className="p-4 border-b border-slate-100">
        <div className="font-bold font-display text-slate-800">{title}</div>
        <div className="text-xs text-slate-400">{subtitle}</div>
      </div>
      <div className="p-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-sky-50">
            <Medal i={i} />
            <div className="flex-1 min-w-0">{renderRow(item)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Leaderboard() {
  const lb = getLeaderboard()

  return (
    <div>
      <PageHeader title="Leaderboard — Top 5" sub="Highest bonus / price incentive across the company" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <LeaderCard
          title="Top 5 Producers"
          subtitle="By bonus amount"
          items={lb.top_members}
          renderRow={m => (
            <>
              <div className="font-semibold text-slate-800 truncate">{m.member_name}</div>
              <div className="text-[11px] text-slate-400 truncate">{m.mpp_name} · {m.bmcu_name}</div>
              <div className="text-sm font-bold text-emerald-600 tabular-nums mt-0.5">{fmtRs(m.bonus)}</div>
            </>
          )}
        />
        <LeaderCard
          title="Top 5 MPPs"
          subtitle="By total bonus"
          items={lb.top_mpps}
          renderRow={m => (
            <>
              <div className="font-semibold text-slate-800 truncate">{m.mpp_name}</div>
              <div className="text-[11px] text-slate-400 truncate">{m.bmcu_name} · {fmtInt(m.member_count)} members</div>
              <div className="text-sm font-bold text-emerald-600 tabular-nums mt-0.5">{fmtRs(m.total_bonus)}</div>
            </>
          )}
        />
        <LeaderCard
          title="Top 5 BMCUs"
          subtitle="By total bonus"
          items={lb.top_bmcus}
          renderRow={b => (
            <>
              <div className="font-semibold text-slate-800 truncate">{b.name}</div>
              <div className="text-[11px] text-slate-400 truncate">ACO: {b.aco} · {fmtInt(b.member_count)} members</div>
              <div className="text-sm font-bold text-emerald-600 tabular-nums mt-0.5">{fmtRs(b.total_bonus)}</div>
            </>
          )}
        />
      </div>
    </div>
  )
}
