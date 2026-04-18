import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { api } from '../api'
import { fmtNum, fmtRs, fmtLpd } from '../components/DataTable'

function fmt(v) { return v == null ? 0 : v }
function pct(v) { if (v == null) return '—'; const n = Math.abs(v) <= 1 ? v * 100 : v; return n.toFixed(1) + '%' }
function sign(v) { if (v == null) return null; return Math.abs(v) <= 1 ? v * 100 : v }

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'feed', label: 'Feed Analysis', icon: '🌾' },
  { id: 'lfl', label: 'LFL Comparison', icon: '⚖️' },
  { id: 'gprs', label: 'GPRS', icon: '📡' },
  { id: 'cost', label: 'Cost & Commission', icon: '💰' },
  { id: 'transport', label: 'Transport', icon: '🚛' },
  { id: 'bmcu', label: 'BMCUs', icon: '🏭' },
  { id: 'mpps', label: 'All MPPs', icon: '📋' },
  { id: 'low-lpd', label: '<30 LPD', icon: '⚠️' },
  { id: 'low-ts', label: '<12 TS', icon: '🔻' },
  { id: 'single-pourer', label: 'Single Pourer', icon: '👤' },
  { id: 'closed', label: 'Closed MPPs', icon: '🚫' },
  { id: 'cans', label: 'Cans Account', icon: '🔧' },
  { id: 'manpower', label: 'Manpower', icon: '👷' },
  { id: 'recoveries', label: 'Recoveries', icon: '💳' },
]

function Section({ id, title, icon, badge, badgeColor = 'blue', children, rightContent }) {
  return (
    <div id={id} style={{ marginBottom: 20 }}>
      <div style={{
        background: '#fff', borderRadius: 12, border: '1px solid #e0f2fe',
        boxShadow: '0 1px 4px rgba(14,165,233,0.06)', overflow: 'hidden',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', borderBottom: '1px solid #e0f2fe',
          background: '#f0f9ff',
        }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: '#0c4a6e' }}>
            {icon} {title}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {rightContent}
            {badge != null && (
              <span style={{
                padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: badgeColor === 'red' ? '#fde8ea' : badgeColor === 'amber' ? '#fef4e6' : badgeColor === 'green' ? '#e8f8f0' : '#e0f2fe',
                color: badgeColor === 'red' ? '#d93843' : badgeColor === 'amber' ? '#d4850c' : badgeColor === 'green' ? '#12a362' : '#0284c7',
              }}>{badge}</span>
            )}
          </div>
        </div>
        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  )
}

function KPI({ label, value, sub, color = 'blue', icon }) {
  const colors = {
    blue: { bg: '#e0f2fe', text: '#0284c7', border: '#0ea5e9' },
    green: { bg: '#e8f8f0', text: '#12a362', border: '#12a362' },
    red: { bg: '#fde8ea', text: '#d93843', border: '#d93843' },
    amber: { bg: '#fef4e6', text: '#d4850c', border: '#d4850c' },
    purple: { bg: '#f3e8ff', text: '#7c3aed', border: '#7c3aed' },
  }
  const c = colors[color] || colors.blue
  return (
    <div style={{
      background: '#fff', border: '1px solid #e0f2fe', borderTop: `3px solid ${c.border}`,
      borderRadius: 10, padding: '12px 14px',
      boxShadow: '0 1px 4px rgba(14,165,233,0.05)',
    }}>
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function StatRow({ label, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f0f9ff', fontSize: 12 }}>
      <span style={{ color: '#64748b' }}>{label}</span>
      <span style={{ fontWeight: 700, color: valueColor || '#0f172a' }}>{value || '—'}</span>
    </div>
  )
}

function MetricBox({ label, value, color }) {
  return (
    <div style={{ background: '#f0f9ff', borderRadius: 8, padding: '10px 12px', border: '1px solid #e0f2fe' }}>
      <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: color || '#0f172a' }}>{value || '—'}</div>
    </div>
  )
}

function TblWrap({ children }) {
  return (
    <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #e0f2fe' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        {children}
      </table>
    </div>
  )
}

function Th({ children, right }) {
  return (
    <th style={{
      padding: '8px 12px', textAlign: right ? 'right' : 'left', fontSize: 10,
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: '#64748b',
      background: '#f0f9ff', borderBottom: '1px solid #e0f2fe', whiteSpace: 'nowrap',
    }}>{children}</th>
  )
}

function Td({ children, right, bold, color }) {
  return (
    <td style={{
      padding: '7px 12px', textAlign: right ? 'right' : 'left',
      borderBottom: '1px solid #f8fafc', whiteSpace: 'nowrap',
      fontWeight: bold ? 700 : 400, color: color || '#1e293b',
    }}>{children == null ? '—' : children}</td>
  )
}

export default function AODetailView() {
  const { aoName } = useParams()
  const navigate = useNavigate()
  const ao = decodeURIComponent(aoName)
  const [activeSection, setActiveSection] = useState('dashboard')

  const [aoData, setAoData] = useState(null)
  const [bmcus, setBmcus] = useState([])
  const [mpps, setMpps] = useState([])
  const [lowLpd, setLowLpd] = useState([])
  const [lowTs, setLowTs] = useState([])
  const [singlePourer, setSinglePourer] = useState([])
  const [closedMpp, setClosedMpp] = useState([])
  const [lfl, setLfl] = useState([])
  const [bva, setBva] = useState([])
  const [cans, setCans] = useState([])
  const [manpower, setManpower] = useState([])
  const [recoveries, setRecoveries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.ao({ ao }),
      api.bmcu({ ao, limit: 100 }),
      api.mpp({ ao, limit: 500 }),
      api.lowLpd({ ao, limit: 500 }),
      api.lowTs({ ao, limit: 500 }),
      api.singlePourer({ ao }),
      api.closedMpp(),
      api.lflBmcu({ ao }),
      api.budgetVsActual({ ao }),
      api.cans({ ao }),
      api.manpower(),
      api.recoveries({ ao, limit: 200 }),
    ]).then(([aoArr, bm, mp, ll, lt, sp, cm, lf, bv, ca, mn, rc]) => {
      setAoData(aoArr[0] || null)
      setBmcus(bm.data || [])
      setMpps(mp.data || [])
      setLowLpd(ll.data || [])
      setLowTs(lt.data || [])
      setSinglePourer(sp || [])
      setClosedMpp((cm || []).filter(r => r.ao === ao))
      setLfl(lf || [])
      setBva(bv || [])
      setCans(ca || [])
      setManpower((mn || []).filter(r => r.ao === ao))
      setRecoveries(rc.data || [])
    }).finally(() => setLoading(false))
  }, [ao])

  function scrollTo(id) {
    setActiveSection(id)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🥛</div>
        <div style={{ color: '#0ea5e9', fontSize: 14, fontWeight: 600 }}>Loading dashboard…</div>
      </div>
    </div>
  )
  if (!aoData) return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div style={{ color: '#d93843', fontSize: 14 }}>AO not found: {ao}</div>
    </div>
  )

  const d = aoData
  const achPct = d.ach_pct != null ? Math.round(d.ach_pct * 100) : (d.bud_lpd ? Math.round((d.cow_lpd || 0) / d.bud_lpd * 100) : null)
  const feedAchPct = d.feed_ach_pct != null ? Math.round(d.feed_ach_pct * 100) : null
  const gprsActual = d.gprs_pct != null ? Math.round(sign(d.gprs_pct)) : null

  const bvaChartData = bva.slice(0, 20).map(r => ({
    name: r.plant_name?.split(' ').slice(-1)[0] || r.plant_code,
    full: r.plant_name,
    budget: Math.round(r.budget || 0),
    actual: Math.round(r.actual || 0),
  }))

  const topMpps = [...mpps].sort((a, b) => (b.lpd || 0) - (a.lpd || 0)).slice(0, 10)

  const totalRecAmt = recoveries.reduce((a, r) => a + (r.amount || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: '#f0f9ff', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* ── TOP BAR ── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid #bae6fd', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', position: 'sticky', top: 0, zIndex: 200,
        boxShadow: '0 1px 8px rgba(14,165,233,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/')} style={{
            background: 'rgba(14,165,233,0.1)', color: '#0284c7', border: '1px solid #bae6fd',
            padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>← Back</button>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: '#0c4a6e', fontWeight: 800 }}>{ao}</span>
            <span style={{ margin: '0 6px', color: '#94a3b8' }}>·</span>
            <span style={{ color: '#64748b' }}>{d.cluster_manager}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
            {bmcus.length} BMCUs
          </span>
          <span style={{ background: '#e0f2fe', color: '#0284c7', padding: '3px 10px', borderRadius: 20, fontWeight: 700 }}>
            {mpps.length} MPPs
          </span>
          <span style={{ color: '#94a3b8', fontSize: 11 }}>Mar&#39;26</span>
        </div>
      </div>

      <div style={{ display: 'flex' }}>
        {/* ── SIDEBAR ── */}
        <div style={{
          width: 200, flexShrink: 0, background: '#fff', borderRight: '1px solid #e0f2fe',
          position: 'sticky', top: 52, height: 'calc(100vh - 52px)', overflowY: 'auto',
          padding: '12px 8px',
        }}>
          {NAV.map(n => (
            <button key={n.id} onClick={() => scrollTo(n.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', border: 'none', textAlign: 'left', fontFamily: 'inherit',
                background: activeSection === n.id ? 'rgba(14,165,233,0.1)' : 'transparent',
                color: activeSection === n.id ? '#0284c7' : '#475569',
                transition: 'all 0.12s',
                marginBottom: 2,
              }}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </div>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex: 1, padding: '20px 24px', minWidth: 0 }}>
          {/* ── DASHBOARD ── */}
          <div id="dashboard" style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 12 }}>
              <h2 style={{ color: '#0c4a6e', fontSize: 18, fontWeight: 800, marginBottom: 2 }}>
                {ao} — Procurement Dashboard
              </h2>
              <p style={{ color: '#64748b', fontSize: 12 }}>March 2026 · All metrics below are for this AO only</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
              <KPI label="Cow LPD" value={fmtNum(Math.round(fmt(d.cow_lpd)))} sub="Litres/day" color="blue" icon="🥛" />
              <KPI label="Budget LPD" value={d.bud_lpd ? fmtNum(Math.round(d.bud_lpd)) : '—'} sub="Target" color="amber" icon="🎯" />
              <KPI label="Achievement" value={achPct != null ? achPct + '%' : '—'} sub="vs Budget" color={achPct >= 100 ? 'green' : achPct >= 90 ? 'amber' : 'red'} icon="📊" />
              <KPI label="Total Qty" value={fmtNum(Math.round(fmt(d.cow_qty) / 1000)) + 'K'} sub="Litres this month" color="blue" icon="📦" />
              <KPI label="Amount" value={'₹' + fmtRs(d.cow_amount)} sub="Farmer payments" color="amber" icon="💰" />
              <KPI label="GPRS%" value={gprsActual != null ? gprsActual + '%' : '—'} sub="Target: 95%" color={gprsActual >= 95 ? 'green' : gprsActual >= 90 ? 'amber' : 'red'} icon="📡" />
              <KPI label="Fat%" value={fmt(d.cow_fat).toFixed(3) + '%'} sub="Cow milk" color="green" icon="🔬" />
              <KPI label="SNF%" value={fmt(d.cow_snf).toFixed(3) + '%'} sub="Cow milk" color="green" icon="🧪" />
              <KPI label="Reg. Members" value={d.reg_members ? fmtNum(d.reg_members) : '—'} sub="Registered" color="purple" icon="👥" />
              <KPI label="Pouring" value={d.pouring_members ? fmtNum(d.pouring_members) : '—'} sub={d.pouring_pct ? pct(d.pouring_pct) + ' active' : 'Active'} color="blue" icon="🥛" />
              <KPI label="<30 LPD" value={fmtNum(lowLpd.length)} sub="MPPs at risk" color={lowLpd.length > 0 ? 'red' : 'green'} icon="⚠️" />
              <KPI label="Single Pourer" value={fmtNum(singlePourer.length)} sub="MPPs at risk" color={singlePourer.length > 0 ? 'red' : 'green'} icon="👤" />
            </div>

            {/* Budget vs Actual Chart */}
            {bvaChartData.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e0f2fe', padding: 16, boxShadow: '0 1px 4px rgba(14,165,233,0.06)' }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#0c4a6e', marginBottom: 12 }}>📈 BMCU Budget vs Actual LPD</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={bvaChartData} margin={{ top: 0, right: 10, left: 0, bottom: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f9ff" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} angle={-30} textAnchor="end" interval={0} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={v => fmtNum(v)} />
                    <Tooltip formatter={(v, n) => [fmtNum(v) + ' L/day', n]} labelFormatter={(l, p) => p?.[0]?.payload?.full || l} />
                    <Bar dataKey="budget" fill="#d4850c" radius={[3,3,0,0]} opacity={0.7} name="Budget LPD" />
                    <Bar dataKey="actual" fill="#0ea5e9" radius={[3,3,0,0]} name="Actual LPD">
                      {bvaChartData.map((r, i) => <Cell key={i} fill={r.actual >= r.budget ? '#12a362' : '#d93843'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* ── FEED ANALYSIS ── */}
          <Section id="feed" title="Feed Analysis" icon="🌾" badge={feedAchPct != null ? feedAchPct + '% Achievement' : null} badgeColor={feedAchPct >= 100 ? 'green' : feedAchPct >= 90 ? 'amber' : 'red'}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 14 }}>
              <MetricBox label="Budget Feed" value={d.bud_feed_mt ? fmtNum(d.bud_feed_mt, 1) + ' MT' : null} />
              <MetricBox label="Feed Used (Kgs)" value={d.feed_kgs ? fmtNum(Math.round(d.feed_kgs)) + ' Kg' : null} />
              <MetricBox label="Actual Feed" value={d.act_feed_mt ? fmtNum(d.act_feed_mt, 1) + ' MT' : null} />
              <MetricBox label="Achievement" value={feedAchPct != null ? feedAchPct + '%' : null} color={feedAchPct >= 100 ? '#12a362' : '#d93843'} />
              <MetricBox label="Feed / Litre" value={d.feed_per_ltr ? d.feed_per_ltr.toFixed(3) + ' Kg/L' : null} />
              <MetricBox label="Feed Members" value={d.feed_used_members ? fmtNum(d.feed_used_members) : null} />
            </div>
            <StatRow label="Feed Used Members %" value={d.feed_used_members_pct ? pct(d.feed_used_members_pct) : '—'} />
            <StatRow label="Feed Used MPPs" value={d.feed_used_mpps ? fmtNum(d.feed_used_mpps) + ' / ' + fmtNum(d.total_mpps) : '—'} />
            <StatRow label="Feed Used MPPs %" value={d.feed_used_mpps_pct ? pct(d.feed_used_mpps_pct) : '—'} />
            <StatRow label="Health Camps" value={d.health_camps != null ? fmtNum(d.health_camps) + ' / ' + fmtNum(d.bud_health_camps) + ' (Budget)' : '—'} />
            <StatRow label="Total Members (MM)" value={d.mm ? fmtNum(d.mm) : '—'} />
          </Section>

          {/* ── LFL COMPARISON ── */}
          <Section id="lfl" title="Like-for-Like Comparison (Mar'25 vs Mar'26)" icon="⚖️" badge={lfl.length + ' BMCUs'}>
            {lfl.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0', fontSize: 13 }}>No LFL data for this AO</div>
            ) : (
              <TblWrap>
                <thead>
                  <tr>
                    <Th>Code</Th>
                    <Th>BMCU Name</Th>
                    <Th right>Mar'25 LPD</Th>
                    <Th right>Mar'26 LPD</Th>
                    <Th right>Diff</Th>
                    <Th right>Growth%</Th>
                  </tr>
                </thead>
                <tbody>
                  {lfl.map((r, i) => {
                    const diff = r.diff || 0
                    const gPct = r.growth_pct != null ? (Math.abs(r.growth_pct) <= 1 ? r.growth_pct * 100 : r.growth_pct) : null
                    return (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <Td><span style={{ fontFamily: 'monospace', fontSize: 10, color: '#64748b' }}>{r.plant_code}</span></Td>
                        <Td>{r.plant_name}</Td>
                        <Td right>{r.lpd_prev != null ? fmtNum(r.lpd_prev, 1) : '—'}</Td>
                        <Td right bold>{r.lpd_curr != null ? fmtNum(r.lpd_curr, 1) : '—'}</Td>
                        <Td right bold color={diff >= 0 ? '#12a362' : '#d93843'}>{diff >= 0 ? '+' : ''}{diff.toFixed(1)}</Td>
                        <Td right color={gPct != null && gPct >= 0 ? '#12a362' : '#d93843'}>{gPct != null ? (gPct >= 0 ? '+' : '') + gPct.toFixed(1) + '%' : '—'}</Td>
                      </tr>
                    )
                  })}
                </tbody>
              </TblWrap>
            )}
          </Section>

          {/* ── GPRS ── */}
          <Section id="gprs" title="GPRS Compliance" icon="📡" badge={gprsActual != null ? gprsActual + '%' : null} badgeColor={gprsActual >= 95 ? 'green' : gprsActual >= 90 ? 'amber' : 'red'}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 14 }}>
              <MetricBox label="Overall GPRS%" value={gprsActual != null ? gprsActual + '%' : null} color={gprsActual >= 95 ? '#12a362' : gprsActual >= 90 ? '#d4850c' : '#d93843'} />
              <MetricBox label="Total Shifts" value={d.total_shifts ? fmtNum(d.total_shifts) : null} />
              <MetricBox label="GPRS Shifts" value={d.gprs_shifts ? fmtNum(d.gprs_shifts) : null} color="#0284c7" />
              <MetricBox label="Target" value="95%" color="#12a362" />
            </div>
            {gprsActual != null && (
              <div>
                <div style={{ height: 10, background: '#e0f2fe', borderRadius: 8, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{
                    height: '100%', borderRadius: 8,
                    width: `${Math.min(gprsActual, 100)}%`,
                    background: gprsActual >= 95 ? '#12a362' : gprsActual >= 90 ? '#d4850c' : '#d93843',
                    transition: 'width 0.5s',
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' }}>
                  <span>0%</span>
                  <span style={{ color: '#12a362', fontWeight: 700 }}>Target: 95%</span>
                  <span>100%</span>
                </div>
                <div style={{ marginTop: 8, textAlign: 'center', fontSize: 12, fontWeight: 700, color: gprsActual >= 95 ? '#12a362' : gprsActual >= 90 ? '#d4850c' : '#d93843' }}>
                  {gprsActual >= 95 ? '✅ On Target' : gprsActual >= 90 ? '⚠️ Near Target' : '❌ Below Target'}
                </div>
              </div>
            )}
          </Section>

          {/* ── COST & COMMISSION ── */}
          <Section id="cost" title="Cost & Commission" icon="💰">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>Cost Breakdown</div>
                <StatRow label="Sahayak Commission (₹)" value={d.sahayak_commission ? fmtRs(d.sahayak_commission) : '—'} />
                <StatRow label="TP Cost (₹)" value={d.tp_cost_rs ? fmtRs(d.tp_cost_rs) : '—'} />
                <StatRow label="Chilling Cost" value={d.chilling_cost ? fmtRs(d.chilling_cost) : '—'} />
                <StatRow label="Operational Income" value={d.op_cost_income ? fmtRs(d.op_cost_income) : '—'} />
                <StatRow label="Total Expenses" value={d.total_expenses ? fmtRs(d.total_expenses) : '—'} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: 12, borderTop: '2px solid #e0f2fe', marginTop: 4 }}>
                  <span style={{ fontWeight: 700, color: '#0c4a6e' }}>Net P&L</span>
                  <span style={{ fontWeight: 800, color: (d.profit_loss2 || 0) >= 0 ? '#12a362' : '#d93843' }}>
                    {d.profit_loss2 ? fmtRs(d.profit_loss2) : '—'}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 }}>Sahayak Commission</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                  <MetricBox label="Actual Commission" value={d.actual_commission ? fmtRs(d.actual_commission) : null} />
                  <MetricBox label="Deductions" value={d.commission_deductions ? fmtRs(Math.abs(d.commission_deductions)) : null} color="#d93843" />
                  <MetricBox label="Net Commission" value={d.net_commission ? fmtRs(d.net_commission) : null} color={(d.net_commission || 0) >= 0 ? '#12a362' : '#d93843'} />
                  <MetricBox label="Commission%" value={d.commission_pct ? pct(d.commission_pct) : null} />
                </div>
                <StatRow label="TS Rate (₹/L)" value={d.cow_ts_rate ? '₹' + d.cow_ts_rate.toFixed(2) : '—'} />
                <StatRow label="Cow Rate / Ltr" value={d.cow_rate ? '₹' + d.cow_rate.toFixed(2) : '—'} />
                <StatRow label="P&L vs Op Income" value={d.profit_loss ? fmtRs(d.profit_loss) : '—'} valueColor={(d.profit_loss || 0) >= 0 ? '#12a362' : '#d93843'} />
              </div>
            </div>
          </Section>

          {/* ── TRANSPORT ── */}
          <Section id="transport" title="Transport & Logistics" icon="🚛">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 14 }}>
              <MetricBox label="Budget TP Cost" value={d.bud_tp_cost != null ? '₹' + d.bud_tp_cost.toFixed(2) + '/km' : null} />
              <MetricBox label="Actual TP Cost" value={d.act_tp_cost ? fmtRs(d.act_tp_cost) : null} />
              <MetricBox label="KMs / Day" value={d.act_kms_day ? fmtNum(d.act_kms_day, 1) : null} />
              <MetricBox label="TP Amount / Day" value={d.act_tp_amount_day ? fmtRs(d.act_tp_amount_day) : null} />
            </div>
            <StatRow label="Qty per KM" value={d.qty_per_km ? d.qty_per_km.toFixed(2) + ' L/km' : '—'} />
            <StatRow label="Qty per Member" value={d.qty_per_member ? d.qty_per_member.toFixed(2) + ' L/member' : '—'} />
            <StatRow label="Qty per MPP" value={d.qty_per_mpp ? d.qty_per_mpp.toFixed(2) + ' L/MPP' : '—'} />
          </Section>

          {/* ── BMCU TABLE ── */}
          <Section id="bmcu" title="My BMCUs" icon="🏭" badge={bmcus.length + ' Plants'}>
            <TblWrap>
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>BMCU Name</Th>
                  <Th right>Cow LPD</Th>
                  <Th right>Buf LPD</Th>
                  <Th right>Fat%</Th>
                  <Th right>SNF%</Th>
                  <Th right>TS Gain</Th>
                  <Th right>Amount</Th>
                  <Th right>Rate/L</Th>
                  <Th right>GPRS%</Th>
                  <Th right>TP Cost</Th>
                </tr>
              </thead>
              <tbody>
                {bmcus.map((r, i) => {
                  const gPct = r.gprs_pct != null ? Math.round(Math.abs(r.gprs_pct) <= 1 ? r.gprs_pct * 100 : r.gprs_pct) : null
                  return (
                    <tr key={r.plant_code} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <Td><span style={{ fontFamily: 'monospace', fontSize: 10, color: '#64748b' }}>{r.plant_code}</span></Td>
                      <Td bold>{r.plant_name}</Td>
                      <Td right bold>{fmtLpd(r.cow_lpd)}</Td>
                      <Td right>{fmtLpd(r.buf_lpd)}</Td>
                      <Td right>{r.cow_fat ? r.cow_fat.toFixed(3) + '%' : '—'}</Td>
                      <Td right>{r.cow_snf ? r.cow_snf.toFixed(3) + '%' : '—'}</Td>
                      <Td right>{r.ts_gain != null ? r.ts_gain.toFixed(2) : '—'}</Td>
                      <Td right>{r.cow_amount ? fmtRs(r.cow_amount) : '—'}</Td>
                      <Td right>{r.cow_rate ? '₹' + r.cow_rate.toFixed(2) : '—'}</Td>
                      <Td right color={gPct >= 95 ? '#12a362' : gPct >= 90 ? '#d4850c' : gPct != null ? '#d93843' : '#94a3b8'}>
                        {gPct != null ? gPct + '%' : '—'}
                      </Td>
                      <Td right>{r.tp_cost_rs ? fmtRs(r.tp_cost_rs) : '—'}</Td>
                    </tr>
                  )
                })}
              </tbody>
            </TblWrap>
          </Section>

          {/* ── ALL MPPs ── */}
          <Section id="mpps" title="All MPPs" icon="📋" badge={mpps.length + ' MPPs'}>
            <TblWrap>
              <thead>
                <tr>
                  <Th>BMCU</Th>
                  <Th>FA</Th>
                  <Th>MPP#</Th>
                  <Th>MPP Name</Th>
                  <Th right>LPD</Th>
                  <Th right>Fat%</Th>
                  <Th right>SNF%</Th>
                  <Th right>TS</Th>
                  <Th right>Feed</Th>
                  <Th right>Fd/L</Th>
                  <Th right>Reg Mbrs</Th>
                  <Th right>Pour Mbrs</Th>
                  <Th right>Pour%</Th>
                  <Th right>Comm%</Th>
                  <Th right>GPRS%</Th>
                </tr>
              </thead>
              <tbody>
                {mpps.map((r, i) => {
                  const pourPct = r.pour_pct != null ? (Math.abs(r.pour_pct) <= 1 ? r.pour_pct * 100 : r.pour_pct) : null
                  const commPct = r.commission_pct != null ? (Math.abs(r.commission_pct) <= 1 ? r.commission_pct * 100 : r.commission_pct) : null
                  const gPct = r.gprs_pct != null ? Math.round(Math.abs(r.gprs_pct) <= 1 ? r.gprs_pct * 100 : r.gprs_pct) : null
                  return (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      <Td><span style={{ fontSize: 10, color: '#64748b' }}>{r.plant_name}</span></Td>
                      <Td><span style={{ fontSize: 10 }}>{r.fa}</span></Td>
                      <Td><span style={{ fontFamily: 'monospace', fontSize: 10 }}>{r.mpp}</span></Td>
                      <Td>{r.mpp_name}</Td>
                      <Td right bold color={(r.lpd || 0) < 30 ? '#d93843' : '#0f172a'}>{fmtLpd(r.lpd)}</Td>
                      <Td right>{r.fat ? r.fat.toFixed(3) + '%' : '—'}</Td>
                      <Td right>{r.snf ? r.snf.toFixed(3) + '%' : '—'}</Td>
                      <Td right color={(r.ts || 0) < 12 ? '#d93843' : '#0f172a'}>{r.ts ? r.ts.toFixed(2) : '—'}</Td>
                      <Td right>{r.feed_kgs ? fmtNum(r.feed_kgs) : '—'}</Td>
                      <Td right>{r.feed_per_ltr ? r.feed_per_ltr.toFixed(3) : '—'}</Td>
                      <Td right>{r.reg_members != null ? fmtNum(r.reg_members) : '—'}</Td>
                      <Td right>{r.pour_members != null ? fmtNum(r.pour_members) : '—'}</Td>
                      <Td right>{pourPct != null ? pourPct.toFixed(1) + '%' : '—'}</Td>
                      <Td right>{commPct != null ? commPct.toFixed(2) + '%' : '—'}</Td>
                      <Td right color={gPct >= 95 ? '#12a362' : gPct != null ? '#d93843' : '#94a3b8'}>{gPct != null ? gPct + '%' : '—'}</Td>
                    </tr>
                  )
                })}
              </tbody>
            </TblWrap>
            {mpps.length === 500 && <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11, marginTop: 8 }}>Showing first 500 MPPs</div>}
          </Section>

          {/* ── <30 LPD ── */}
          <Section id="low-lpd" title="Low LPD MPPs (<30 LPD)" icon="⚠️" badge={lowLpd.length} badgeColor={lowLpd.length > 0 ? 'red' : 'green'}>
            {lowLpd.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#12a362', padding: '20px 0', fontSize: 13 }}>✅ No MPPs below 30 LPD</div>
            ) : (
              <TblWrap>
                <thead>
                  <tr><Th>BMCU</Th><Th>FA</Th><Th>MPP#</Th><Th>MPP Name</Th><Th right>LPD</Th></tr>
                </thead>
                <tbody>
                  {lowLpd.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fde8ea' }}>
                      <Td><span style={{ fontSize: 10, color: '#64748b' }}>{r.plant_name}</span></Td>
                      <Td><span style={{ fontSize: 10 }}>{r.fa}</span></Td>
                      <Td><span style={{ fontFamily: 'monospace', fontSize: 10 }}>{r.mpp}</span></Td>
                      <Td>{r.mpp_name}</Td>
                      <Td right bold color={(r.lpd || 0) < 15 ? '#d93843' : '#d4850c'}>{fmtLpd(r.lpd)}</Td>
                    </tr>
                  ))}
                </tbody>
              </TblWrap>
            )}
          </Section>

          {/* ── <12 TS ── */}
          <Section id="low-ts" title="Low Total Solids MPPs (<12 TS)" icon="🔻" badge={lowTs.length} badgeColor={lowTs.length > 0 ? 'red' : 'green'}>
            {lowTs.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#12a362', padding: '20px 0', fontSize: 13 }}>✅ No MPPs below 12 TS</div>
            ) : (
              <TblWrap>
                <thead>
                  <tr><Th>BMCU</Th><Th>FA</Th><Th>MPP#</Th><Th>MPP Name</Th><Th right>LPD</Th><Th right>TS</Th></tr>
                </thead>
                <tbody>
                  {lowTs.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fde8ea' }}>
                      <Td><span style={{ fontSize: 10, color: '#64748b' }}>{r.plant_name}</span></Td>
                      <Td><span style={{ fontSize: 10 }}>{r.fa}</span></Td>
                      <Td><span style={{ fontFamily: 'monospace', fontSize: 10 }}>{r.mpp}</span></Td>
                      <Td>{r.mpp_name}</Td>
                      <Td right>{fmtLpd(r.lpd)}</Td>
                      <Td right bold color="#d93843">{r.ts != null ? (typeof r.ts === 'number' ? r.ts.toFixed(2) : r.ts) : '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </TblWrap>
            )}
          </Section>

          {/* ── SINGLE POURER ── */}
          <Section id="single-pourer" title="Single Pourer MPPs" icon="👤" badge={singlePourer.length} badgeColor={singlePourer.length > 0 ? 'amber' : 'green'}>
            {singlePourer.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#12a362', padding: '20px 0', fontSize: 13 }}>✅ No single pourer MPPs</div>
            ) : (
              <TblWrap>
                <thead>
                  <tr><Th>BMCU</Th><Th>MPP#</Th><Th>MPP Name</Th><Th right>LPD</Th><Th right>Feed</Th><Th right>Total Shifts</Th><Th right>GPRS Shifts</Th></tr>
                </thead>
                <tbody>
                  {singlePourer.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fef4e6' }}>
                      <Td><span style={{ fontSize: 10, color: '#64748b' }}>{r.plant_name}</span></Td>
                      <Td><span style={{ fontFamily: 'monospace', fontSize: 10 }}>{r.mpp}</span></Td>
                      <Td>{r.mpp_name}</Td>
                      <Td right bold>{fmtLpd(r.lpd)}</Td>
                      <Td right>{r.feed ? fmtNum(r.feed) : '—'}</Td>
                      <Td right>{r.total_shifts != null ? fmtNum(r.total_shifts) : '—'}</Td>
                      <Td right>{r.gprs_shifts != null ? fmtNum(r.gprs_shifts) : '—'}</Td>
                    </tr>
                  ))}
                </tbody>
              </TblWrap>
            )}
          </Section>

          {/* ── CLOSED MPPs ── */}
          <Section id="closed" title="Closed MPPs" icon="🚫" badge={closedMpp.length} badgeColor={closedMpp.length > 0 ? 'red' : 'green'}>
            {closedMpp.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#12a362', padding: '20px 0', fontSize: 13 }}>✅ No closed MPPs for this AO</div>
            ) : (
              <TblWrap>
                <thead>
                  <tr><Th>BMCU</Th><Th>FA</Th><Th>MPP#</Th><Th>MPP Name</Th><Th right>LPD</Th></tr>
                </thead>
                <tbody>
                  {closedMpp.map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fde8ea' }}>
                      <Td><span style={{ fontSize: 10, color: '#64748b' }}>{r.plant_name}</span></Td>
                      <Td><span style={{ fontSize: 10 }}>{r.fa}</span></Td>
                      <Td><span style={{ fontFamily: 'monospace', fontSize: 10 }}>{r.mpp}</span></Td>
                      <Td>{r.mpp_name}</Td>
                      <Td right>{fmtLpd(r.lpd)}</Td>
                    </tr>
                  ))}
                </tbody>
              </TblWrap>
            )}
          </Section>

          {/* ── CANS ACCOUNT ── */}
          <Section id="cans" title="Cans Account" icon="🔧" badge={cans.length + ' records'}>
            {cans.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: 13 }}>No cans data for this AO</div>
            ) : (
              <TblWrap>
                <thead>
                  <tr>
                    {Object.keys(cans[0] || {}).filter(k => k !== 'ao' && k !== 'cluster_manager').map(k => (
                      <Th key={k}>{k.replace(/_/g, ' ')}</Th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cans.slice(0, 50).map((r, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                      {Object.entries(r).filter(([k]) => k !== 'ao' && k !== 'cluster_manager').map(([k, v]) => (
                        <Td key={k}>{v != null ? String(v) : '—'}</Td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </TblWrap>
            )}
          </Section>

          {/* ── MANPOWER ── */}
          <Section id="manpower" title="Manpower Costs" icon="👷" badge={manpower.length + ' BMCUs'}>
            {manpower.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: 13 }}>No manpower data for this AO</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                  <MetricBox label="Total CTC" value={'₹' + fmtNum(Math.round(manpower.reduce((a, r) => a + (r.total_ctc || 0), 0) / 1000)) + 'K'} color="#0284c7" />
                  <MetricBox label="Total Staff" value={fmtNum(manpower.reduce((a, r) => a + (r.total_persons || 0), 0))} />
                  <MetricBox label="BMCUs" value={manpower.length} />
                </div>
                <TblWrap>
                  <thead>
                    <tr>
                      <Th>Code</Th>
                      <Th>BMCU Name</Th>
                      <Th right>LPD</Th>
                      <Th right>Op CTC</Th>
                      <Th right>Helper CTC</Th>
                      <Th right>Tester CTC</Th>
                      <Th right>Total CTC</Th>
                      <Th right>Operators</Th>
                      <Th right>Helpers</Th>
                      <Th right>Testers</Th>
                      <Th right>Total Staff</Th>
                      <Th right>CTC/LPD</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {manpower.map((r, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#f8fafc' }}>
                        <Td><span style={{ fontFamily: 'monospace', fontSize: 10, color: '#64748b' }}>{r.plant_code}</span></Td>
                        <Td bold>{r.plant_name}</Td>
                        <Td right>{fmtLpd(r.lpd)}</Td>
                        <Td right>{r.ctc_operator ? fmtNum(Math.round(r.ctc_operator)) : '—'}</Td>
                        <Td right>{r.ctc_helper ? fmtNum(Math.round(r.ctc_helper)) : '—'}</Td>
                        <Td right>{r.ctc_tester ? fmtNum(Math.round(r.ctc_tester)) : '—'}</Td>
                        <Td right bold>{r.total_ctc ? fmtNum(Math.round(r.total_ctc)) : '—'}</Td>
                        <Td right>{r.persons_operator != null ? r.persons_operator : '—'}</Td>
                        <Td right>{r.persons_helper != null ? r.persons_helper : '—'}</Td>
                        <Td right>{r.persons_tester != null ? r.persons_tester : '—'}</Td>
                        <Td right bold>{r.total_persons != null ? r.total_persons : '—'}</Td>
                        <Td right>{r.lpd && r.total_ctc ? '₹' + (r.total_ctc / r.lpd).toFixed(1) : '—'}</Td>
                      </tr>
                    ))}
                  </tbody>
                </TblWrap>
              </>
            )}
          </Section>

          {/* ── RECOVERIES ── */}
          <Section id="recoveries" title="Pending Recoveries" icon="💳"
            badge={recoveries.length + ' records' + (totalRecAmt > 0 ? ' · ₹' + fmtRs(totalRecAmt) : '')}
            badgeColor={recoveries.length > 0 ? 'red' : 'green'}>
            {recoveries.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#12a362', padding: '20px 0', fontSize: 13 }}>✅ No pending recoveries</div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 14 }}>
                  <MetricBox label="Total Pending" value={'₹' + fmtRs(totalRecAmt)} color="#d93843" />
                  <MetricBox label="Members" value={fmtNum(recoveries.length)} />
                  <MetricBox label="Avg / Member" value={recoveries.length ? '₹' + fmtRs(totalRecAmt / recoveries.length) : null} />
                </div>
                <TblWrap>
                  <thead>
                    <tr>
                      <Th>Code</Th>
                      <Th>Plant</Th>
                      <Th>MPP</Th>
                      <Th>Member Name</Th>
                      <Th right>Amount (₹)</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {recoveries.slice(0, 100).map((r, i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fde8ea' }}>
                        <Td><span style={{ fontFamily: 'monospace', fontSize: 10, color: '#64748b' }}>{r.plant_code}</span></Td>
                        <Td>{r.plant_name}</Td>
                        <Td><span style={{ fontFamily: 'monospace', fontSize: 10 }}>{r.mpp_code}</span></Td>
                        <Td>{r.member_name}</Td>
                        <Td right bold color="#d93843">{r.amount ? fmtRs(r.amount) : '—'}</Td>
                        <Td>
                          <span style={{ background: '#fef4e6', color: '#d4850c', padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                            {r.status || 'Pending'}
                          </span>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </TblWrap>
                {recoveries.length > 100 && <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 11, marginTop: 8 }}>Showing 100 of {fmtNum(recoveries.length)}</div>}
              </>
            )}
          </Section>

          <div style={{ height: 40 }} />
        </main>
      </div>
    </div>
  )
}
