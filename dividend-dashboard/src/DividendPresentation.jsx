import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LabelList } from 'recharts'
import { INVEST, DIVIDEND, inr, inrShort, num, pct, allotLabel, RankBadge, Sparkline } from './DividendKit'

const ROWS_PER_SLIDE = 14
const TOP_PER_SLIDE = 5
const BOARD_PER_SLIDE = 10

function chunk(arr, n) {
  const out = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

const PRINT_CSS = `
.dp-slide { container-type: inline-size; aspect-ratio: 16 / 9; width: min(96vw, calc((100vh - 120px) * 16 / 9)); }
@media print {
  @page { size: A4 landscape; margin: 0; }
  body * { visibility: hidden !important; }
  .dp-root, .dp-root * { visibility: visible !important; }
  .dp-root { position: absolute !important; inset: 0 !important; background: #fff !important; display: block !important; }
  .dp-chrome { display: none !important; }
  .dp-stage { display: block !important; padding: 0 !important; }
  .dp-slide { display: flex !important; width: 297mm !important; height: 209mm !important; aspect-ratio: auto; box-shadow: none !important; border-radius: 0 !important; page-break-after: always; break-after: page; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
`

// Shrinks a single line of text until it fits its box (big rupee figures vary a lot in length)
function FitText({ children, className, style }) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    function fit() {
      el.style.fontSize = ''
      const box = el.parentElement.clientWidth
      if (box && el.scrollWidth > box) {
        el.style.fontSize = (parseFloat(getComputedStyle(el).fontSize) * box / el.scrollWidth * 0.98) + 'px'
      }
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el.parentElement)
    return () => ro.disconnect()
  }, [children])
  return <div ref={ref} className={className} style={{ whiteSpace: 'nowrap', ...style }}>{children}</div>
}

function Slide({ children, current, dark }) {
  return (
    <div className={`dp-slide ${current ? 'flex' : 'hidden'} flex-col rounded-xl shadow-2xl overflow-hidden relative ${dark ? 'text-white' : 'bg-white text-slate-800'}`}
      style={dark ? { background: 'linear-gradient(130deg, #064e3b 0%, #047857 50%, #0f766e 100%)' } : undefined}>
      {children}
    </div>
  )
}

function SlideHead({ title, sub, page, total }) {
  return (
    <div className="flex items-end justify-between px-[4%] pt-[3%] pb-[1.5%] border-b-4" style={{ borderColor: DIVIDEND }}>
      <div>
        <div className="text-[1.1cqw] font-bold uppercase tracking-widest text-emerald-600">{sub}</div>
        <div className="text-[2.6cqw] font-bold font-display leading-tight">{title}</div>
      </div>
      <div className="text-[0.9cqw] text-slate-400 text-right">Shreeja Mahila Milk Producer Company<br />{page} / {total}</div>
    </div>
  )
}

export default function DividendPresentation({ data, scopeName, top, onClose }) {
  const k = data.kpis
  const level = data.level
  const v = data.village
  const where = level === 'mpp' ? `${v.bmcu} BMCU · ACO ${v.aco}` : level === 'bmcu' ? `BMCU · ACO ${data.query.aco}` : level === 'aco' ? 'ACO' : 'All villages'
  const topMembers = level === 'mpp' ? data.members.slice(0, top) : data.topMembers
  const others = level === 'mpp' ? data.members.slice(top) : []
  const otherPages = chunk(others, ROWS_PER_SLIDE)
  const topPages = chunk(topMembers, TOP_PER_SLIDE)
  const board = level === 'all' ? data.topAcos : level === 'aco' ? data.topBmcus : level === 'bmcu' ? data.topMpps : null
  const boardTitle = level === 'all' ? 'ACOs' : level === 'aco' ? 'BMCUs' : 'villages'

  const boardPages = board ? chunk(board.rows, BOARD_PER_SLIDE) : []
  const slides = ['cover', 'trend', ...topPages.map((_, i) => `top-${i}`), ...boardPages.map((_, i) => `board-${i}`), ...otherPages.map((_, i) => `others-${i}`), 'close']
  const [idx, setIdx] = useState(0)
  const total = slides.length

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') setIdx(i => Math.min(i + 1, total - 1))
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [total, onClose])

  const per100 = Math.round(k.ret * 100)
  const big = 'text-[4.2cqw] font-bold font-display tabular-nums leading-none'

  return (
    <div className="dp-root fixed inset-0 z-[100] bg-slate-900/95 flex flex-col">
      <style>{PRINT_CSS}</style>
      <div className="dp-chrome flex items-center justify-between px-4 py-2 text-slate-300 text-sm">
        <span className="font-semibold text-white">Dividend presentation · {scopeName}</span>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" onClick={() => window.print()}>🖨 Print / Save PDF</button>
          <button className="px-3 py-1 rounded bg-white/10 hover:bg-white/20" onClick={onClose}>✕ Close (Esc)</button>
        </div>
      </div>

      <div className="dp-stage flex-1 flex items-center justify-center p-2">
        {/* 1 — Cover */}
        <Slide current={slides[idx] === 'cover'} dark>
          <div className="flex-1 flex flex-col justify-center px-[7%]">
            <div className="text-[1.2cqw] font-bold uppercase tracking-[0.3em] text-emerald-200">Members Dividend · FY 2014-15 to 2025-26</div>
            <div className="text-[5.5cqw] font-bold font-display leading-[1.1] mt-3 break-words">{scopeName}</div>
            <div className="text-[1.5cqw] text-emerald-100 mt-[1.2%]">{level === 'mpp' ? `Village code ${v.code} · ${where}` : where} · {num(k.members)} members</div>
            <div className="grid grid-cols-2 gap-[4%] mt-[5%] max-w-[85%] min-w-0">
              <div className="rounded-2xl bg-white/10 p-[5%] min-w-0">
                <div className="text-[1.1cqw] uppercase tracking-widest text-emerald-100">Share capital invested</div>
                <FitText className={big + ' mt-2'}>{inr(k.share)}</FitText>
              </div>
              <div className="rounded-2xl bg-white p-[5%] text-emerald-800 shadow-xl min-w-0">
                <div className="text-[1.1cqw] uppercase tracking-widest text-emerald-600 font-bold">Total dividend received</div>
                <FitText className={big + ' mt-2'}>{inr(k.div)}</FitText>
              </div>
            </div>
            <div className="text-[1.7cqw] mt-[4%] text-emerald-50">For every <b className="text-white">₹100</b> invested, members have already received <b className="text-white">₹{per100}</b> back as dividend — and still own their shares.</div>
          </div>
        </Slide>

        {/* 2 — Year trend */}
        <Slide current={slides[idx] === 'trend'}>
          <SlideHead title="Dividend paid, year after year" sub={scopeName} page={slides.indexOf('trend') + 1} total={total} />
          <div className="flex-1 grid grid-cols-[1fr_28%] gap-[3%] px-[4%] py-[2.5%] min-h-0">
            <div className="min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.years} margin={{ top: 24, right: 8, left: 8, bottom: 0 }}>
                  <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#475569' }} tickFormatter={s => s.replace('FY ', '')} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Bar dataKey="div" fill={DIVIDEND} radius={[5, 5, 0, 0]} isAnimationActive={false}>
                    <LabelList dataKey="div" position="top" formatter={inrShort} style={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center gap-[8%]">
              {[
                ['Paid in FY ' + k.latestYear, inr(k.latestDiv), DIVIDEND],
                ['Cumulative, 12 years', inr(k.div), '#065f46'],
                ['Average per member', inr(k.perMember), INVEST],
                ['Members who got back ≥ 50%', num(k.halfBack), '#7c3aed'],
              ].map(([l, val, c]) => (
                <div key={l} className="border-l-4 pl-3" style={{ borderColor: c }}>
                  <div className="text-[0.95cqw] uppercase tracking-wider text-slate-400 font-bold">{l}</div>
                  <div className="text-[2.2cqw] font-bold font-display tabular-nums" style={{ color: c }}>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </Slide>

        {/* 3 — Top members */}
        {topPages.map((rows, ti) => (
        <Slide key={ti} current={slides[idx] === `top-${ti}`}>
          <SlideHead title={`Top ${top} members by dividend received${topPages.length > 1 ? ` (${ti + 1}/${topPages.length})` : ''}`} sub={scopeName} page={slides.indexOf(`top-${ti}`) + 1} total={total} />
          <div className="flex-1 px-[4%] py-[2%] flex flex-col justify-center gap-[1.6%] min-h-0">
            {rows.map(m => (
              <div key={m.code + m.folio} className="flex items-center gap-[2%] rounded-xl bg-slate-50 px-[2%] py-[0.8%] border border-slate-100">
                <div className="w-[4%] flex justify-center"><RankBadge rank={m.rank} /></div>
                <div className="w-[30%] min-w-0">
                  <div className="text-[1.5cqw] font-bold truncate">{m.name}</div>
                  <div className="text-[0.85cqw] text-slate-400">{level === 'mpp' ? `Member ${m.code} · since ${allotLabel(m.allot)}` : `${m.mpp} · ${m.bmcu}`}</div>
                </div>
                <div className="w-[16%] text-right">
                  <div className="text-[0.8cqw] uppercase text-slate-400 font-bold">Invested</div>
                  <div className="text-[1.4cqw] font-bold tabular-nums" style={{ color: INVEST }}>{inr(m.share)}</div>
                </div>
                <div className="w-[16%] text-right">
                  <div className="text-[0.8cqw] uppercase text-slate-400 font-bold">Dividend received</div>
                  <div className="text-[1.4cqw] font-bold tabular-nums" style={{ color: DIVIDEND }}>{inr(m.div)}</div>
                </div>
                <div className="flex-1">
                  <div className="h-2.5 rounded-full bg-sky-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: `${Math.min(m.ret, 1) * 100}%`, background: DIVIDEND }} /></div>
                  <div className="text-[0.8cqw] text-slate-500 mt-0.5">{pct(m.ret)} of investment returned</div>
                </div>
                <Sparkline values={m.years} w={90} h={28} />
              </div>
            ))}
          </div>
        </Slide>
        ))}

        {/* 4 — Leaderboard (non-village scopes), one shared scale across pages */}
        {boardPages.map((rows, bi) => (
          <Slide key={bi} current={slides[idx] === `board-${bi}`}>
            <SlideHead title={`Top ${top} ${boardTitle}${boardPages.length > 1 ? ` (${bi + 1}/${boardPages.length})` : ''}`} sub={scopeName} page={slides.indexOf(`board-${bi}`) + 1} total={total} />
            <div className="flex-1 px-[4%] py-[2%] flex flex-col justify-center gap-[2.2%] min-h-0">
              {rows.map((r, i) => (
                <div key={r.key || r.name} className="flex items-center gap-[1.5%]">
                  <div className="w-[3%] text-[1.1cqw] font-bold text-slate-400 text-right">{bi * BOARD_PER_SLIDE + i + 1}</div>
                  <div className="w-[22%] min-w-0">
                    <div className="text-[1.3cqw] font-bold truncate">{r.name}</div>
                    <div className="text-[0.85cqw] text-slate-400 truncate">{num(r.members)} members · invested {inrShort(r.share)} · {pct(r.ret, 0)} back</div>
                  </div>
                  <div className="flex-1 h-[2.2cqw] bg-slate-50 rounded-md overflow-hidden">
                    <div className="h-full rounded-md" style={{ width: `${(r.div / board.rows[0].div) * 100}%`, background: DIVIDEND }} />
                  </div>
                  <div className="w-[11%] text-right text-[1.4cqw] font-bold tabular-nums text-emerald-800">{inrShort(r.div)}</div>
                </div>
              ))}
            </div>
          </Slide>
        ))}

        {/* Remaining village members, paged */}
        {otherPages.map((rows, pi) => (
          <Slide key={pi} current={slides[idx] === `others-${pi}`}>
            <SlideHead title={`Other members (${pi + 1}/${otherPages.length})`} sub={scopeName} page={slides.indexOf(`others-${pi}`) + 1} total={total} />
            <div className="flex-1 px-[4%] py-[1.5%] min-h-0">
              <table className="w-full text-[1.05cqw]">
                <thead>
                  <tr className="text-[0.8cqw] uppercase tracking-wider text-slate-400 text-left">
                    <th className="py-1 w-[5%]">#</th><th>Member</th><th>Member code</th><th>Since</th>
                    <th className="text-right">Invested</th><th className="text-right">Dividend received</th><th className="text-right w-[22%]">% returned</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(m => (
                    <tr key={m.code + m.folio} className="border-t border-slate-100">
                      <td className="py-[0.55%] text-slate-400">{m.rank}</td>
                      <td className="font-semibold">{m.name}</td>
                      <td className="text-slate-500 tabular-nums">{m.code}</td>
                      <td className="text-slate-500">{allotLabel(m.allot)}</td>
                      <td className="text-right tabular-nums font-semibold" style={{ color: INVEST }}>{inr(m.share)}</td>
                      <td className="text-right tabular-nums font-bold" style={{ color: DIVIDEND }}>{inr(m.div)}</td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-[60%] h-2 rounded-full bg-sky-100 overflow-hidden"><div className="h-full" style={{ width: `${Math.min(m.ret, 1) * 100}%`, background: DIVIDEND }} /></div>
                          <span className="tabular-nums w-[34%]">{pct(m.ret)}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Slide>
        ))}

        {/* Close */}
        <Slide current={slides[idx] === 'close'} dark>
          <div className="flex-1 flex flex-col items-center justify-center text-center px-[8%]">
            <div className="text-[1.4cqw] uppercase tracking-[0.3em] text-emerald-200">{scopeName}</div>
            <div className="text-[4.4cqw] font-bold font-display leading-tight mt-3">{inr(k.div)} returned to our members</div>
            <div className="text-[1.7cqw] text-emerald-50 mt-4 max-w-[80%]">Your shares keep earning every year. Keep pouring milk to Shreeja — the more the company grows, the more it returns to you.</div>
          </div>
        </Slide>
      </div>

      <div className="dp-chrome flex items-center justify-center gap-4 pb-4 text-white">
        <button className="px-4 py-1.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>‹ Prev</button>
        <span className="text-sm tabular-nums text-slate-300">{idx + 1} / {total}</span>
        <button className="px-4 py-1.5 rounded bg-white/10 hover:bg-white/20 disabled:opacity-30" disabled={idx === total - 1} onClick={() => setIdx(idx + 1)}>Next ›</button>
      </div>
    </div>
  )
}
