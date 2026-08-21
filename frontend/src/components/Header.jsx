import shreejaLogo from '../assets/shreeja-logo.png'
import nddbLogo from '../assets/nddb-logo.png'
import nddbDairyServicesLogo from '../assets/nddb-dairy-services-logo.png'

export default function Header({ onMenuClick, summary }) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 gap-3 sticky top-0 z-40 shadow-sm">
      <button className="lg:hidden text-slate-500 hover:text-slate-700 text-xl p-1" onClick={onMenuClick}>☰</button>

      <div className="flex items-center gap-2.5">
        <img src={shreejaLogo} alt="Shreeja Mahila Milk Producer Company" className="h-8 w-auto rounded shadow-sm" />
        <div>
          <div className="font-display font-bold text-[15px] text-slate-800 leading-tight">Procurement Portal</div>
          <div className="text-[10px] text-slate-400 leading-tight">SMMPCL Analytics{summary?.month ? ` · ${summary.month}` : ''}</div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 pr-3 border-r border-slate-200">
          <span className="text-[9px] text-slate-400 leading-tight">Supported&nbsp;by</span>
          <img src={nddbLogo} alt="National Dairy Development Board" className="h-6 w-auto" />
          <img src={nddbDairyServicesLogo} alt="NDDB Dairy Services" className="h-6 w-auto" />
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 bg-success-light text-success text-xs font-semibold px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          Live
        </span>
        <div className="w-8 h-8 rounded-full bg-blue-100 text-primary font-bold text-sm flex items-center justify-center">P</div>
      </div>
    </header>
  )
}
