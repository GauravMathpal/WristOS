interface LogoProps {
  size?: number
  className?: string
}

/**
 * Pixel-accurate official 4-color Google "G" SVG Icon
 */
export function GoogleGLogo({ size = 20, className = '' }: LogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label="Google Logo"
    >
      {/* Blue right curve & bar */}
      <path 
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" 
        fill="#4285F4" 
      />
      {/* Green bottom curve */}
      <path 
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.27 21.43 7.35 24 12 24z" 
        fill="#34A853" 
      />
      {/* Yellow left curve */}
      <path 
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" 
        fill="#FBBC05" 
      />
      {/* Red top curve */}
      <path 
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.57 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" 
        fill="#EA4335" 
      />
    </svg>
  )
}

/**
 * Modern WristOS Hexagonal Smartwatch & Neural Mark
 */
export function WristOSLogoIcon({ size = 32, className = '' }: LogoProps) {
  return (
    <div 
      style={{ width: size, height: size }}
      className={`relative rounded-xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-pink-500 p-[1.5px] shadow-lg shadow-purple-500/30 shrink-0 ${className}`}
    >
      <div className="w-full h-full bg-[#0d0918] rounded-[10px] flex items-center justify-center relative overflow-hidden">
        {/* Subtle horizon glow inside logo */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/20 via-transparent to-pink-500/20 pointer-events-none" />
        
        {/* Stylized Futuristic W SVG Vector */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="w-[62%] h-[62%] relative z-10"
        >
          <defs>
            <linearGradient id="wristos-w-grad" x1="2" y1="4" x2="22" y2="20" gradientUnits="userSpaceOnUse">
              <stop stopColor="#C4B5FD" />
              <stop offset="0.5" stopColor="#F472B6" />
              <stop offset="1" stopColor="#38BDF8" />
            </linearGradient>
          </defs>
          <path 
            d="M3 5.5L7 18.5L12 9.5L17 18.5L21 5.5" 
            stroke="url(#wristos-w-grad)" 
            strokeWidth="3.2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          {/* Luminous Apex Star / AI Dot */}
          <circle cx="12" cy="5.5" r="1.8" fill="#F472B6" />
        </svg>
      </div>
    </div>
  )
}

/**
 * Official Google Wordmark Badge with 4-color "G"
 */
export function GoogleBadge({ 
  className = '',
  subtitle = 'Built with Google'
}: { 
  className?: string
  subtitle?: string 
}) {
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors shadow-sm shrink-0 ${className}`}>
      <GoogleGLogo size={16} />
      <div className="flex flex-col text-left leading-none">
        <div className="flex items-center gap-0.5 text-xs font-semibold tracking-tight text-white">
          <span className="text-[#4285F4]">G</span>
          <span className="text-[#EA4335]">o</span>
          <span className="text-[#FBBC05]">o</span>
          <span className="text-[#4285F4]">g</span>
          <span className="text-[#34A853]">l</span>
          <span className="text-[#EA4335]">e</span>
        </div>
        {subtitle && (
          <span className="text-[9px] text-purple-200/70 font-mono scale-[0.9] origin-left">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Combined WristOS Brand Header: WristOS Logo Mark, Wordmark, and Version Badge
 */
export function WristOSBrandHeader({ 
  version = 'v1.16',
  showTagline = true,
  onClick
}: { 
  version?: string
  showTagline?: boolean
  onClick?: () => void 
}) {
  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-2 sm:gap-2.5 shrink-0 ${onClick ? 'cursor-pointer group' : ''}`}
    >
      {/* 1. Main WristOS Logo Mark */}
      <WristOSLogoIcon size={30} className="group-hover:scale-105 transition-transform" />

      {/* 2. WristOS Wordmark & Version Pill */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-white group-hover:text-purple-300 transition-colors">
            WristOS
          </span>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 hidden xs:inline-block">
            {version}
          </span>
        </div>
        {showTagline && (
          <p className="text-[10px] text-slate-400 hidden sm:block font-medium truncate max-w-[200px]">
            Wearable OS & Ambient AI
          </p>
        )}
      </div>
    </div>
  )
}

// Backward compatibility alias
export const DualBrandHeader = WristOSBrandHeader
