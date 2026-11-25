import React from 'react'
import { X } from 'lucide-react'
import { SLIDES } from '../slides/slidesData'

interface SlideOverviewModalProps {
  open: boolean
  current: number
  onSelect: (index: number) => void
  onClose: () => void
}

export const SlideOverviewModal: React.FC<SlideOverviewModalProps> = ({
  open,
  current,
  onSelect,
  onClose,
}) => {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl rounded-2xl bg-[#0b0816] border border-violet-400/25 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
          <div>
            <p className="text-[11px] font-mono uppercase tracking-widest text-violet-300">
              Slide Navigator
            </p>
            <h2 className="text-lg font-bold text-white">WristOS Presentation</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SLIDES.map((s, idx) => {
            const active = idx === current
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  onSelect(idx)
                  onClose()
                }}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[104px] ${
                  active
                    ? 'bg-violet-500/20 border-violet-400 shadow-[0_0_24px_rgba(167,139,250,0.28)]'
                    : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-violet-400/40'
                }`}
              >
                <div className="text-[10px] font-mono text-violet-300 mb-1">
                  {String(s.number).padStart(2, '0')}
                </div>
                <div className="text-xs font-bold text-white leading-snug line-clamp-2">
                  {s.title}
                </div>
                <div className="text-[10px] text-slate-400 mt-2 truncate">{s.category}</div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
