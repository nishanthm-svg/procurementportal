// Shared formatting + small visual pieces for the Members Dividend views

export const INVEST = '#0284c7'   // share capital invested
export const DIVIDEND = '#059669' // dividend received

export function inr(v) {
  return '₹' + Math.round(v || 0).toLocaleString('en-IN')
}

export function inrShort(v) {
  const n = Math.round(v || 0)
  if (n >= 1e7) return '₹' + (n / 1e7).toFixed(2) + ' Cr'
  if (n >= 1e5) return '₹' + (n / 1e5).toFixed(2) + ' L'
  if (n >= 1e3) return '₹' + (n / 1e3).toFixed(1) + 'K'
  return '₹' + n
}

export const num = (v) => Math.round(v || 0).toLocaleString('en-IN')
export const pct = (r, d = 1) => ((r || 0) * 100).toFixed(d) + '%'

export function allotLabel(a) {
  if (a === 'NEW') return 'New member'
  if (!a) return '—'
  const [y, m, d] = a.split('-')
  return `${d}/${m}/${y}`
}

// Tiny inline trend of yearly dividend — cheap enough for every table row
export function Sparkline({ values, w = 84, h = 22, color = DIVIDEND }) {
  const max = Math.max(...values, 1)
  const step = w / (values.length - 1)
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(h - 2 - (v / max) * (h - 4)).toFixed(1)}`).join(' ')
  return (
    <svg width={w} height={h} className="inline-block align-middle" aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={w} cy={h - 2 - (values[values.length - 1] / max) * (h - 4)} r="2" fill={color} />
    </svg>
  )
}

// Share invested vs dividend received on a common scale, with the % returned
export function ReturnBar({ share, div, compact }) {
  const ret = share ? div / share : 0
  return (
    <div className={compact ? 'w-28' : 'w-full'}>
      <div className="h-1.5 rounded-full bg-sky-100 overflow-hidden" title={`${pct(ret)} of investment returned as dividend`}>
        <div className="h-full rounded-full" style={{ width: `${Math.min(ret, 1) * 100}%`, background: DIVIDEND }} />
      </div>
      {!compact && (
        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>{pct(ret)} returned</span>
          <span>of {inrShort(share)}</span>
        </div>
      )}
    </div>
  )
}

const MEDALS = ['🥇', '🥈', '🥉']

export function RankBadge({ rank }) {
  if (rank <= 3) return <span className="text-xl leading-none">{MEDALS[rank - 1]}</span>
  return <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold inline-flex items-center justify-center">{rank}</span>
}

export function MemberCard({ m, showPlace, onPlace }) {
  return (
    <div className="kpi-card flex flex-col gap-2 border-t-4" style={{ borderTopColor: m.rank === 1 ? '#f59e0b' : m.rank <= 3 ? '#94a3b8' : '#e2e8f0' }}>
      <div className="flex items-start gap-2">
        <RankBadge rank={m.rank} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-slate-800 leading-tight truncate" title={m.name}>{m.name}</div>
          <div className="text-[10px] text-slate-400 tabular-nums">{m.code}</div>
          {showPlace && (
            <button className="text-[10px] text-sky-600 hover:underline truncate block max-w-full text-left" onClick={() => onPlace?.(m)} title="Open this village">
              {m.mpp} · {m.bmcu}
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Invested</div>
          <div className="text-sm font-bold tabular-nums" style={{ color: INVEST }}>{inr(m.share)}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Dividend</div>
          <div className="text-sm font-bold tabular-nums" style={{ color: DIVIDEND }}>{inr(m.div)}</div>
        </div>
      </div>
      <ReturnBar share={m.share} div={m.div} />
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>Since {m.allot === 'NEW' ? 'new' : (m.allot || '').slice(0, 4)}</span>
        <Sparkline values={m.years} />
      </div>
    </div>
  )
}
