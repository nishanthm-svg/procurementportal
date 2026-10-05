import { useMemo, useState } from 'react'
import { LogoStrip } from './Brand'
import { DIVIDEND, INVEST, inr, inrShort, num } from './DividendKit'

export default function Landing({ meta, overview, onOpen }) {
  const [q, setQ] = useState('')
  const k = overview.kpis
  const per100 = Math.round(k.ret * 100)
  const maxYear = Math.max(...overview.years.map(y => y.div))

  const villages = useMemo(() => meta.tree.flatMap(a => a.bmcus.flatMap(b => b.mpps.map(p => ({ ...p, aco: a.aco, bmcu: b.bmcu })))), [meta])
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 2) return []
    return villages.filter(v => v.name.toLowerCase().includes(s) || v.code.includes(s)).slice(0, 8)
  }, [q, villages])

  const stats = [
    ['Members', num(k.members), 'women shareholders'],
    ['Villages', num(k.villages), `${k.bmcus} BMCUs · ${k.acos} ACOs`],
    ['Share capital', inrShort(k.share), 'invested by members'],
    ['Dividend paid', inrShort(k.div), '12 years, cumulative'],
  ]

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Logo strip */}
      <header className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <LogoStrip size="lg" className="justify-between" />
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden text-white" style={{ background: 'linear-gradient(125deg, #064e3b 0%, #047857 55%, #0f766e 100%)' }}>
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-white/5" aria-hidden="true" />
        <div className="absolute right-40 -bottom-32 w-72 h-72 rounded-full bg-white/5" aria-hidden="true" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-16 grid lg:grid-cols-[1.25fr_1fr] gap-10 items-center">
          <div>
            <div className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.25em] text-emerald-200">Members Dividend · FY 2014-15 to 2025-26</div>
            <h1 className="font-display font-bold text-3xl sm:text-5xl leading-[1.1] mt-3">
              {inr(k.div)} returned to our members as dividend
            </h1>
            <p className="text-emerald-50 text-base sm:text-lg mt-4 max-w-xl">
              For every <b className="text-white">₹100</b> our members invested in Shreeja shares, <b className="text-white">₹{per100}</b> has already come back as dividend — and they still own every share.
            </p>
            <div className="flex flex-wrap gap-3 mt-7">
              <button onClick={() => onOpen({})} className="px-5 py-2.5 rounded-xl bg-white text-emerald-800 font-bold shadow-lg hover:bg-emerald-50 transition">Open dashboard →</button>
              <button onClick={() => document.getElementById('find')?.scrollIntoView({ behavior: 'smooth' })} className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition">Find a village</button>
            </div>
          </div>

          {/* Year-by-year growth, single series */}
          <div className="rounded-2xl bg-white/10 backdrop-blur p-5">
            <div className="flex justify-between items-baseline">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-100">Dividend paid each year</div>
              <div className="text-xs text-emerald-100">FY {k.latestYear}: <b className="text-white">{inrShort(k.latestDiv)}</b></div>
            </div>
            <div className="flex items-end gap-1.5 h-40 mt-4" role="img" aria-label="Dividend paid each year, rising from FY 14-15 to FY 25-26">
              {overview.years.map(y => (
                <div key={y.year} className="flex-1 flex flex-col items-center justify-end h-full group">
                  <div className="w-full rounded-t bg-white/85 group-hover:bg-white transition" style={{ height: `${Math.max((y.div / maxYear) * 100, 1.5)}%` }} title={`${y.year}: ${inr(y.div)}`} />
                </div>
              ))}
            </div>
            <div className="flex gap-1.5 mt-1.5">
              {overview.years.map(y => <div key={y.year} className="flex-1 text-center text-[9px] text-emerald-100">{y.year.slice(3, 5)}</div>)}
            </div>
          </div>
        </div>
      </section>

      {/* Headline stats */}
      <section className="max-w-6xl mx-auto px-4 -mt-7 relative w-full">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(([label, value, sub], i) => (
            <div key={label} className="bg-white rounded-xl shadow-md border border-slate-100 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
              <div className="text-2xl font-bold font-display mt-1" style={{ color: i === 3 ? DIVIDEND : i === 2 ? INVEST : '#1e293b' }}>{value}</div>
              <div className="text-[11px] text-slate-400">{sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Find a village */}
      <section id="find" className="max-w-6xl mx-auto px-4 py-12 w-full grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-display font-bold text-2xl text-slate-800">Find a village</h2>
          <p className="text-sm text-slate-500 mt-1">Type a village name or code to open its dividend report and presentation.</p>
          <input className="input w-full mt-4 py-2.5 text-base" placeholder="e.g. Garigachinnepalle or 3446001" value={q} onChange={e => setQ(e.target.value)} />
          <div className="mt-2 divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden empty:hidden">
            {matches.map(v => (
              <button key={v.k} onClick={() => onOpen({ aco: v.aco, bmcu: v.bmcu, mpp: v.k })} className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 flex justify-between gap-3">
                <span className="min-w-0">
                  <span className="font-semibold text-slate-800 block truncate">{v.name} <span className="text-slate-400 font-normal">· {v.code}</span></span>
                  <span className="text-[11px] text-slate-400 block truncate">{v.bmcu} BMCU · ACO {v.aco} · {num(v.members)} members</span>
                </span>
                <span className="font-bold tabular-nums whitespace-nowrap" style={{ color: DIVIDEND }}>{inrShort(v.div)}</span>
              </button>
            ))}
          </div>
          {q.trim().length >= 2 && !matches.length && <p className="text-sm text-slate-400 mt-3">No village matches “{q}”.</p>}
        </div>
        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-6">
          <h3 className="font-display font-bold text-lg text-slate-800">What's inside</h3>
          <ul className="mt-3 space-y-3 text-sm text-slate-600">
            {[
              ['Invested vs received', 'Share capital each member put in, against the total dividend she has received since FY 2014-15.'],
              ['Top members, BMCUs & ACOs', 'Leaders by dividend received — Top 5 by default, or 10 / 20.'],
              ['Every village, every member', 'Pick ACO → BMCU → village to see the full member list.'],
              ['Village presentation', 'One click turns any village into slides you can show at a meeting or save as PDF.'],
            ].map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <span className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ background: DIVIDEND }} />
                <span><b className="text-slate-800">{t}.</b> {d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="mt-auto border-t border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-wrap items-center justify-between gap-4">
          <LogoStrip size="sm" />
          <span className="text-[11px] text-slate-400">Share capital up to March 2026 · Dividend FY 2014-15 to FY 2025-26</span>
        </div>
      </footer>
    </div>
  )
}
