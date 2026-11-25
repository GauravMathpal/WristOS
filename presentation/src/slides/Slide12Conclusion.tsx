import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ShieldCheck } from 'lucide-react'
import { SlideHeader } from '../components/SlideHeader'

interface SlideProps {
  isActive: boolean
}

const LOOP_PAIRS = [
  {
    label: 'Voice AI ⟷ Watch Wake',
    phone: './app/app_mobile_ai.png',
    watch: './screens/screen_assistant.png',
    hasOrb: true,
  },
  {
    label: 'Dashboard ⟷ Signature Face',
    phone: './app/app_mobile_dashboard.png',
    watch: './screens/screen_clock.png',
    hasOrb: false,
  },
  {
    label: 'Voice AI ⟷ Focus Pomodoro',
    phone: './app/app_mobile_ai.png',
    watch: './screens/screen_focus.png',
    hasOrb: true,
  },
  {
    label: 'Dashboard ⟷ Knowledge Vault',
    phone: './app/app_mobile_dashboard.png',
    watch: './screens/screen_memory.png',
    hasOrb: false,
  },
  {
    label: 'Dashboard ⟷ Live PPG & ECG',
    phone: './app/app_mobile_dashboard.png',
    watch: './screens/screen_health.png',
    hasOrb: false,
  },
  {
    label: 'Voice AI ⟷ Daily Tasks',
    phone: './app/app_mobile_ai.png',
    watch: './screens/screen_tasks.png',
    hasOrb: true,
  },
]

export const Slide12Conclusion: React.FC<SlideProps> = ({ isActive }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const watchImgRef = useRef<HTMLImageElement>(null)
  const phoneImgRef = useRef<HTMLImageElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [loopIdx, setLoopIdx] = useState(0)

  useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(
        '.s12-anim',
        { opacity: 0, y: 22 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.12, ease: 'power3.out' },
        0.08
      )
      tl.fromTo(
        '.s12-showcase',
        { opacity: 0, scale: 0.94 },
        { opacity: 1, scale: 1, duration: 0.65, ease: 'power3.out' },
        0.2
      )

      gsap.to('.s12-phone-float', {
        y: -7,
        duration: 2.8,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
      gsap.to('.s12-watch-float', {
        y: 7,
        duration: 2.8,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
      gsap.to('.s12-orb-pulse', {
        scale: 1.28,
        opacity: 0.85,
        duration: 1.7,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
      gsap.to('.s12-sync-dot-r', {
        x: 68,
        opacity: 0,
        duration: 1.25,
        repeat: -1,
        ease: 'power1.inOut',
      })
      gsap.to('.s12-sync-dot-l', {
        x: -68,
        opacity: 0,
        duration: 1.25,
        delay: 0.6,
        repeat: -1,
        ease: 'power1.inOut',
      })

      tlRef.current = tl
    }, rootRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!isActive) {
      setLoopIdx(0)
      if (tlRef.current) tlRef.current.pause(0)
      return
    }
    if (tlRef.current) tlRef.current.restart()

    const timer = setInterval(() => {
      setLoopIdx((p) => (p + 1) % LOOP_PAIRS.length)
    }, 2600)
    return () => clearInterval(timer)
  }, [isActive])

  useEffect(() => {
    if (watchImgRef.current) {
      gsap.fromTo(
        watchImgRef.current,
        { opacity: 0.35, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' }
      )
    }
    if (phoneImgRef.current) {
      gsap.fromTo(
        phoneImgRef.current,
        { opacity: 0.55 },
        { opacity: 1, duration: 0.35, ease: 'power2.out' }
      )
    }
  }, [loopIdx])

  const pair = LOOP_PAIRS[loopIdx]

  return (
    <div
      ref={rootRef}
      className="w-full min-h-full md:h-full px-5 py-6 md:px-14 md:py-10 flex flex-col justify-between gap-6 md:gap-0"
    >
      <SlideHeader
        kicker="11 / CONCLUSION & Q&A"
        speaker="Gaurav Mathpal (Team Leader)"
        slideNumber={12}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center my-auto">
        <div className="md:col-span-6 space-y-6 md:space-y-7">
          <div className="s12-anim">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-violet-300 mb-2 md:mb-3">
              Full Circle
            </p>
            <h2 className="text-3xl md:text-[44px] font-black tracking-tight text-white leading-[1.06]">
              Stop losing your day to{' '}
              <span className="text-violet-300">phone distractions.</span>
            </h2>
            <p className="text-sm md:text-[17px] text-slate-300 mt-3 md:mt-4 leading-relaxed">
              Every essential smartwatch capability — powered by Google Gemini AI on our own
              encrypted server. Capture once, stay in control, and act at a glance.
            </p>
            <div className="inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-[11px] font-mono text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Encrypted Server • Google-Powered AI • User-Controlled Memory</span>
            </div>
          </div>

          <div className="s12-anim pt-5 md:pt-7 border-t border-white/[0.08] space-y-3 md:space-y-4">
            <div className="flex items-center gap-4">
              <img
                src="./wristos-logo.svg"
                alt="WristOS"
                className="w-10 h-10 md:w-12 md:h-12 rounded-2xl shadow-[0_0_28px_rgba(167,139,250,0.4)]"
              />
              <div>
                <div className="text-xl md:text-[28px] font-black text-white tracking-tight">
                  Thank You — Questions?
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Gaurav Mathpal (Leader) • Ashish • Daksh • Arjun • Atharv • Dhruv • Ravikant
                </div>
              </div>
            </div>

            <div className="font-mono text-[11px] md:text-xs pt-1">
              <div className="text-violet-300 font-semibold">
                WRISTOS — YOUR PERSONAL INTELLIGENCE, ON YOUR WRIST
              </div>
              <div className="text-slate-500 mt-0.5">
                Graphic Era Hill University, Dehradun • Design Thinking Lab (HSMC-101)
              </div>
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Connected Phone <-> BLE <-> Watch Q&A Loop */}
        <div className="md:col-span-6 s12-showcase flex flex-col items-center justify-center relative">
          <div
            className="hidden md:block absolute w-[440px] h-72 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(167,139,250,0.45) 0%, rgba(56,189,248,0.2) 55%, transparent 75%)',
            }}
          />

          <div className="relative flex items-center justify-center gap-2 md:gap-3">
            <div className="s12-phone-float rounded-[24px] md:rounded-[28px] p-1.5 bg-[#161322] border border-violet-400/35 shadow-[0_24px_60px_rgba(0,0,0,0.85)] relative">
              <div className="relative w-[132px] h-[276px] md:w-[178px] md:h-[372px] rounded-[18px] md:rounded-[22px] overflow-hidden bg-black">
                <img
                  ref={phoneImgRef}
                  src={pair.phone}
                  alt="WristOS Phone App"
                  className="w-full h-full object-cover object-top"
                />
                {pair.hasOrb && (
                  <div
                    className="s12-orb-pulse absolute w-20 h-20 md:w-28 md:h-28 rounded-full mix-blend-screen blur-lg opacity-55 pointer-events-none"
                    style={{
                      left: '50%',
                      top: '46%',
                      transform: 'translate(-50%, -50%)',
                      background:
                        'radial-gradient(circle, rgba(192,132,252,0.85) 0%, rgba(236,72,153,0.45) 55%, transparent 75%)',
                    }}
                  />
                )}
              </div>
            </div>

            <div className="relative w-10 md:w-20 h-14 flex items-center justify-center shrink-0">
              <svg className="w-full h-10 overflow-visible" viewBox="0 0 80 40">
                <line
                  x1="4"
                  y1="14"
                  x2="76"
                  y2="14"
                  stroke="rgba(56,189,248,0.5)"
                  strokeWidth="2"
                  className="animate-dash-flow"
                />
                <line
                  x1="76"
                  y1="26"
                  x2="4"
                  y2="26"
                  stroke="rgba(167,139,250,0.5)"
                  strokeWidth="2"
                  className="animate-dash-flow"
                />
              </svg>
              <span className="hidden md:block s12-sync-dot-r absolute left-1 top-[15px] w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
              <span className="hidden md:block s12-sync-dot-l absolute right-1 top-[27px] w-2 h-2 rounded-full bg-violet-300 shadow-[0_0_8px_#c4b5fd]" />
            </div>

            <div className="s12-watch-float flex flex-col items-center">
              <div className="w-16 md:w-24 h-4 md:h-5 rounded-t-xl bg-gradient-to-b from-white/[0.03] to-white/[0.08] border-x border-t border-white/10" />
              <div className="p-2.5 md:p-3.5 rounded-[26px] md:rounded-[34px] bg-gradient-to-b from-[#252232] to-[#0f0d16] border-2 border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.9)]">
                <div className="w-[132px] h-[132px] md:w-[186px] md:h-[186px] rounded-[14px] md:rounded-[18px] overflow-hidden bg-black border border-violet-400/30">
                  <img
                    ref={watchImgRef}
                    src={pair.watch}
                    alt="WristOS Watch UI"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="w-16 md:w-24 h-4 md:h-5 rounded-b-xl bg-gradient-to-t from-white/[0.03] to-white/[0.08] border-x border-b border-white/10" />
            </div>
          </div>

          <div className="mt-4 md:mt-5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 font-mono text-[11px] md:text-xs text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{pair.label}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] md:text-[11px] font-mono text-slate-500">
        <span>WRISTOS ECOSYSTEM</span>
        <span>12 / 12</span>
      </div>
    </div>
  )
}
