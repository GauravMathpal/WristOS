import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { SlideHeader } from '../components/SlideHeader'

interface SlideProps {
  isActive: boolean
}

const MARKETS = [
  {
    name: 'Smartwatches',
    now: '$108.3B',
    future: '$200.6B',
    year: '2025 → 2030',
    growth: '+85%',
    barPct: 92,
    color: 'from-violet-500 to-violet-300',
  },
  {
    name: 'Productivity Software',
    now: '$74.9B',
    future: '$147.1B',
    year: '2025 → 2030',
    growth: '+96%',
    barPct: 72,
    color: 'from-cyan-500 to-cyan-300',
  },
  {
    name: 'Time-Tracking & Focus',
    now: '$6.1B',
    future: '$17.3B',
    year: '2025 → 2033',
    growth: '+184%',
    barPct: 48,
    color: 'from-emerald-500 to-emerald-300',
  },
]

const DEMAND = [
  { pct: '75.0%', label: 'Want AI Personal Assistant' },
  { pct: '73.1%', label: 'Want Tasks & Smart Reminders' },
  { pct: '69.6%', label: 'Want Personal Memory Vault' },
]

export const Slide05Market: React.FC<SlideProps> = ({ isActive }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(
        '.s5-head',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' },
        0.06
      )
      tl.fromTo(
        '.s5-col',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.1, ease: 'power3.out' },
        0.16
      )
      tl.fromTo(
        '.s5-bar',
        { scaleX: 0 },
        { scaleX: 1, duration: 0.75, stagger: 0.12, ease: 'power3.out', transformOrigin: 'left' },
        0.28
      )
      tl.fromTo(
        '.s5-demand',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' },
        0.5
      )
      tlRef.current = tl
    }, rootRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!tlRef.current) return
    if (isActive) tlRef.current.restart()
    else tlRef.current.pause(0)
  }, [isActive])

  return (
    <div ref={rootRef} className="w-full min-h-full md:h-full px-5 py-6 md:px-14 md:py-10 flex flex-col justify-between gap-6 md:gap-0">
      <SlideHeader
        kicker="04 / MARKET VALUE & USER DEMAND"
        speaker="Ashish Sanjay Hatwal"
        slideNumber={5}
      />

      <div className="my-auto space-y-6 md:space-y-8">
        <div className="s5-head flex flex-col md:flex-row md:items-end justify-between gap-2">
          <h2 className="text-2xl md:text-[40px] font-black tracking-tight text-white leading-tight max-w-[760px]">
            Sitting at the Intersection of{' '}
            <span className="text-violet-300">Three Rapidly Growing Markets</span>
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Adjacent Category Benchmarks (§2.10)
          </span>
        </div>

        {/* 3 Clean Market Growth Rows */}
        <div className="space-y-5">
          {MARKETS.map((m) => (
            <div key={m.name} className="s5-col">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
                <div className="flex items-baseline gap-2.5 md:gap-3">
                  <span className="text-base md:text-[19px] font-bold text-white">{m.name}</span>
                  <span className="text-xs font-mono text-slate-500">{m.year}</span>
                </div>
                <div className="flex items-baseline gap-2.5 md:gap-3 font-mono">
                  <span className="text-xs md:text-sm text-slate-400">{m.now} →</span>
                  <span className="text-lg md:text-2xl font-black text-white tabular-nums">{m.future}</span>
                  <span className="text-xs text-emerald-300 font-bold">{m.growth}</span>
                </div>
              </div>
              <div className="h-3 rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className={`s5-bar h-full rounded-full bg-gradient-to-r ${m.color}`}
                  style={{ width: `${m.barPct}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Demand + Positioning Strip */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-5 border-t border-white/[0.08] items-center">
          <div className="md:col-span-8 grid grid-cols-3 gap-4 md:gap-6">
            {DEMAND.map((d) => (
              <div key={d.label} className="s5-demand">
                <div className="text-2xl md:text-3xl font-black text-white font-mono tabular-nums">
                  {d.pct}
                </div>
                <div className="text-[11px] md:text-xs text-slate-400 mt-1">{d.label}</div>
              </div>
            ))}
          </div>
          <div className="md:col-span-4 s5-demand md:text-right md:border-l border-t md:border-t-0 pt-4 md:pt-0 border-white/[0.08] md:pl-6">
            <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300">
              Core Direction
            </div>
            <div className="text-sm font-semibold text-white mt-1">
              Glanceable • Personalised • Productivity-First
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>ASHISH CONTINUES → PRODUCT POSITIONING &amp; TARGET USERS</span>
        <span>05 / 12</span>
      </div>
    </div>
  )
}
