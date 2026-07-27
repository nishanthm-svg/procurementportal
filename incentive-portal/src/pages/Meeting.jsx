import { useEffect, useMemo, useState } from 'react'
import { PageHeader } from '../components/Loader'
import SearchPicker from '../components/SearchPicker'
import Breadcrumb from '../components/Breadcrumb'
import Slideshow from '../components/Slideshow'
import { getBmcus, getMpps, getMembers } from '../lib/dataLoader'
import { fmtRs, fmtNum, fmtInt } from '../lib/format'

const PER_SLIDE = 10

function buildSlides(bmcu, mpp, sorted, totalQty, totalBonus, top5) {
  const slides = []

  slides.push(
    <div key="title" className="text-center text-white">
      <div className="text-4xl sm:text-5xl font-bold font-display mb-4">Producer Incentive</div>
      <div className="text-2xl sm:text-3xl mb-2">{mpp.name} MPP</div>
      <div className="text-lg sm:text-xl text-sky-200">{bmcu.name} BMCU · ACO: {bmcu.aco}</div>
      <div className="text-sm text-sky-300 mt-8">{new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
  )

  slides.push(
    <div key="summary" className="text-white text-center">
      <div className="text-3xl font-bold font-display mb-8">Meeting Summary</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white/10 rounded-2xl p-6">
          <div className="text-sky-200 text-sm uppercase font-semibold">Producers</div>
          <div className="text-4xl font-bold mt-2 tabular-nums">{fmtInt(sorted.length)}</div>
        </div>
        <div className="bg-white/10 rounded-2xl p-6">
          <div className="text-sky-200 text-sm uppercase font-semibold">Milk Qty Poured</div>
          <div className="text-4xl font-bold mt-2 tabular-nums">{fmtNum(totalQty)} L</div>
        </div>
        <div className="bg-white/10 rounded-2xl p-6">
          <div className="text-sky-200 text-sm uppercase font-semibold">Total Bonus</div>
          <div className="text-4xl font-bold mt-2 tabular-nums">{fmtRs(totalBonus)}</div>
        </div>
      </div>
    </div>
  )

  slides.push(
    <div key="top5" className="text-white">
      <div className="text-3xl font-bold font-display mb-6 text-center">🏆 Top 5 Highest Bonus</div>
      <div className="flex flex-col gap-3">
        {top5.map((m, i) => (
          <div key={i} className="flex items-center justify-between bg-white/10 rounded-xl px-5 py-3">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-amber-300 w-8">{i + 1}</span>
              <span className="text-lg font-semibold">{m.name}</span>
            </div>
            <span className="text-xl font-bold text-emerald-300 tabular-nums">{fmtRs(m.bonus)}</span>
          </div>
        ))}
      </div>
    </div>
  )

  for (let start = 0; start < sorted.length; start += PER_SLIDE) {
    const chunk = sorted.slice(start, start + PER_SLIDE)
    slides.push(
      <div key={`page-${start}`} className="text-white">
        <div className="text-xl font-bold font-display mb-4 text-center">
          All Producers · {start + 1}–{Math.min(start + PER_SLIDE, sorted.length)} of {sorted.length}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-sky-300 text-left border-b border-white/20">
              <th className="py-1.5 w-10">#</th>
              <th className="py-1.5">Producer</th>
              <th className="py-1.5 text-right">Qty (L)</th>
              <th className="py-1.5 text-right">Bonus</th>
            </tr>
          </thead>
          <tbody>
            {chunk.map((m, idx) => (
              <tr key={idx} className="border-b border-white/10">
                <td className="py-1.5 tabular-nums">{start + idx + 1}</td>
                <td className="py-1.5">{m.name}</td>
                <td className="py-1.5 text-right tabular-nums">{fmtNum(m.qty)}</td>
                <td className="py-1.5 text-right tabular-nums font-semibold text-emerald-300">{fmtRs(m.bonus)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  slides.push(
    <div key="thanks" className="text-white text-center">
      <div className="text-4xl font-bold font-display mb-4">Thank You</div>
      <div className="text-lg text-sky-200">
        Total Milk Poured: {fmtNum(totalQty)} L &nbsp;·&nbsp; Total Bonus Disbursed: {fmtRs(totalBonus)}
      </div>
    </div>
  )

  return slides
}

export default function Meeting() {
  const [bmcu, setBmcu] = useState(null)
  const [mpp, setMpp] = useState(null)
  const [mpps, setMpps] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [presenting, setPresenting] = useState(false)
  const [exporting, setExporting] = useState(false)

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

  const sorted = useMemo(() => [...members].sort((a, b) => b.bonus - a.bonus), [members])
  const totalQty = useMemo(() => members.reduce((s, m) => s + m.qty, 0), [members])
  const totalBonus = useMemo(() => members.reduce((s, m) => s + m.bonus, 0), [members])
  const top5 = sorted.slice(0, 5)

  function reset() { setBmcu(null); setMpp(null); setMpps([]); setMembers([]) }
  function backToBmcu() { setMpp(null); setMembers([]) }

  async function handleExport() {
    setExporting(true)
    try {
      const { buildMeetingPptx } = await import('../lib/pptx')
      await buildMeetingPptx({ bmcu, mpp, members })
    } finally {
      setExporting(false)
    }
  }

  const crumbs = [{ label: 'BMCU', onClick: bmcu ? reset : undefined }]
  if (bmcu) crumbs.push({ label: bmcu.name, onClick: mpp ? backToBmcu : undefined })
  if (mpp) crumbs.push({ label: mpp.name })

  return (
    <div>
      <PageHeader
        title="Village Meeting"
        sub="Select BMCU → MPP to get a bonus-ranked list, ready to present or export as a slide deck"
      />

      {(bmcu || mpp) && <Breadcrumb items={crumbs} />}

      {!mpp && (
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
                    <div className="text-xs text-slate-400">Code {b.code} · ACO: {b.aco}</div>
                  </div>
                  <span className="text-sky-500">›</span>
                </>
              )}
            />
          )}
          {bmcu && (
            loading ? <p className="text-sm text-slate-400 py-8 text-center">Loading MPPs…</p> : (
              <SearchPicker
                items={mpps}
                placeholder="Search MPP by name or code…"
                getSearchText={m => `${m.name} ${m.code}`}
                onSelect={setMpp}
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
        </div>
      )}

      {mpp && (
        loading ? <p className="text-sm text-slate-400 py-8 text-center">Loading members…</p> : (
          <div>
            <div className="flex flex-wrap gap-2 mb-4">
              <button className="btn-primary" onClick={() => setPresenting(true)}>▶ Present</button>
              <button className="btn-gold" onClick={handleExport} disabled={exporting}>
                {exporting ? 'Building PPTX…' : '⬇ Download PPTX'}
              </button>
              <button className="btn-ghost ml-auto" onClick={backToBmcu}>Change MPP</button>
            </div>

            <div className="card mb-4 border-l-4 border-amber-300 bg-amber-50/40">
              <div className="p-3">
                <div className="text-xs font-bold text-amber-700 uppercase mb-2">🏆 Top 5 Highest Bonus</div>
                <div className="flex flex-col gap-1.5">
                  {top5.map((m, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span><span className="font-bold text-amber-600 mr-2">{i + 1}.</span>{m.name}</span>
                      <span className="font-semibold text-emerald-600 tabular-nums">{fmtRs(m.bonus)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="tbl-wrap max-h-[55vh]">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Producer</th>
                    <th className="r">Qty (L)</th>
                    <th className="r">Bonus (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((m, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{m.name}</td>
                      <td className="r">{fmtNum(m.qty)}</td>
                      <td className="r font-semibold text-emerald-600">{fmtRs(m.bonus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="card mt-3 p-4 flex flex-wrap gap-6 justify-around bg-slate-800 text-white">
              <div className="text-center">
                <div className="text-xs uppercase text-slate-300">Producers</div>
                <div className="text-xl font-bold tabular-nums">{fmtInt(sorted.length)}</div>
              </div>
              <div className="text-center">
                <div className="text-xs uppercase text-slate-300">Total Milk Qty</div>
                <div className="text-xl font-bold tabular-nums">{fmtNum(totalQty)} L</div>
              </div>
              <div className="text-center">
                <div className="text-xs uppercase text-slate-300">Total Bonus</div>
                <div className="text-xl font-bold tabular-nums text-emerald-300">{fmtRs(totalBonus)}</div>
              </div>
            </div>
          </div>
        )
      )}

      {presenting && (
        <Slideshow
          slides={buildSlides(bmcu, mpp, sorted, totalQty, totalBonus, top5)}
          onClose={() => setPresenting(false)}
        />
      )}
    </div>
  )
}
