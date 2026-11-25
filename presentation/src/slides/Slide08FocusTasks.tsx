import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { SlideHeader } from '../components/SlideHeader'

interface SlideProps {
  isActive: boolean
}

export const Slide08FocusTasks: React.FC<SlideProps> = ({ isActive }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)

  useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(
        '.s8f-left',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' },
        0.06
      )
      tl.fromTo(
        '.s8f-watch-pair',
        { opacity: 0, scale: 0.94, y: 18 },
        { opacity: 1, scale: 1, y: 0, duration: 0.55, stagger: 0.14, ease: 'power3.out' },
        0.18
      )
      gsap.to('.s8f-pulse', {
        scale: 1.07,
        opacity: 0.15,
        duration: 1.8,
        repeat: -1,
        ease: 'power1.out',
      })
      tlRef.current = tl
    }, rootRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!isActive) {
      setSecondsLeft(25 * 60)
      if (tlRef.current) tlRef.current.pause(0)
      return
    }
    if (tlRef.current) tlRef.current.restart()

    const tick = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 25 * 60))
    }, 1000)
    return () => clearInterval(tick)
  }, [isActive])

  const mins = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const secs = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div ref={rootRef} className="w-full min-h-full md:h-full px-5 py-6 md:px-14 md:py-10 flex flex-col justify-between gap-6 md:gap-0">
      <SlideHeader
        kicker="07 / PRODUCTIVITY — POMODORO & TASKS"
        speaker="Daksh Jain"
        slideNumber={8}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center my-auto">
        <div className="md:col-span-5 space-y-5 md:space-y-6">
          <div className="s8f-left">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-emerald-300">
              $6.1B → $17.3B Time &amp; Focus Market
            </span>
            <h2 className="text-2xl md:text-[38px] font-black text-white leading-tight mt-2">
              Pomodoro Focus, Built for Students.
            </h2>
            <p className="text-sm md:text-[15px] text-slate-300 mt-3 leading-relaxed">
              Start 25-minute deep-work sessions and check off priority tasks right from your
              wrist — with silent haptic cues and zero phone temptation.
            </p>
          </div>

          <div className="s8f-left relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#090712]">
            <img
              src="./app/app_tasks.png"
              alt="WristOS Companion Tasks"
              className="w-full h-44 md:h-[215px] object-cover object-top"
            />
            <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/75 border border-emerald-400/35 backdrop-blur-md flex items-center gap-1.5 text-[10px] font-mono text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>BLE Task Sync Active</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-7 flex flex-wrap md:flex-nowrap items-center justify-center gap-6 md:gap-8">
          {/* Focus Watch Bezel with Live Ticking Pill & Haptic Pulse */}
          <div className="s8f-watch-pair flex flex-col items-center relative">
            <div className="relative">
              <div className="s8f-pulse absolute -inset-3 rounded-[36px] md:rounded-[44px] border border-violet-400/50 pointer-events-none" />
              <div className="p-3 md:p-4 rounded-[30px] md:rounded-[38px] bg-gradient-to-b from-[#252232] to-[#0f0d16] border-2 border-violet-400/35 shadow-[0_24px_60px_rgba(0,0,0,0.85)] relative">
                <div className="w-36 h-36 md:w-[230px] md:h-[230px] rounded-[16px] md:rounded-[20px] overflow-hidden bg-black relative">
                  <img
                    src="./screens/screen_focus.png"
                    alt="Watch Focus Pomodoro"
                    className="w-full h-full object-cover"
                  />
                  {/* Live ticking badge */}
                  <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 border border-violet-400/40 font-mono text-[10px] text-violet-200 tabular-nums">
                    {mins}:{secs}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-3 md:mt-4 text-center">
              <div className="text-sm font-bold text-white">Zen Focus Timer</div>
              <div className="text-xs font-mono text-violet-300 mt-0.5">
                25m / 50m / 10m + Haptics
              </div>
            </div>
          </div>

          {/* Tasks Watch Bezel */}
          <div className="s8f-watch-pair flex flex-col items-center">
            <div className="p-3 md:p-4 rounded-[30px] md:rounded-[38px] bg-gradient-to-b from-[#252232] to-[#0f0d16] border-2 border-cyan-400/30 shadow-[0_24px_60px_rgba(0,0,0,0.85)]">
              <div className="w-36 h-36 md:w-[230px] md:h-[230px] rounded-[16px] md:rounded-[20px] overflow-hidden bg-black">
                <img
                  src="./screens/screen_tasks.png"
                  alt="Watch Daily Tasks"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="mt-3 md:mt-4 text-center">
              <div className="text-sm font-bold text-white">Priority Tasks</div>
              <div className="text-xs font-mono text-cyan-300 mt-0.5">
                Synced Over BLE GATT
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>COMPANION TASKS + WATCH FOCUS &amp; CHECKLIST</span>
        <span>08 / 12</span>
      </div>
    </div>
  )
}
