import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { SlideHeader } from '../components/SlideHeader'

interface SlideProps {
  isActive: boolean
}

const WATCH_SCREENS = [
  {
    id: 'clock',
    title: 'WristOS Signature Face',
    tag: 'LATEST WATCH OS',
    image: './screens/screen_clock.png',
    caption: 'Custom geometric display clock, W WristOS capsule, violet wave ribbon, steps & BPM.',
  },
  {
    id: 'aod',
    title: 'Always-On Display (AOD)',
    tag: 'LOW-POWER MODE',
    image: './screens/screen_aod.png',
    caption: 'Ultra-minimal high-contrast ambient dial engineered for OLED-black battery efficiency.',
  },
  {
    id: 'launcher',
    title: '3×2 App Launcher',
    tag: 'NAVIGATION',
    image: './screens/screen_launcher.png',
    caption: 'Clean circular launcher icons with smooth touch swipe gestures on 240×240 IPS.',
  },
  {
    id: 'health',
    title: 'Biometrics & Live ECG',
    tag: 'HRS3300 PPG',
    image: './screens/screen_health.png',
    caption: 'Real-time optical heart-rate sensing paired with a live ECG waveform graph.',
  },
  {
    id: 'activity',
    title: '7-Day Step Analytics',
    tag: 'BMA421 MOTION',
    image: './screens/screen_activity.png',
    caption: 'Weekly Mon–Sun activity bars tracking progress toward 10,000 daily steps.',
  },
  {
    id: 'notification',
    title: 'Smart Wrist Alerts',
    tag: 'ANS 0x1811',
    image: './screens/screen_notification.png',
    caption: 'Clean filtered phone alerts with ERM haptic motor wake on your wrist.',
  },
  {
    id: 'music',
    title: 'Media & Quick Controls',
    tag: 'UTILITIES',
    image: './screens/screen_music.png',
    caption: 'Remote playback controls, weather, breathe, stopwatch & 2×2 quick settings.',
  },
]

export const Slide07WatchOS: React.FC<SlideProps> = ({ isActive }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const tlRef = useRef<gsap.core.Timeline | null>(null)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (!rootRef.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(
        '.s7w-watch',
        { opacity: 0, scale: 0.9, y: 18 },
        { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: 'power3.out' },
        0.05
      )
      tl.fromTo(
        '.s7w-text',
        { opacity: 0, x: 24 },
        { opacity: 1, x: 0, duration: 0.5, stagger: 0.08, ease: 'power3.out' },
        0.15
      )
      tlRef.current = tl
    }, rootRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    if (!isActive) {
      setIdx(0)
      if (tlRef.current) tlRef.current.pause(0)
      return
    }
    if (tlRef.current) tlRef.current.restart()

    const timer = setInterval(() => {
      setIdx((p) => (p + 1) % WATCH_SCREENS.length)
    }, 2200)
    return () => clearInterval(timer)
  }, [isActive])

  useEffect(() => {
    if (!imgRef.current) return
    gsap.fromTo(
      imgRef.current,
      { opacity: 0.3, scale: 0.95 },
      { opacity: 1, scale: 1, duration: 0.35, ease: 'power2.out' }
    )
  }, [idx])

  const screen = WATCH_SCREENS[idx]

  return (
    <div ref={rootRef} className="w-full min-h-full md:h-full px-5 py-6 md:px-14 md:py-10 flex flex-col justify-between gap-6 md:gap-0">
      <SlideHeader
        kicker="06 / WATCH OS & FIRMWARE"
        speaker="Daksh Jain"
        slideNumber={7}
      />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-14 items-center my-auto">
        <div className="md:col-span-5 s7w-watch flex flex-col items-center">
          <div className="relative flex flex-col items-center">
            <div
              className="absolute -inset-12 rounded-full blur-2xl opacity-45 pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(167,139,250,0.45), transparent 70%)',
              }}
            />
            <div className="w-28 md:w-36 h-6 md:h-8 rounded-t-2xl bg-gradient-to-b from-white/[0.03] to-white/[0.08] border-x border-t border-white/10" />
            <div className="relative flex items-center">
              <div className="w-2 h-10 md:h-12 bg-slate-500 rounded-l-md -mr-0.5" />
              <div className="p-4 md:p-5 rounded-[36px] md:rounded-[44px] bg-gradient-to-b from-[#252232] to-[#0f0d16] border-2 border-white/20 shadow-[0_30px_70px_rgba(0,0,0,0.9)]">
                <div className="w-52 h-52 md:w-[268px] md:h-[268px] rounded-[20px] md:rounded-[24px] overflow-hidden bg-black border border-violet-400/30">
                  <img
                    ref={imgRef}
                    src={screen.image}
                    alt={screen.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
            <div className="w-28 md:w-36 h-6 md:h-8 rounded-b-2xl bg-gradient-to-t from-white/[0.03] to-white/[0.08] border-x border-b border-white/10" />
          </div>
        </div>

        <div className="md:col-span-7 space-y-5 md:space-y-6">
          <div className="s7w-text">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-violet-300">
              {String(idx + 1).padStart(2, '0')} / {String(WATCH_SCREENS.length).padStart(2, '0')} • {screen.tag}
            </span>
            <h2 className="text-3xl md:text-[44px] font-black text-white tracking-tight mt-2 leading-tight">
              {screen.title}
            </h2>
            <p className="text-sm md:text-[18px] text-slate-300 mt-3 leading-relaxed max-w-[520px]">
              {screen.caption}
            </p>
          </div>

          <div className="s7w-text flex items-center gap-2 pt-2">
            {WATCH_SCREENS.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={s.title}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === idx
                    ? 'w-10 bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]'
                    : 'w-2.5 bg-white/15 hover:bg-white/35'
                }`}
              />
            ))}
          </div>

          <div className="s7w-text pt-5 md:pt-6 border-t border-white/[0.08] grid grid-cols-3 gap-4 md:gap-6 text-[11px] md:text-xs font-mono">
            <div>
              <div className="text-slate-500">HARDWARE</div>
              <div className="text-white font-semibold mt-1">PINE64 PineTime</div>
            </div>
            <div>
              <div className="text-slate-500">MCU &amp; DISPLAY</div>
              <div className="text-white font-semibold mt-1">nRF52832 • 240×240</div>
            </div>
            <div>
              <div className="text-slate-500">FIRMWARE</div>
              <div className="text-violet-300 font-semibold mt-1">FreeRTOS + LVGL 7</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>LIVE CAPTURED FROM INFINISIM FIRMWARE BUILD</span>
        <span>07 / 12</span>
      </div>
    </div>
  )
}
