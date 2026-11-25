import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ShieldAlert, CheckCircle2, Clock } from 'lucide-react'
import { SlideHeader } from '../components/SlideHeader'

interface SlideProps {
  isActive: boolean
}

const DELIVERABLES = [
  { name: 'Custom Firmware & DFU Package', done: true },
  { name: 'InfiniSim Desktop Simulator', done: true },
  { name: 'React 19 Web Portal & App', done: true },
  { name: 'Android Companion APK (v1.0)', done: true },
  { name: 'NimBLE GATT Services', done: true },
  { name: 'Sealed Watch Physical Flash', done: false },
]

export const Slide11SafetyStatus: React.FC<SlideProps> = ({ isActive }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(
        '.s11-left',
        { opacity: 0, x: -18 },
        { opacity: 1, x: 0, duration: 0.45, stagger: 0.1, ease: 'power3.out' },
        0.06
      )
      tl.fromTo(
        '.s11-row',
        { opacity: 0, x: 18 },
        { opacity: 1, x: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' },
        0.16
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
        kicker="10 / SAFETY & DELIVERABLES"
        speaker="Arjun (Safety) • Ravikant (Status)"
        slideNumber={11}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center my-auto">
        <div className="md:col-span-6 space-y-5 md:space-y-6">
          <div className="s11-left p-5 md:p-6 rounded-3xl bg-amber-500/[0.08] border border-amber-400/35">
            <div className="flex items-center gap-3 text-amber-300 font-mono text-xs uppercase tracking-widest mb-2">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <span>Arjun • Sealed PineTime Rule</span>
            </div>
            <h3 className="text-xl md:text-2xl font-extrabold text-white leading-snug">
              Simulator-First. Zero Risk to Hardware.
            </h3>
            <p className="text-sm text-slate-300 mt-2.5 leading-relaxed">
              The factory-sealed PineTime has{' '}
              <strong className="text-white">no exposed debug pins</strong>. All firmware screens
              and timers are verified in our native{' '}
              <span className="text-white font-semibold">InfiniSim SDL2 simulator</span> before any
              physical OTA flash.
            </p>
          </div>

          <div className="s11-left flex flex-wrap items-center gap-2 md:gap-3 text-[11px] md:text-xs font-mono text-slate-400 pt-1">
            <span className="px-2.5 md:px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-200">
              01. InfiniSim Build
            </span>
            <span>→</span>
            <span className="px-2.5 md:px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-slate-200">
              02. App Checks
            </span>
            <span>→</span>
            <span className="px-2.5 md:px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-emerald-300">
              03. MCUBoot OTA Gate
            </span>
          </div>
        </div>

        <div className="md:col-span-6 space-y-2.5 md:space-y-3">
          <div className="text-xs font-mono uppercase tracking-[0.18em] text-violet-300 mb-2">
            Ravikant • Built Deliverables
          </div>
          {DELIVERABLES.map((d) => (
            <div
              key={d.name}
              className="s11-row flex items-center justify-between py-2.5 md:py-3 px-3.5 md:px-4 rounded-xl bg-white/[0.03] border border-white/[0.08]"
            >
              <div className="flex items-center gap-3">
                {d.done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="text-xs md:text-[14px] font-semibold text-white">{d.name}</span>
              </div>
              <span
                className={`text-[10.5px] md:text-[11px] font-mono shrink-0 ml-2 ${
                  d.done ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {d.done ? 'Built' : 'Pending Check'}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>HANDOFF → GAURAV (CONCLUSION &amp; Q&amp;A)</span>
        <span>11 / 12</span>
      </div>
    </div>
  )
}
