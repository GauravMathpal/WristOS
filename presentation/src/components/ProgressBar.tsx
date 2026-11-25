import React from 'react'
import { SLIDES } from '../slides/slidesData'

interface ProgressBarProps {
  current: number
  total: number
  onSelectSlide: (index: number) => void
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  onSelectSlide,
}) => {
  return (
    <div className="fixed top-0 left-0 right-0 z-40 h-1.5 bg-black/50 backdrop-blur-sm pointer-events-auto">
      <div className="w-full h-full flex gap-1 px-1">
        {Array.from({ length: total }).map((_, idx) => {
          const isPast = idx < current
          const isActive = idx === current
          const slide = SLIDES[idx]
          return (
            <button
              key={slide?.id ?? idx}
              type="button"
              onClick={() => onSelectSlide(idx)}
              title={`${String(idx + 1).padStart(2, '0')} • ${slide?.title ?? ''}`}
              className="flex-1 h-full relative group cursor-pointer"
            >
              <div
                className={`h-full w-full rounded-sm transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]'
                    : isPast
                    ? 'bg-violet-400/45 group-hover:bg-violet-400/70'
                    : 'bg-white/12 group-hover:bg-white/25'
                }`}
              />
              <span className="absolute top-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0b0816]/95 border border-violet-400/30 text-[10px] font-mono text-slate-200 px-2 py-1 rounded-md pointer-events-none whitespace-nowrap shadow-xl">
                {String(idx + 1).padStart(2, '0')} · {slide?.title}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
