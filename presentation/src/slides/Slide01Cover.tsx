import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Crown } from 'lucide-react'

interface SlideProps {
  isActive: boolean
}

interface Member {
  name: string
  initials: string
  roll: string
  role: string
  photo: string
}

const LEADER: Member = {
  name: 'Gaurav Mathpal',
  initials: 'GM',
  roll: 'PV-26180355',
  role: 'Team Leader • AI & App',
  photo: './team/gaurav.jpg',
}

const MEMBERS: Member[] = [
  { name: 'Ashish Sanjay Hatwal', initials: 'AH', roll: 'PV-26190264', role: 'Product & QA Lead', photo: './team/ashish.jpg' },
  { name: 'Daksh Jain', initials: 'DJ', roll: 'PV-26190271', role: 'Firmware Lead', photo: './team/daksh.jpg' },
  { name: 'Arjun Sharma', initials: 'AS', roll: 'PV-26180244', role: 'Research & QA', photo: './team/arjun.jpg' },
  { name: 'Atharv Santosh Gaikwad', initials: 'AG', roll: 'PV-26180274', role: 'Watch & BLE', photo: './team/atharv.jpg' },
  { name: 'Dhruv Singh Bhandari', initials: 'DB', roll: 'PV-26180334', role: 'Web & App Dev', photo: './team/dhruv.jpg' },
  { name: 'Ravikant Kushwah', initials: 'RK', roll: 'PV-26180560', role: 'Docs & Testing', photo: './team/ravikant.jpg' },
]

const PortraitAvatar: React.FC<{
  src: string
  name: string
  initials: string
  sizeClass: string
  ringClass: string
}> = ({ src, name, initials, sizeClass, ringClass }) => {
  const [missing, setMissing] = useState(false)
  return (
    <div
      className={`${sizeClass} rounded-2xl overflow-hidden bg-[#0e0c1a] ${ringClass} flex items-center justify-center shrink-0 relative`}
    >
      {!missing ? (
        <img
          src={src}
          alt={name}
          onError={() => setMissing(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-white/[0.05] to-transparent">
          <span className="font-mono font-bold text-slate-300 text-lg tracking-wider">
            {initials}
          </span>
        </div>
      )}
    </div>
  )
}

export const Slide01Cover: React.FC<SlideProps> = ({ isActive }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(
        '.s1-top',
        { opacity: 0, y: -12 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' },
        0
      )
      tl.fromTo(
        '.s1-brand',
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power3.out' },
        0.1
      )
      tl.fromTo(
        '.s1-leader',
        { opacity: 0, scale: 0.94, y: 16 },
        { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out' },
        0.2
      )
      tl.fromTo(
        '.s1-member',
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.055, ease: 'power2.out' },
        0.32
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
      {/* Top Institutional Bar */}
      <div className="s1-top flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3 md:pb-4">
        <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-xs font-mono tracking-wider">
          <span className="text-violet-300 font-semibold">GRAPHIC ERA HILL UNIVERSITY, DEHRADUN</span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="text-slate-400">DESIGN THINKING LAB (HSMC-101)</span>
        </div>
        <div className="text-[10px] md:text-xs font-mono text-slate-400">
          Faculty Coordinator:{' '}
          <span className="text-white font-semibold">Dr. Sateesh K. Yadav</span>
        </div>
      </div>

      {/* Main Split: Left Brand + Highlighted Team Leader | Right 6 Individual Portraits */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 items-center my-auto">
        {/* Left 5 Columns: Title + Featured Team Leader */}
        <div className="md:col-span-5 flex flex-col justify-between">
          <div>
            <div className="s1-brand flex items-center gap-3 mb-3 md:mb-4">
              <img
                src="./wristos-logo.svg"
                alt="WristOS"
                className="w-9 h-9 md:w-10 md:h-10 rounded-xl shadow-[0_0_24px_rgba(167,139,250,0.4)]"
              />
              <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-violet-300">
                Project Presentation
              </span>
            </div>

            <h1 className="s1-brand text-5xl md:text-[64px] font-black tracking-tight text-white leading-[0.96]">
              WristOS
            </h1>
            <p className="s1-brand text-lg md:text-[20px] font-medium text-slate-300 mt-2.5 leading-snug">
              Your Personal Intelligence,{' '}
              <span className="text-violet-300 font-semibold">On Your Wrist.</span>
            </p>
          </div>

          {/* Highlighted Team Leader Spotlight Card */}
          <div className="s1-leader mt-6 md:mt-8 p-3.5 md:p-4 rounded-2xl bg-gradient-to-r from-violet-500/[0.16] via-violet-500/[0.07] to-transparent border border-violet-400/50 shadow-[0_0_36px_rgba(139,92,246,0.18)] flex items-center gap-4">
            <PortraitAvatar
              src={LEADER.photo}
              name={LEADER.name}
              initials={LEADER.initials}
              sizeClass="w-20 h-20 md:w-24 md:h-24"
              ringClass="border-2 border-violet-400 shadow-[0_0_20px_rgba(167,139,250,0.45)]"
            />
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500 text-white text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5">
                <Crown className="w-3 h-3" />
                <span>Team Leader</span>
              </div>
              <div className="text-lg md:text-[21px] font-extrabold text-white tracking-tight leading-tight">
                {LEADER.name}
              </div>
              <div className="text-xs font-mono text-violet-200 mt-1">{LEADER.roll}</div>
              <div className="text-[11px] text-slate-300 mt-0.5">{LEADER.role}</div>
            </div>
          </div>
        </div>

        {/* Right 7 Columns: 6 Individual Member Photo Cards */}
        <div className="md:col-span-7">
          <div className="s1-brand flex items-center justify-between mb-3">
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-slate-400">
              Team Members
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-3.5">
            {MEMBERS.map((m) => (
              <div
                key={m.roll}
                className="s1-member p-2.5 md:p-3 rounded-2xl bg-white/[0.025] border border-white/[0.09] flex flex-col items-center text-center"
              >
                <PortraitAvatar
                  src={m.photo}
                  name={m.name}
                  initials={m.initials}
                  sizeClass="w-16 h-16 md:w-24 md:h-24"
                  ringClass="border border-white/15"
                />
                <div className="mt-2 md:mt-2.5 text-xs md:text-[13px] font-bold text-white leading-snug">
                  {m.name}
                </div>
                <div className="text-[10px] md:text-[10.5px] font-mono text-violet-300 mt-0.5">{m.roll}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{m.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Minimal Bottom Footer */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>WRISTOS // PERSONAL INTELLIGENCE ECOSYSTEM</span>
        <span>01 / 12</span>
      </div>
    </div>
  )
}
