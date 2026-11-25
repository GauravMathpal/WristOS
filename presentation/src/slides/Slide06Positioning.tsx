import React, { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { GraduationCap, Briefcase, Rocket } from 'lucide-react'
import { SlideHeader } from '../components/SlideHeader'

interface SlideProps {
  isActive: boolean
}

const VALUE_PILLARS = [
  {
    num: '01',
    title: 'Glanceable Clarity',
    desc: 'Act in 3 seconds without unlocking a phone.',
    accent: 'text-slate-100',
  },
  {
    num: '02',
    title: 'Persistent Context',
    desc: 'Memory, tasks & routines connected all day.',
    accent: 'text-violet-300',
  },
  {
    num: '03',
    title: 'Permissioned AI',
    desc: 'Full control to review, edit, or delete memory.',
    accent: 'text-cyan-300',
  },
  {
    num: '04',
    title: 'Software-First Edge',
    desc: 'Built on open hardware — zero lock-in.',
    accent: 'text-emerald-300',
  },
]

const TARGET_USERS = [
  {
    icon: GraduationCap,
    title: 'Students',
    desc: 'Assignment deadlines, class reminders, memory capture & Pomodoro study blocks.',
    color: 'text-violet-300',
  },
  {
    icon: Briefcase,
    title: 'Working Professionals',
    desc: 'Meeting prompts, follow-ups, priority filtering & fewer phone interruptions.',
    color: 'text-cyan-300',
  },
  {
    icon: Rocket,
    title: 'Freelancers & Builders',
    desc: 'Multi-project priorities, daily routines, time summaries & quick voice recall.',
    color: 'text-emerald-300',
  },
]

export const Slide06Positioning: React.FC<SlideProps> = ({ isActive }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(
        '.s6p-head',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' },
        0.05
      )
      tl.fromTo(
        '.s6p-pill',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out' },
        0.16
      )
      tl.fromTo(
        '.s6p-user',
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.1, ease: 'power3.out' },
        0.34
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
        kicker="05 / WHY WRISTOS & WHO IT SERVES"
        speaker="Ashish Sanjay Hatwal"
        slideNumber={6}
      />

      <div className="my-auto space-y-6 md:space-y-9">
        <div className="s6p-head">
          <h2 className="text-2xl md:text-[42px] font-black tracking-tight text-white leading-tight max-w-[920px]">
            Not Just Hardware —{' '}
            <span className="text-violet-300">Continuity Between Context &amp; Action.</span>
          </h2>
        </div>

        {/* 4 Meaningful Design Pillars (No brand/company names) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 md:gap-6 py-5 border-y border-white/[0.08]">
          {VALUE_PILLARS.map((item) => (
            <div key={item.num} className="s6p-pill">
              <div className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
                {item.num} / Pillar
              </div>
              <div className={`text-lg md:text-[19px] font-extrabold mt-1 ${item.accent}`}>
                {item.title}
              </div>
              <div className="text-xs text-slate-300 mt-1.5 leading-relaxed">{item.desc}</div>
            </div>
          ))}
        </div>

        {/* 3 Target Audience Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 pt-1">
          {TARGET_USERS.map((u) => {
            const Icon = u.icon
            return (
              <div key={u.title} className="s6p-user">
                <Icon className={`w-6 h-6 ${u.color} mb-2.5`} />
                <h3 className="text-lg md:text-xl font-bold text-white">{u.title}</h3>
                <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{u.desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>HANDOFF → DAKSH (WATCH OS &amp; CORE FEATURES)</span>
        <span>06 / 12</span>
      </div>
    </div>
  )
}
