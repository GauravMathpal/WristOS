import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Bluetooth } from 'lucide-react'
import { SlideHeader } from '../components/SlideHeader'

interface SlideProps {
  isActive: boolean
}

const WEB_VIEWS = [
  { id: 'homepage', label: 'Web Homepage', image: './app/app_homepage.png' },
  { id: 'dashboard', label: 'Companion Dashboard', image: './app/app_dashboard.png' },
  { id: 'health', label: 'Health Hub', image: './app/app_health.png' },
]

const GATT_TAGS = ['CTS 0x1805', 'BAS 0x180F', 'HRS 0x180D', 'ANS 0x1811', 'IAS 0x1802', 'MCUBoot DFU']

export const Slide10EcosystemBLE: React.FC<SlideProps> = ({ isActive }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const webImgRef = useRef<HTMLImageElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [webIdx, setWebIdx] = useState(0)

  useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(
        '.s10e-web',
        { opacity: 0, x: -18 },
        { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' },
        0.06
      )
      tl.fromTo(
        '.s10e-mob',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
        0.16
      )
      tl.fromTo(
        '.s10e-ble',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
        0.28
      )

      // Continuous subtle float on mobile phones + breathing mobile AI orb
      gsap.to('.s10e-float-a', {
        y: -7,
        duration: 2.6,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
      gsap.to('.s10e-float-b', {
        y: 7,
        duration: 2.6,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
      gsap.to('.s10e-mob-orb', {
        scale: 1.28,
        opacity: 0.85,
        duration: 1.6,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
      })
      gsap.to('.s10e-dot', {
        x: 100,
        opacity: 0,
        duration: 1.4,
        repeat: -1,
        ease: 'power1.inOut',
      })
      tlRef.current = tl
    }, rootRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!isActive) {
      setWebIdx(0)
      if (tlRef.current) tlRef.current.pause(0)
      return
    }
    if (tlRef.current) tlRef.current.restart()

    const timer = setInterval(() => {
      setWebIdx((p) => (p + 1) % WEB_VIEWS.length)
    }, 2400)
    return () => clearInterval(timer)
  }, [isActive])

  useEffect(() => {
    if (!webImgRef.current) return
    gsap.fromTo(
      webImgRef.current,
      { opacity: 0.4, scale: 1.02 },
      { opacity: 1, scale: 1, duration: 0.45, ease: 'power2.out' }
    )
  }, [webIdx])

  const currentWeb = WEB_VIEWS[webIdx]

  return (
    <div ref={rootRef} className="w-full min-h-full md:h-full px-5 py-6 md:px-14 md:py-10 flex flex-col justify-between gap-6 md:gap-0">
      <SlideHeader
        kicker="09 / WEB PORTAL, MOBILE APP & NIMBLE"
        speaker="Dhruv (Quick Intro) • Atharv (NimBLE)"
        slideNumber={10}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center my-auto">
        {/* Left 7 Columns: Auto-Cycling Web Homepage / Dashboard / Health + BLE Strip */}
        <div className="md:col-span-7 flex flex-col gap-5">
          <div className="s10e-web">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-mono uppercase tracking-wider text-violet-300">
                {currentWeb.label}
              </span>
              <div className="flex gap-1.5">
                {WEB_VIEWS.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setWebIdx(i)}
                    aria-label={v.label}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      i === webIdx ? 'w-7 bg-violet-400' : 'w-2 bg-white/15'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="w-full aspect-[16/10] rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#07050f]">
              <img
                ref={webImgRef}
                src={currentWeb.image}
                alt={currentWeb.label}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          <div className="s10e-ble pt-3 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 shrink-0">
              <Bluetooth className="w-4 h-4 text-cyan-300" />
              <span className="text-xs font-bold text-white">NimBLE GATT</span>
              <div className="relative w-20 md:w-24 h-3 flex items-center">
                <svg className="w-full h-3 overflow-visible" viewBox="0 0 96 12">
                  <line
                    x1="2"
                    y1="6"
                    x2="94"
                    y2="6"
                    stroke="rgba(56,189,248,0.45)"
                    strokeWidth="2"
                    className="animate-dash-flow"
                  />
                </svg>
                <span className="s10e-dot absolute left-1 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
              </div>
            </div>

            <div className="flex flex-wrap gap-1 justify-end">
              {GATT_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/10 font-mono text-[9.5px] text-slate-200 whitespace-nowrap"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Real Mobile App Screenshots with Floating Motion + Breathing Orb */}
        <div className="md:col-span-5 s10e-mob flex items-center justify-center gap-3 md:gap-4">
          <div className="s10e-float-a rounded-[22px] md:rounded-[26px] p-1.5 bg-[#161322] border border-white/15 shadow-2xl">
            <img
              src="./app/app_mobile_dashboard.png"
              alt="Mobile Companion Dashboard"
              className="w-[140px] h-[296px] md:w-[185px] md:h-[390px] rounded-[18px] md:rounded-[20px] object-cover object-top"
            />
          </div>

          <div className="s10e-float-b rounded-[22px] md:rounded-[26px] p-1.5 bg-[#161322] border border-violet-400/35 shadow-2xl translate-y-3 md:translate-y-4 relative">
            <div className="relative w-[140px] h-[296px] md:w-[185px] md:h-[390px] rounded-[18px] md:rounded-[20px] overflow-hidden">
              <img
                src="./app/app_mobile_ai.png"
                alt="Mobile AI Voice Assistant"
                className="w-full h-full object-cover object-top"
              />
              <div
                className="s10e-mob-orb absolute w-20 h-20 md:w-28 md:h-28 rounded-full mix-blend-screen blur-lg opacity-55 pointer-events-none"
                style={{
                  left: '50%',
                  top: '46%',
                  transform: 'translate(-50%, -50%)',
                  background:
                    'radial-gradient(circle, rgba(192,132,252,0.85) 0%, rgba(236,72,153,0.45) 55%, transparent 75%)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>HANDOFF → ARJUN &amp; RAVIKANT (SAFETY &amp; STATUS)</span>
        <span>10 / 12</span>
      </div>
    </div>
  )
}
