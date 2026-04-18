export default function Header({ onMenuClick }) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 sticky top-0 z-40 shadow-sm">
      <button className="lg:hidden text-slate-500 hover:text-slate-700 text-xl p-1" onClick={onMenuClick}>☰</button>

      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-sm shadow-sm">🥛</div>
        <div>
          <div className="font-display font-bold text-[15px] text-slate-800 leading-tight">Procurement Portal</div>
          <div className="text-[10px] text-slate-400 leading-tight">SMMPCL Analytics · Mar&apos;26</div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <span className="hidden sm:inline-flex items-center gap-1.5 bg-success-light text-success text-xs font-semibold px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Live
        </span>
        <div className="w-8 h-8 rounded-full bg-blue-100 text-primary font-bold text-sm flex items-center justify-center">P</div>
      </div>
    </header>
  )
}
