import React, { useCallback, useEffect, useRef, useState } from 'react'
import { SLIDES } from './slides/slidesData'
import { SlideStage } from './components/SlideStage'
import { ProgressBar } from './components/ProgressBar'
import { ControlsHud } from './components/ControlsHud'
import { SlideOverviewModal } from './components/SlideOverviewModal'
import { Slide01Cover } from './slides/Slide01Cover'
import { Slide02Hook } from './slides/Slide02Hook'
import { Slide03SurveyGap } from './slides/Slide03SurveyGap'
import { Slide04VisionReveal } from './slides/Slide04VisionReveal'
import { Slide05Market } from './slides/Slide05Market'
import { Slide06Positioning } from './slides/Slide06Positioning'
import { Slide07WatchOS } from './slides/Slide07WatchOS'
import { Slide08FocusTasks } from './slides/Slide08FocusTasks'
import { Slide09AIMemory } from './slides/Slide09AIMemory'
import { Slide10EcosystemBLE } from './slides/Slide10EcosystemBLE'
import { Slide11SafetyStatus } from './slides/Slide11SafetyStatus'
import { Slide12Conclusion } from './slides/Slide12Conclusion'

const SLIDE_COMPONENTS = [
  Slide01Cover,
  Slide02Hook,
  Slide03SurveyGap,
  Slide04VisionReveal,
  Slide05Market,
  Slide06Positioning,
  Slide07WatchOS,
  Slide08FocusTasks,
  Slide09AIMemory,
  Slide10EcosystemBLE,
  Slide11SafetyStatus,
  Slide12Conclusion,
]

export function App() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showOverview, setShowOverview] = useState(false)
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)

  const total = SLIDES.length

  useEffect(() => {
    const syncFromHash = () => {
      const raw = window.location.hash.replace('#', '').replace('slide-', '')
      const num = parseInt(raw, 10)
      if (!Number.isNaN(num) && num >= 1 && num <= total) {
        setCurrentSlide(num - 1)
      }
    }
    syncFromHash()
    window.addEventListener('hashchange', syncFromHash)
    return () => window.removeEventListener('hashchange', syncFromHash)
  }, [total])

  const goToSlide = useCallback(
    (index: number) => {
      if (index < 0 || index >= total) return
      setCurrentSlide(index)
      window.history.replaceState(null, '', `#slide-${index + 1}`)
    },
    [total]
  )

  const nextSlide = useCallback(() => {
    goToSlide(currentSlide + 1)
  }, [currentSlide, goToSlide])

  const prevSlide = useCallback(() => {
    goToSlide(currentSlide - 1)
  }, [currentSlide, goToSlide])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  useEffect(() => {
    if (!isPlaying) return
    const sec = SLIDES[currentSlide]?.durationSeconds ?? 25
    const timer = setTimeout(() => {
      if (currentSlide < total - 1) {
        nextSlide()
      } else {
        setIsPlaying(false)
      }
    }, sec * 1000)
    return () => clearTimeout(timer)
  }, [isPlaying, currentSlide, total, nextSlide])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault()
          nextSlide()
          break
        case 'ArrowLeft':
          e.preventDefault()
          prevSlide()
          break
        case 'Home':
          e.preventDefault()
          goToSlide(0)
          break
        case 'End':
          e.preventDefault()
          goToSlide(total - 1)
          break
        case 'f':
        case 'F':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'p':
        case 'P':
          e.preventDefault()
          setIsPlaying((v) => !v)
          break
        case 'g':
        case 'G':
          e.preventDefault()
          setShowOverview((v) => !v)
          break
        case 'Escape':
          if (showOverview) setShowOverview(false)
          else if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
          break
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [nextSlide, prevSlide, goToSlide, total, toggleFullscreen, showOverview])

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now(),
      }
    }
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y
    const dt = Date.now() - touchStartRef.current.time
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 650) {
      if (dx < 0) nextSlide()
      else prevSlide()
    }
    touchStartRef.current = null
  }

  return (
    <div
      className="w-screen h-screen bg-[#020205] relative overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <SlideStage>
        {SLIDE_COMPONENTS.map((SlideComponent, idx) => {
          const isActive = idx === currentSlide
          return (
            <div
              key={SLIDES[idx].id}
              className={`md:absolute md:inset-0 transition-all duration-400 ${
                isActive
                  ? 'block opacity-100 scale-100 z-10 pointer-events-auto'
                  : 'hidden md:block opacity-0 scale-[0.985] z-0 pointer-events-none'
              }`}
              aria-hidden={!isActive}
            >
              <SlideComponent isActive={isActive} />
            </div>
          )
        })}
      </SlideStage>

      <ProgressBar current={currentSlide} total={total} onSelectSlide={goToSlide} />

      <ControlsHud
        current={currentSlide}
        total={total}
        isPlaying={isPlaying}
        isFullscreen={isFullscreen}
        onPrev={prevSlide}
        onNext={nextSlide}
        onToggleAutoplay={() => setIsPlaying((v) => !v)}
        onToggleFullscreen={toggleFullscreen}
        onToggleOverview={() => setShowOverview((v) => !v)}
      />

      <SlideOverviewModal
        open={showOverview}
        current={currentSlide}
        onSelect={goToSlide}
        onClose={() => setShowOverview(false)}
      />
    </div>
  )
}

export default App
