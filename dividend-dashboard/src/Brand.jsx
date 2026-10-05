import shreejaLogo from './assets/shreeja_logo.png'
import nddbLogo from './assets/nddb_logo.png'
import nddsLogo from './assets/nddb_dairy_services_logo.png'

// Shreeja, then "Supported by" NDDB and NDDB Dairy Services — the order is fixed
// `slide` sizes everything from the slide width (cqw) so it scales with the presentation
export function LogoStrip({ size = 'md', className = '' }) {
  const h = { sm: 'h-7 sm:h-8', md: 'h-10 sm:h-12', lg: 'h-12 sm:h-16', slide: 'h-[3.4cqw]' }[size]
  const hs = { sm: 'h-6 sm:h-7', md: 'h-8 sm:h-10', lg: 'h-10 sm:h-12', slide: 'h-[2.8cqw]' }[size]
  const label = size === 'slide' ? 'text-[0.9cqw]' : 'text-[10px] sm:text-[11px]'
  return (
    <div className={`flex flex-wrap items-center gap-x-5 gap-y-3 ${className}`}>
      <img src={shreejaLogo} alt="Shreeja Mahila Milk Producer Company" className={`${h} w-auto`} />
      <div className="flex items-center gap-3">
        <span className={`${label} font-semibold uppercase tracking-widest text-slate-400 whitespace-nowrap`}>Supported by</span>
        <img src={nddbLogo} alt="National Dairy Development Board" className={`${hs} w-auto`} />
        <img src={nddsLogo} alt="NDDB Dairy Services" className={`${hs} w-auto`} />
      </div>
    </div>
  )
}

export { shreejaLogo, nddbLogo, nddsLogo }
