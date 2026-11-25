import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { SlideHeader } from '../components/SlideHeader'

interface SlideProps {
  isActive: boolean
}

const INSIGHTS = [
  {
    num: '01',
    title: 'Competing Priorities',
    desc: 'Students and top global managers alike juggle deadlines, meetings, and small commitments across the day.',
  },
  {
    num: '02',
    title: 'Fragmented Digital Tools',
    desc: 'Notes in one app, tasks in another, reminders somewhere else — nothing shares real context.',
  },
  {
    num: '03',
    title: 'The Phone Distraction Trap',
    desc: 'Picking up a phone just to check a task pulls you straight into notifications and lost focus.',
  },
]

export const Slide02Hook: React.FC<SlideProps> = ({ isActive }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(
        '.s2-question',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
        0.06
      )
      tl.fromTo(
        '.s2-line',
        { scaleX: 0 },
        { scaleX: 1, duration: 0.5, ease: 'power2.out', transformOrigin: 'left' },
        0.3
      )
      tl.fromTo(
        '.s2-point',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.1, ease: 'power3.out' },
        0.38
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
        kicker="01 / THE EVERYDAY CHALLENGE"
        speaker="Gaurav Mathpal (Team Leader)"
        slideNumber={2}
      />

      {/* Dramatic Keynote Hook Question */}
      <div className="my-auto space-y-8 md:space-y-10">
        <div className="max-w-[980px]">
          <p className="s2-question text-xs md:text-[14px] font-mono uppercase tracking-[0.2em] text-slate-400 mb-3">
            A Quick Question Before We Begin
          </p>
          <h2 className="s2-question text-3xl md:text-[58px] font-black tracking-tight text-white leading-[1.08] md:leading-[1.06]">
            How many of you felt today{' '}
            <span className="text-violet-300">wasn’t productive?</span>
          </h2>
          <div className="s2-line h-[2px] w-24 md:w-32 bg-gradient-to-r from-violet-400 to-cyan-400 mt-5 md:mt-6" />
        </div>

        {/* 3 Clean Open Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 pt-2">
          {INSIGHTS.map((item) => (
            <div key={item.num} className="s2-point">
              <div className="font-mono text-xs text-violet-300 font-bold mb-2">
                {item.num}
              </div>
              <h3 className="text-[20px] font-bold text-white leading-snug">
                {item.title}
              </h3>
              <p className="text-[14px] text-slate-400 mt-2 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>WHY BUILDING ANOTHER MOBILE-ONLY APP WASN’T ENOUGH</span>
        <span>02 / 12</span>
      </div>
    </div>
  )
}
