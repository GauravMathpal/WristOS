import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { Smartphone, Watch } from 'lucide-react'
import { SlideHeader } from '../components/SlideHeader'

interface SlideProps {
  isActive: boolean
}

export const Slide04VisionReveal: React.FC<SlideProps> = ({ isActive }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(
        '.s4-bridge',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power3.out' },
        0.06
      )
      tl.fromTo(
        '.s4-tagline',
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.65, ease: 'power3.out' },
        0.35
      )
      gsap.to('.s4-pulse-dot', {
        x: 156,
        opacity: 0,
        duration: 1.4,
        repeat: -1,
        ease: 'power1.inOut',
        stagger: 0.45,
      })
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
        kicker="03 / THE IDEA"
        speaker="Gaurav Mathpal (Team Leader)"
        slideNumber={4}
      />

      {/* Visual Architecture Equation + Dramatic Brand Reveal */}
      <div className="my-auto flex flex-col items-center text-center">
        {/* Phone -> BLE -> Watch Beam */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 mb-8 md:mb-12 w-full">
          <div className="s4-bridge flex items-center gap-3.5 px-5 md:px-6 py-3.5 md:py-4 rounded-2xl bg-white/[0.03] border border-white/10 w-full md:w-auto">
            <Smartphone className="w-6 h-6 md:w-7 md:h-7 text-violet-300 shrink-0" />
            <div className="text-left">
              <div className="text-[10px] font-mono uppercase tracking-widest text-violet-300">
                Intelligence Centre
              </div>
              <div className="text-sm md:text-base font-bold text-white">Phone runs Gemini AI &amp; Memory</div>
            </div>
          </div>

          {/* Animated Signal Beam */}
          <div className="s4-bridge relative w-44 h-8 hidden md:flex items-center">
            <svg className="w-full h-6 overflow-visible" viewBox="0 0 176 24">
              <line
                x1="4"
                y1="12"
                x2="172"
                y2="12"
                stroke="rgba(167,139,250,0.45)"
                strokeWidth="2"
                className="animate-dash-flow"
              />
            </svg>
            <span className="s4-pulse-dot absolute left-1 w-2.5 h-2.5 rounded-full bg-violet-300 shadow-[0_0_12px_#c4b5fd]" />
            <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[10px] font-mono text-cyan-300">
              BLE GATT SYNC
            </span>
          </div>

          <div className="s4-bridge flex items-center gap-3.5 px-5 md:px-6 py-3.5 md:py-4 rounded-2xl bg-white/[0.03] border border-white/10 w-full md:w-auto">
            <Watch className="w-6 h-6 md:w-7 md:h-7 text-cyan-300 shrink-0" />
            <div className="text-left">
              <div className="text-[10px] font-mono uppercase tracking-widest text-cyan-300">
                Everyday Interface
              </div>
              <div className="text-sm md:text-base font-bold text-white">Watch shows Glance &amp; Haptics</div>
            </div>
          </div>
        </div>

        {/* Hero Wordmark + Slogan */}
        <div className="s4-tagline space-y-3 md:space-y-4">
          <div className="flex items-center justify-center gap-3">
            <img
              src="./wristos-logo.svg"
              alt="WristOS"
              className="w-10 h-10 md:w-12 md:h-12 rounded-2xl shadow-[0_0_32px_rgba(167,139,250,0.45)]"
            />
            <span className="text-4xl md:text-[52px] font-black tracking-tight text-white">WRISTOS</span>
          </div>
          <p className="text-lg md:text-[28px] font-extrabold tracking-wide text-violet-300 uppercase">
            Your Personal Intelligence, On Your Wrist.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>HANDOFF → ASHISH (MARKET OPPORTUNITY)</span>
        <span>04 / 12</span>
      </div>
    </div>
  )
}
