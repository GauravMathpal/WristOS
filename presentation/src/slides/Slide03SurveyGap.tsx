import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { SlideHeader } from '../components/SlideHeader'

interface SlideProps {
  isActive: boolean
}

const REGIONS = [
  { name: 'India', pct: '30.0%' },
  { name: 'United States', pct: '19.2%' },
  { name: 'United Kingdom', pct: '13.5%' },
  { name: 'Germany', pct: '11.2%' },
  { name: 'Australia', pct: '8.8%' },
  { name: 'Russia & Other', pct: '17.3%' },
]

export const Slide03SurveyGap: React.FC<SlideProps> = ({ isActive }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const pctRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(
        '.s3-left',
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' },
        0.06
      )
      tl.fromTo(
        '.s3-right',
        { opacity: 0, x: 20 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power3.out' },
        0.16
      )
      const obj = { v: 0 }
      tl.to(
        obj,
        {
          v: 85.4,
          duration: 1.0,
          ease: 'power2.out',
          onUpdate: () => {
            if (pctRef.current) pctRef.current.textContent = obj.v.toFixed(1)
          },
        },
        0.12
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
        kicker="02 / 250+ GLOBAL SURVEY & THE AI CONTEXT GAP"
        speaker="Gaurav Mathpal (Team Leader)"
        slideNumber={3}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center my-auto">
        {/* Left 6 Columns: 85.4% Hero Number + 250+ Global Regions */}
        <div className="md:col-span-6 space-y-6">
          <div className="s3-left">
            <span className="text-xs font-mono uppercase tracking-[0.18em] text-violet-300">
              250+ Global Profile Survey
            </span>
            <div className="text-6xl md:text-[96px] font-black text-white leading-none tracking-tight tabular-nums mt-2">
              <span ref={pctRef}>85.4</span>
              <span className="text-violet-400 text-4xl md:text-[56px]">%</span>
            </div>
            <p className="text-lg md:text-[20px] font-semibold text-slate-200 mt-2">
              wear a watch regularly every day.
            </p>
            <p className="text-sm text-slate-400 mt-1">
              While <span className="text-white font-semibold">63.5%</span> fight fragmented apps
              and <span className="text-white font-semibold">58.5%</span> struggle to stay focused.
            </p>
          </div>

          <div className="s3-left pt-5 border-t border-white/[0.08]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-3">
              Global Profile Reach (250+ Model)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs">
              {REGIONS.map((r) => (
                <div key={r.name} className="flex items-center justify-between">
                  <span className="text-slate-400">{r.name}</span>
                  <span className="font-mono font-semibold text-white">{r.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 6 Columns: Why Normal AI Isn't Enough */}
        <div className="md:col-span-6 md:pl-10 md:border-l border-t md:border-t-0 pt-6 md:pt-0 border-white/[0.08] space-y-6 md:space-y-7">
          <div className="s3-right">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-rose-300">
              Why Standard AI Chatbots Fall Short
            </div>
            <h3 className="text-xl md:text-[26px] font-extrabold text-white mt-1.5 leading-snug">
              Fixed context windows forget your day.
            </h3>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Generic AI chats wait for you to open a phone app, re-explain your context, and
              never stay connected to your daily routines.
            </p>
          </div>

          <div className="s3-right pt-5 md:pt-6 border-t border-white/[0.08]">
            <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-emerald-300">
              Our Breakthrough
            </div>
            <h3 className="text-xl md:text-[26px] font-extrabold text-white mt-1.5 leading-snug">
              Personalised AI OS — powered by your phone, shown on your watch.
            </h3>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              Persistent user-controlled memory runs on the phone, while every reminder, task, and
              briefing surfaces effortlessly on your wrist.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>ILLUSTRATIVE 250+ PROFILE MODEL • DESIGN THINKING EMPATHY</span>
        <span>03 / 12</span>
      </div>
    </div>
  )
}
