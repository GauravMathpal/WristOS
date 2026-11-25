import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { SlideHeader } from '../components/SlideHeader'

interface SlideProps {
  isActive: boolean
}

const LIVE_PROMPTS = [
  '"Remind me project demo is Friday 4 PM" → #Work Vault + Watch Alert',
  '"Start 25m focus session on my watch" → Focus Timer Armed',
  '"Give me my morning briefing" → 3 Tasks • 7,842 Steps • 16°C',
]

export const Slide09AIMemory: React.FC<SlideProps> = ({ isActive }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [promptIdx, setPromptIdx] = useState(0)

  useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(
        '.s9a-app',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.55, ease: 'power3.out' },
        0.06
      )
      tl.fromTo(
        '.s9a-watch',
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.12, ease: 'power3.out' },
        0.18
      )

      gsap.to('.s9a-orb-glow', {
        scale: 1.28,
        opacity: 0.9,
        duration: 1.7,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
      gsap.fromTo(
        '.s9a-orb-ring',
        { scale: 1, opacity: 0.7 },
        {
          scale: 1.58,
          opacity: 0,
          duration: 2.2,
          stagger: 1.1,
          repeat: -1,
          ease: 'power1.out',
        }
      )
      gsap.fromTo(
        '.s9a-watch-orb',
        { scale: 0.85, opacity: 0.8 },
        {
          scale: 1.48,
          opacity: 0,
          duration: 1.8,
          repeat: -1,
          ease: 'power1.out',
        }
      )

      tlRef.current = tl
    }, rootRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!isActive) {
      setPromptIdx(0)
      if (tlRef.current) tlRef.current.pause(0)
      return
    }
    if (tlRef.current) tlRef.current.restart()
    const timer = setInterval(() => {
      setPromptIdx((p) => (p + 1) % LIVE_PROMPTS.length)
    }, 2800)
    return () => clearInterval(timer)
  }, [isActive])

  return (
    <div
      ref={rootRef}
      className="w-full min-h-full md:h-full px-5 py-6 md:px-14 md:py-10 flex flex-col justify-between gap-6 md:gap-0"
    >
      <SlideHeader
        kicker="08 / PERSONALISED GEMINI AI & KNOWLEDGE VAULT"
        speaker="Daksh Jain"
        slideNumber={9}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center my-auto">
        {/* Left 7 Columns: Uncropped 16:10 AI Assistant UI + Clean Prompt Strip Below */}
        <div className="md:col-span-7 s9a-app flex flex-col gap-3">
          <div className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-violet-400/30 shadow-[0_24px_70px_rgba(0,0,0,0.85)] bg-[#07050f]">
            <img
              src="./app/app_assistant.png"
              alt="WristOS AI Assistant App"
              className="w-full h-full object-contain"
            />

            {/* Breathing Aura + Outward Sonar Rings centered strictly on the App AI Orb */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none w-[15.2%] aspect-square flex items-center justify-center"
              style={{ left: '35.8%', top: '39.1%' }}
            >
              <div
                className="s9a-orb-glow w-full h-full rounded-full mix-blend-screen opacity-55 blur-xl"
                style={{
                  background:
                    'radial-gradient(circle, rgba(192,132,252,0.8) 0%, rgba(236,72,153,0.45) 55%, transparent 75%)',
                }}
              />
              <div className="s9a-orb-ring absolute inset-0 rounded-full border border-violet-300/75" />
              <div className="s9a-orb-ring absolute inset-0 rounded-full border border-pink-300/60" />
            </div>
          </div>

          {/* Live Voice Intent Strip cleanly below the UI (no overlap) */}
          <div className="px-4 py-2.5 rounded-xl bg-white/[0.03] border border-violet-400/25 flex items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-slate-100 truncate">{LIVE_PROMPTS[promptIdx]}</span>
            </div>
            <span className="hidden sm:inline text-violet-300 shrink-0">Gemini AI</span>
          </div>
        </div>

        {/* Right 5 Columns: Vertically Aligned Heading + Watch AI & Knowledge Vault */}
        <div className="md:col-span-5 flex flex-col justify-between gap-6">
          <div className="s9a-watch">
            <h2 className="text-2xl md:text-[30px] font-black text-white leading-tight">
              Remembers Beyond Chat Windows.
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Tap the AI Orb on the watch to wake your phone mic, confirm new tasks, and store
              tagged memories inside your personal Knowledge Vault.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 items-start">
            <div className="s9a-watch flex flex-col items-center">
              <div className="p-2.5 md:p-3 rounded-[26px] bg-gradient-to-b from-[#252232] to-[#0f0d16] border border-violet-400/30 shadow-xl">
                <div className="relative w-32 h-32 md:w-[172px] md:h-[172px] rounded-[16px] overflow-hidden bg-black">
                  <img
                    src="./screens/screen_assistant.png"
                    alt="Watch AI Trigger"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center"
                    style={{ left: '50%', top: '30.4%' }}
                  >
                    <div className="s9a-watch-orb w-12 h-12 md:w-14 md:h-14 rounded-full border border-cyan-300/80" />
                  </div>
                </div>
              </div>
              <span className="text-xs font-semibold text-white mt-2.5">Watch AI Wake</span>
            </div>

            <div className="s9a-watch flex flex-col items-center">
              <div className="p-2.5 md:p-3 rounded-[26px] bg-gradient-to-b from-[#252232] to-[#0f0d16] border border-cyan-400/30 shadow-xl">
                <div className="w-32 h-32 md:w-[172px] md:h-[172px] rounded-[16px] overflow-hidden bg-black">
                  <img
                    src="./screens/screen_memory.png"
                    alt="Watch Knowledge Vault"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <span className="text-xs font-semibold text-white mt-2.5">Knowledge Vault</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] md:text-[11px] font-mono text-slate-500">
        <span>HANDOFF → DHRUV &amp; ATHARV (WEB, MOBILE &amp; BLE)</span>
        <span>09 / 12</span>
      </div>
    </div>
  )
}
