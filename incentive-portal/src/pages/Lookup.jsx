import { useEffect, useState } from 'react'
import { PageHeader } from '../components/Loader'
import SearchPicker from '../components/SearchPicker'
import Breadcrumb from '../components/Breadcrumb'
import { getBmcus, getMpps, getMembers } from '../lib/dataLoader'
import { fmtRs, fmtRsFull, fmtNum, fmtInt } from '../lib/format'

export default function Lookup() {
  const [bmcu, setBmcu] = useState(null)
  const [mpp, setMpp] = useState(null)
  const [member, setMember] = useState(null)
  const [mpps, setMpps] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  const bmcus = getBmcus()

  useEffect(() => {
    if (!bmcu) return
    setLoading(true)
    getMpps(bmcu.code).then(setMpps).finally(() => setLoading(false))
  }, [bmcu])

  useEffect(() => {
    if (!bmcu || !mpp) return
    setLoading(true)
    getMembers(bmcu.code, mpp.code).then(setMembers).finally(() => setLoading(false))
  }, [bmcu, mpp])

  function reset() { setBmcu(null); setMpp(null); setMember(null); setMpps([]); setMembers([]) }
  function backToBmcu() { setMpp(null); setMember(null); setMpps([]) }
  function backToMpp() { setMember(null) }

  const crumbs = [{ label: 'BMCU', onClick: bmcu ? reset : undefined }]
  if (bmcu) crumbs.push({ label: bmcu.name, onClick: mpp ? backToBmcu : undefined })
  if (mpp) crumbs.push({ label: mpp.name, onClick: member ? backToMpp : undefined })
  if (member) crumbs.push({ label: member.name })

  return (
    <div>
      <PageHeader
        title="Producer Lookup"
        sub="Select BMCU → MPP → Member to view their bonus / price incentive"
        badge={`${bmcus.length} BMCUs`}
      />

      {(bmcu || mpp || member) && <Breadcrumb items={crumbs} />}

      <div className="card p-4">
        {!bmcu && (
          <SearchPicker
            items={bmcus}
            placeholder="Search BMCU by name or code…"
            getSearchText={b => `${b.name} ${b.code}`}
            onSelect={setBmcu}
            renderItem={b => (
              <>
                <div>
                  <div className="font-semibold text-slate-800">{b.name}</div>
                  <div className="text-xs text-slate-400">Code {b.code} · ACO: {b.aco} · {fmtInt(b.member_count)} members</div>
                </div>
                <span className="text-sky-500">›</span>
              </>
            )}
          />
        )}

        {bmcu && !mpp && (
          loading ? <p className="text-sm text-slate-400 py-8 text-center">Loading MPPs…</p> : (
            <SearchPicker
              items={mpps}
              placeholder="Search MPP by name or code…"
              getSearchText={m => `${m.name} ${m.code}`}
              onSelect={setMpp}
              emptyLabel="No MPPs found for this BMCU"
              renderItem={m => (
                <>
                  <div>
                    <div className="font-semibold text-slate-800">{m.name}</div>
                    <div className="text-xs text-slate-400">Code {m.code} · {fmtInt(m.member_count)} members</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-emerald-600 tabular-nums">{fmtRs(m.total_bonus)}</div>
                    <div className="text-[10px] text-slate-400">total bonus</div>
                  </div>
                </>
              )}
            />
          )
        )}

        {bmcu && mpp && !member && (
          loading ? <p className="text-sm text-slate-400 py-8 text-center">Loading members…</p> : (
            <SearchPicker
              items={members}
              placeholder="Search producer by name or code…"
              getSearchText={m => `${m.name} ${m.code}`}
              onSelect={setMember}
              emptyLabel="No members found for this MPP"
              renderItem={m => (
                <>
                  <div>
                    <div className="font-semibold text-slate-800">{m.name}</div>
                    <div className="text-xs text-slate-400">Code {m.code}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-emerald-600 tabular-nums">{fmtRs(m.bonus)}</div>
                    <div className="text-[10px] text-slate-400">bonus</div>
                  </div>
                </>
              )}
            />
          )
        )}

        {member && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-4">
              <div className="text-2xl font-bold font-display text-slate-800">{member.name}</div>
              <div className="text-sm text-slate-400">Member Code: {member.code}</div>
              <div className="text-xs text-slate-400 mt-1">{mpp.name} MPP · {bmcu.name} BMCU · ACO: {bmcu.aco}</div>
            </div>

            <div className="rounded-2xl bg-gradient-to-br from-sky-500 to-sky-600 text-white p-5 mb-3 shadow-md">
              <div className="text-sky-100 text-xs font-semibold uppercase tracking-wide">Bonus / Price Incentive</div>
              <div className="text-4xl font-bold font-display mt-1 tabular-nums">{fmtRsFull(member.bonus)}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="card p-3">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Milk Qty (FY25-26)</div>
                <div className="text-lg font-bold text-slate-800 tabular-nums">{fmtNum(member.qty)} L</div>
              </div>
              <div className="card p-3">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Medical Kit</div>
                <div className="text-lg font-bold text-slate-800 tabular-nums">{fmtRs(member.medical)}</div>
              </div>
              <div className="card p-3 col-span-2 border-l-4 border-emerald-400">
                <div className="text-[11px] text-slate-400 font-semibold uppercase">Total (Bonus + Medical Kit)</div>
                <div className="text-xl font-bold text-emerald-600 tabular-nums">{fmtRsFull(member.total)}</div>
              </div>
              {member.status && (
                <div className="card p-3 col-span-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-semibold uppercase">Status</span>
                  <span className="badge-green">{member.status}</span>
                </div>
              )}
            </div>

            <button className="btn-ghost w-full mt-4" onClick={backToMpp}>← Back to member list</button>
          </div>
        )}
      </div>
    </div>
  )
}
