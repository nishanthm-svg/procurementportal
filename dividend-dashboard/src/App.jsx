import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { loadData, getMeta, getScope } from './data'
import DividendPresentation from './DividendPresentation'
import Landing from './Landing'
import { shreejaLogo, nddbLogo, nddsLogo } from './Brand'
import { INVEST, DIVIDEND, inr, inrShort, num, pct, allotLabel, Sparkline, ReturnBar, RankBadge, MemberCard } from './DividendKit'

const TOP_OPTIONS = [5, 10, 20]

// Selection lives in the URL hash so links work from a file:// copy as well as when hosted
function readHash() {
  return new URLSearchParams(window.location.hash.replace(/^#/, ''))
}
function useHashParams() {
  const [params, setState] = useState(readHash)
  useEffect(() => {
    const onHash = () => setState(readHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  function setParams(obj) {
    window.location.hash = new URLSearchParams(obj).toString()
  }
  return [params, setParams]
}

function Loader({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-sm text-slate-500">
      <div className="w-9 h-9 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
      {text}
    </div>
  )
}

function TopBar({ total, onHome }) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
        <button onClick={onHome} title="Back to home" className="flex-shrink-0">
          <img src={shreejaLogo} alt="Shreeja Mahila Milk Producer Company" className="h-10 w-auto" />
        </button>
        <div className="min-w-0 border-l border-slate-200 pl-3">
          <div className="font-display font-bold text-slate-800 leading-tight">Members Dividend</div>
          <div className="text-[11px] text-slate-400 truncate">FY 2014-15 to FY 2025-26{total ? ` · ${num(total.members)} members` : ''}</div>
        </div>
        <div className="ml-auto hidden md:flex items-center gap-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Supported by</span>
          <img src={nddbLogo} alt="National Dairy Development Board" className="h-8 w-auto" />
          <img src={nddsLogo} alt="NDDB Dairy Services" className="h-8 w-auto" />
        </div>
      </div>
    </header>
  )
}
const BAND_COLORS = ['#cbd5e1', '#a7f3d0', '#6ee7b7', '#34d399', '#059669', '#065f46']

function YearTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-md px-3 py-2 text-xs">
      <div className="font-bold text-slate-700 mb-1">{d.year}</div>
      <div className="flex justify-between gap-4"><span className="text-slate-500">Dividend paid</span><b className="tabular-nums">{inr(d.div)}</b></div>
      <div className="flex justify-between gap-4"><span className="text-slate-500">Cumulative</span><b className="tabular-nums">{inr(d.cum)}</b></div>
    </div>
  )
}

function Leaderboard({ title, data, nameLabel, onPick, sub }) {
  if (!data) return null
  const max = Math.max(...data.rows.map(r => r.div), 1)
  return (
    <div className="card">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="section-title">{title}</h3>
        <span className="text-[10px] text-slate-400">of {num(data.count)} {nameLabel}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {data.rows.map((r, i) => (
          <button key={r.key || r.name} onClick={() => onPick?.(r)} className="w-full text-left px-4 py-2.5 hover:bg-sky-50 transition flex items-center gap-3">
            <RankBadge rank={i + 1} />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between gap-2 min-w-0">
                <span className="text-[13px] font-semibold text-slate-800 truncate min-w-0">{r.name}</span>
                <span className="text-[13px] font-bold tabular-nums whitespace-nowrap flex-shrink-0" style={{ color: DIVIDEND }}>{inrShort(r.div)}</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(r.div / max) * 100}%`, background: DIVIDEND }} />
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">{sub?.(r) ?? `${num(r.members)} members`}</div>
              <div className="text-[10px] text-slate-500 tabular-nums truncate">Invested {inrShort(r.share)} · {pct(r.ret, 0)} came back as dividend</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function MembersTable({ members, startRank }) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState({ key: 'div', dir: -1 })
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    const f = members.filter(m => m.rank >= startRank && (!s || m.name.toLowerCase().includes(s) || m.code.includes(s) || (m.folio || '').includes(s)))
    return [...f].sort((a, b) => ((a[sort.key] > b[sort.key]) - (a[sort.key] < b[sort.key])) * sort.dir)
  }, [members, q, sort, startRank])
  const th = (key, label, r) => (
    <th className={`${r ? 'r' : ''} cursor-pointer select-none`} onClick={() => setSort(s => ({ key, dir: s.key === key ? -s.dir : -1 }))}>
      {label}{sort.key === key && <span className="ml-1 text-primary">{sort.dir === -1 ? '↓' : '↑'}</span>}
    </th>
  )
  return (
    <div className="card">
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap gap-2 justify-between items-center">
        <h3 className="section-title">Other members <span className="badge-blue ml-1">{rows.length}</span></h3>
        <input className="input w-60" placeholder="Search name, member code, folio…" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="p-4">
        <div className="tbl-wrap" style={{ maxHeight: '65vh' }}>
          <table className="tbl">
            <thead>
              <tr>
                {th('rank', '#', true)}
                {th('name', 'Member')}
                {th('folio', 'Folio')}
                {th('allot', 'First allotment')}
                {th('share', 'Invested (₹)', true)}
                {th('div', 'Dividend received (₹)', true)}
                {th('ret', '% returned', true)}
                <th>FY14-15 → FY25-26</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(m => (
                <tr key={m.code + m.folio}>
                  <td className="r text-slate-400">{m.rank}</td>
                  <td><div className="font-semibold text-slate-800">{m.name}</div><div className="text-[10px] text-slate-400">{m.code}</div></td>
                  <td className="text-slate-500">{m.folio}</td>
                  <td className="text-slate-500">{allotLabel(m.allot)}</td>
                  <td className="r font-semibold" style={{ color: INVEST }}>{num(m.share)}</td>
                  <td className="r font-bold" style={{ color: DIVIDEND }}>{num(m.div)}</td>
                  <td className="r"><div className="flex items-center justify-end gap-2"><ReturnBar share={m.share} div={m.div} compact /><span className="w-12 text-right">{pct(m.ret)}</span></div></td>
                  <td><Sparkline values={m.years} /></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={8} className="text-center text-slate-400 py-6">No members match</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [params, setParams] = useHashParams()
  const aco = params.get('aco') || ''
  const bmcu = params.get('bmcu') || ''
  const mpp = params.get('mpp') || ''
  const top = parseInt(params.get('top')) || 5

  const [meta, setMeta] = useState(null)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [presenting, setPresenting] = useState(false)

  useEffect(() => { loadData().then(() => setMeta(getMeta())).catch(e => setError(e.message)) }, [])
  useEffect(() => {
    if (!meta) return
    setLoading(true)
    // Let the progress bar paint before the (sub-second) aggregation runs
    const t = setTimeout(() => {
      try { setData(getScope({ aco, bmcu, mpp, top })) } catch (e) { setError(e.message) }
      setLoading(false)
    }, 0)
    return () => clearTimeout(t)
  }, [meta, aco, bmcu, mpp, top])

  const onDashboard = params.get('page') === 'dashboard' || !!(aco || bmcu || mpp)
  useEffect(() => { window.scrollTo(0, 0) }, [onDashboard])
  const goHome = () => setParams({})

  function update(next) {
    const p = { page: 'dashboard', aco, bmcu, mpp, top, ...next }
    const clean = Object.fromEntries(Object.entries(p).filter(([k, v]) => v && !(k === 'top' && v === 5)))
    setParams(clean)
  }

  const acoNode = meta?.tree.find(a => a.aco === aco)
  const bmcuNode = acoNode?.bmcus.find(b => b.bmcu === bmcu)
  const bmcuOptions = acoNode ? acoNode.bmcus : []
  const mppOptions = bmcuNode ? bmcuNode.mpps : []

  // Leaderboards may list a BMCU or village from outside the current ACO — find its parents in the tree
  function pickBmcu(r) {
    const a = aco || meta.tree.find(x => x.bmcus.some(b => b.bmcu === r.name))?.aco
    update({ aco: a, bmcu: r.name, mpp: '' })
  }
  function pickVillage(key) {
    for (const a of meta.tree) for (const b of a.bmcus) if (b.mpps.some(p => p.k === key)) return update({ aco: a.aco, bmcu: b.bmcu, mpp: key })
  }

  if (error) return <><TopBar onHome={goHome} /><div className="max-w-7xl mx-auto p-4"><div className="card card-body text-red-600 text-sm">Could not load dividend data: {error}</div></div></>
  if (!meta || !data) return <><TopBar onHome={goHome} /><Loader text="Loading 1.5 lakh member records…" /></>
  if (!onDashboard) return <Landing meta={meta} overview={data} onOpen={sel => setParams({ page: 'dashboard', ...sel })} />

  const k = data.kpis
  const level = data.level
  const scopeName = level === 'mpp' ? data.village?.name : level === 'bmcu' ? bmcu : level === 'aco' ? aco : 'All Members'
  const yoy = k.prevDiv ? (k.latestDiv - k.prevDiv) / k.prevDiv : 0
  const per100 = k.ret * 100
  const topMembers = level === 'mpp' ? data.members.slice(0, top) : data.topMembers

  return (
    <>
    <TopBar total={meta.total} onHome={goHome} />
    <main className="max-w-7xl mx-auto px-4 py-5">
      <p className="text-sm text-slate-500 mb-4">Share capital invested vs cumulative dividend received · FY 2014-15 to FY 2025-26</p>

      {/* Cascading filter: ACO → BMCU → Village */}
      <div className="card card-body mb-4 flex flex-wrap items-end gap-3 lg:sticky lg:top-16 z-20">
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ACO</span>
          <select className="select min-w-[190px]" value={aco} onChange={e => update({ aco: e.target.value, bmcu: '', mpp: '' })}>
            <option value="">All ACOs ({meta.tree.length})</option>
            {meta.tree.map(a => <option key={a.aco} value={a.aco}>{a.aco}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">BMCU</span>
          <select className="select min-w-[190px]" value={bmcu} disabled={!aco} onChange={e => update({ bmcu: e.target.value, mpp: '' })}>
            <option value="">{aco ? `All BMCUs (${bmcuOptions.length})` : 'Select ACO first'}</option>
            {bmcuOptions.map(b => <option key={b.bmcu} value={b.bmcu}>{b.bmcu}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Village (MPP)</span>
          <select className="select min-w-[220px]" value={mpp} disabled={!bmcu} onChange={e => update({ mpp: e.target.value })}>
            <option value="">{bmcu ? `All villages (${mppOptions.length})` : 'Select BMCU first'}</option>
            {mppOptions.map(p => <option key={p.k} value={p.k}>{p.name} · {p.code}</option>)}
          </select>
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Show top</span>
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            {TOP_OPTIONS.map(n => (
              <button key={n} onClick={() => update({ top: n })} className={`px-3 py-1.5 text-sm font-semibold ${top === n ? 'bg-emerald-600 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}>{n}</button>
            ))}
          </div>
        </div>
        {(aco || bmcu || mpp) && <button className="btn-ghost" onClick={() => update({ aco: '', bmcu: '', mpp: '' })}>Reset</button>}
        <button className="btn-primary ml-auto" onClick={() => setPresenting(true)}>▶ Present {level === 'mpp' ? 'village' : ''}</button>
      </div>

      {loading && <div className="h-1 bg-sky-100 overflow-hidden rounded mb-3"><div className="h-full w-1/3 bg-sky-400 animate-pulse" /></div>}

      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mb-3">
        <button className="hover:text-sky-600" onClick={() => update({ aco: '', bmcu: '', mpp: '' })}>All</button>
        {aco && <><span>›</span><button className="hover:text-sky-600" onClick={() => update({ bmcu: '', mpp: '' })}>{aco}</button></>}
        {bmcu && <><span>›</span><button className="hover:text-sky-600" onClick={() => update({ mpp: '' })}>{bmcu}</button></>}
        {mpp && <><span>›</span><span className="font-semibold text-slate-700">{data.village?.name} ({data.village?.code})</span></>}
      </div>

      {/* Hero: invested vs received */}
      <div className="rounded-2xl p-5 sm:p-6 mb-4 text-white shadow-md" style={{ background: 'linear-gradient(120deg, #065f46 0%, #059669 55%, #0d9488 100%)' }}>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-100">Total dividend received · {scopeName}</div>
            <div className="text-4xl sm:text-5xl font-bold font-display tabular-nums mt-1">{inr(k.div)}</div>
            <div className="text-sm text-emerald-50 mt-1">{inrShort(k.div)} paid to {num(k.members)} members over 12 years</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold uppercase tracking-widest text-emerald-100">Share capital invested</div>
            <div className="text-2xl sm:text-3xl font-bold font-display tabular-nums mt-1">{inr(k.share)}</div>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-xs text-emerald-50 mb-1.5">
            <span><b className="text-white text-base">₹{per100.toFixed(0)}</b> returned as dividend for every ₹100 invested</span>
            <span>{pct(k.ret)}</span>
          </div>
          <div className="h-3 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(k.ret, 1) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="kpi-card border-t-4 border-t-success">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Avg dividend / member</div>
          <div className="text-2xl font-bold font-display">{inr(k.perMember)}</div>
          <div className="text-[11px] text-slate-400">Cumulative, all years</div>
        </div>
        <div className="kpi-card border-t-4 border-t-primary">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">FY {k.latestYear} dividend</div>
          <div className="text-2xl font-bold font-display">{inrShort(k.latestDiv)}</div>
          <div className={`text-[11px] ${yoy >= 0 ? 'text-success' : 'text-danger'}`}>{yoy >= 0 ? '▲' : '▼'} {pct(Math.abs(yoy))} vs previous year</div>
        </div>
        <div className="kpi-card border-t-4 border-t-purple-500">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Got back ≥ 50%</div>
          <div className="text-2xl font-bold font-display">{num(k.halfBack)}</div>
          <div className="text-[11px] text-slate-400">members ({pct(k.members ? k.halfBack / k.members : 0, 0)}) recovered half their investment</div>
        </div>
        <div className="kpi-card border-t-4 border-t-warning">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Yet to receive</div>
          <div className="text-2xl font-bold font-display">{num(k.zeroDiv)}</div>
          <div className="text-[11px] text-slate-400">members with no dividend so far · {num(k.newMembers)} new</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4 mb-4">
        <div className="card lg:col-span-3">
          <div className="card-body">
            <h3 className="section-title">Dividend paid each year</h3>
            <p className="text-[11px] text-slate-400 mb-2">Hover a bar for the running cumulative total</p>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={data.years} margin={{ top: 16, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => v.replace('FY ', '')} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={inrShort} axisLine={false} tickLine={false} width={64} />
                <Tooltip content={<YearTooltip />} cursor={{ fill: '#ecfdf5' }} />
                <Bar dataKey="div" fill={DIVIDEND} radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card lg:col-span-2">
          <div className="card-body">
            <h3 className="section-title">How much of their investment came back</h3>
            <p className="text-[11px] text-slate-400 mb-2">Members by cumulative dividend as % of share invested</p>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={data.bands} layout="vertical" margin={{ top: 0, right: 40, left: 8, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: '#475569' }} width={104} axisLine={false} tickLine={false} />
                <Tooltip formatter={v => [num(v) + ' members', 'Count']} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22} label={{ position: 'right', fontSize: 10, fill: '#64748b', formatter: num }}>
                  {data.bands.map((_, i) => <Cell key={i} fill={BAND_COLORS[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top members */}
      <div className="flex items-center justify-between mb-2 mt-6">
        <h2 className="text-[15px] font-bold font-display text-slate-800">Top {top} members by dividend received {level !== 'all' && <span className="text-slate-400 font-medium">· {scopeName}</span>}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {topMembers.map(m => <MemberCard key={m.code + m.folio} m={m} showPlace={level !== 'mpp'} onPlace={x => pickVillage(x.mppKey)} />)}
      </div>

      {/* Leaderboards */}
      {level !== 'mpp' && (
        <div className="grid lg:grid-cols-3 gap-4 mb-6">
          {data.topAcos && <Leaderboard title={`Top ${top} ACOs`} data={data.topAcos} nameLabel="ACOs" onPick={r => update({ aco: r.name, bmcu: '', mpp: '' })} sub={r => `${num(r.members)} members · ${num(r.villages)} villages`} />}
          {data.topBmcus && <Leaderboard title={`Top ${top} BMCUs`} data={data.topBmcus} nameLabel="BMCUs" onPick={pickBmcu} sub={r => `${num(r.members)} members · ${r.aco}`} />}
          {data.topMpps && <Leaderboard title={`Top ${top} villages`} data={data.topMpps} nameLabel="villages" onPick={r => pickVillage(r.key)} sub={r => `${num(r.members)} members · ${r.bmcu}`} />}
        </div>
      )}

      {level === 'mpp' && <MembersTable members={data.members} startRank={top + 1} />}

      {level !== 'mpp' && (
        <div className="card card-body text-sm text-slate-500 text-center">
          Select an <b>ACO → BMCU → Village</b> above to see every member of that village and open its presentation.
        </div>
      )}

      {presenting && <DividendPresentation data={data} scopeName={scopeName} top={top} onClose={() => setPresenting(false)} />}
    </main>
    </>
  )
}
