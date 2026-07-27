import { useEffect, useState, useCallback } from 'react'

/**
 * Full-screen slideshow. `slides` is an array of React nodes. Advance with
 * tap/click, arrow keys, or on-screen buttons. Designed for projecting at a
 * village meeting — big text, high contrast, works with just a finger tap.
 */
export default function Slideshow({ slides, onClose }) {
  const [i, setI] = useState(0)

  const next = useCallback(() => setI(n => Math.min(n + 1, slides.length - 1)), [slides.length])
  const prev = useCallback(() => setI(n => Math.max(n - 1, 0)), [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === ' ') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, onClose])

  return (
    <div className="fixed inset-0 bg-slate-900 z-50 flex flex-col select-none">
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 overflow-hidden" onClick={next}>
        <div className="w-full max-w-4xl">{slides[i]}</div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 text-slate-300 text-sm">
        <button className="px-3 py-1.5 rounded-lg hover:bg-slate-700" onClick={(e) => { e.stopPropagation(); onClose() }}>✕ Close</button>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-30" disabled={i === 0} onClick={(e) => { e.stopPropagation(); prev() }}>← Prev</button>
          <span className="tabular-nums">{i + 1} / {slides.length}</span>
          <button className="px-3 py-1.5 rounded-lg hover:bg-slate-700 disabled:opacity-30" disabled={i === slides.length - 1} onClick={(e) => { e.stopPropagation(); next() }}>Next →</button>
        </div>
      </div>
    </div>
  )
}
