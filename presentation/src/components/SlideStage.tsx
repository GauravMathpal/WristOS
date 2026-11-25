import React, { useEffect, useRef, useState } from 'react'

interface SlideStageProps {
  children: React.ReactNode
}

export const SlideStage: React.FC<SlideStageProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [isMobilePortrait, setIsMobilePortrait] = useState(false)

  useEffect(() => {
    const updateLayout = () => {
      if (!containerRef.current) return
      const vw = containerRef.current.clientWidth
      const vh = containerRef.current.clientHeight
      const mobilePortrait = vw < 768 && vh >= vw
      setIsMobilePortrait(mobilePortrait)
      if (!mobilePortrait) {
        const nextScale = Math.min(vw / 1280, vh / 720)
        setScale(Math.max(0.25, nextScale))
      }
    }

    updateLayout()
    const observer = new ResizeObserver(updateLayout)
    if (containerRef.current) observer.observe(containerRef.current)
    window.addEventListener('resize', updateLayout)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateLayout)
    }
  }, [])

  if (isMobilePortrait) {
    return (
      <div
        ref={containerRef}
        className="w-full h-full bg-[#04040a] overflow-y-auto overflow-x-hidden relative"
      >
        <div
          className="fixed -top-40 left-1/2 -translate-x-1/2 w-[520px] h-[360px] rounded-full pointer-events-none opacity-25 blur-[100px]"
          style={{
            background:
              'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, rgba(56, 189, 248, 0.08) 55%, transparent 75%)',
          }}
        />
        <div className="relative z-10 w-full min-h-full pb-20">{children}</div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-[#020205] overflow-hidden"
    >
      <div
        className="relative shrink-0 overflow-hidden bg-[#04040a]"
        style={{
          width: 1280,
          height: 720,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <div
          className="absolute -top-56 left-1/2 -translate-x-1/2 w-[920px] h-[520px] rounded-full pointer-events-none opacity-25 blur-[120px]"
          style={{
            background:
              'radial-gradient(circle, rgba(139, 92, 246, 0.35) 0%, rgba(56, 189, 248, 0.08) 55%, transparent 75%)',
          }}
        />
        <div className="relative z-10 w-full h-full">{children}</div>
      </div>
    </div>
  )
}
