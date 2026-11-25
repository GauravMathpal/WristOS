import React, { useEffect, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Maximize2,
  Minimize2,
  LayoutGrid,
} from 'lucide-react'

interface ControlsHudProps {
  current: number
  total: number
  isPlaying: boolean
  isFullscreen: boolean
  onPrev: () => void
  onNext: () => void
  onToggleAutoplay: () => void
  onToggleFullscreen: () => void
  onToggleOverview: () => void
}

export const ControlsHud: React.FC<ControlsHudProps> = ({
  current,
  total,
  isPlaying,
  isFullscreen,
  onPrev,
  onNext,
  onToggleAutoplay,
  onToggleFullscreen,
  onToggleOverview,
}) => {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const reveal = () => {
      setVisible(true)
      clearTimeout(timer)
      timer = setTimeout(() => setVisible(false), 3800)
    }
    reveal()
    window.addEventListener('mousemove', reveal)
    window.addEventListener('keydown', reveal)
    return () => {
      window.removeEventListener('mousemove', reveal)
      window.removeEventListener('keydown', reveal)
      clearTimeout(timer)
    }
  }, [])

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 transition-all duration-300 ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
    >
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d0a1a]/90 border border-violet-400/20 backdrop-blur-xl shadow-2xl text-slate-100">
        <button
          type="button"
          onClick={onPrev}
          disabled={current === 0}
          title="Previous Slide (←)"
          className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="px-2.5 py-0.5 text-xs font-mono tracking-wider text-slate-400 select-none tabular-nums">
          <span className="text-white font-bold">
            {String(current + 1).padStart(2, '0')}
          </span>
          <span className="mx-1 text-slate-600">/</span>
          <span>{String(total).padStart(2, '0')}</span>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={current === total - 1}
          title="Next Slide (→ or Space)"
          className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <button
          type="button"
          onClick={onToggleAutoplay}
          title={isPlaying ? 'Pause Autoplay (P)' : 'Start Autoplay (P)'}
          className={`p-2 rounded-full transition-colors cursor-pointer ${
            isPlaying
              ? 'bg-violet-500 text-white shadow-[0_0_12px_rgba(167,139,250,0.65)]'
              : 'text-slate-300 hover:text-white hover:bg-white/10'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          type="button"
          onClick={onToggleOverview}
          title="All Slides (G)"
          className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onToggleFullscreen}
          title="Fullscreen (F)"
          className="hidden sm:flex p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  )
}
