import React from 'react'

interface SlideHeaderProps {
  kicker: string
  speaker: string
  slideNumber: number
  totalSlides?: number
}

export const SlideHeader: React.FC<SlideHeaderProps> = ({
  kicker,
  speaker,
  slideNumber,
  totalSlides = 12,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 md:pb-4 border-b border-white/[0.08]">
      <div className="flex items-center gap-2.5 md:gap-3 min-w-0">
        <img src="./wristos-logo.svg" alt="WristOS" className="w-4 h-4 opacity-90 shrink-0" />
        <span className="text-[10px] md:text-[11px] font-mono uppercase tracking-[0.16em] md:tracking-[0.2em] text-violet-300 font-semibold truncate">
          {kicker}
        </span>
      </div>

      <div className="flex items-center gap-2.5 md:gap-4 text-[10px] md:text-[11px] font-mono shrink-0">
        <span className="px-2 md:px-2.5 py-0.5 md:py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-300">
          <strong className="text-white">{speaker}</strong>
        </span>
        <span className="text-slate-500 tabular-nums">
          {String(slideNumber).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}
