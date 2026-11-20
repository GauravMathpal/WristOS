import { motion } from 'motion/react'
import { useMemo } from 'react'

interface BreathingOrbProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  state?: 'idle' | 'listening' | 'speaking' | 'thinking'
  className?: string
  onClick?: () => void
}

export function BreathingOrb({ 
  size = 'md', 
  state = 'idle', 
  className = '',
  onClick 
}: BreathingOrbProps) {
  const sizeMap = {
    sm: { container: 'w-24 h-24', orb: 'w-20 h-20', waveHeight: 'h-6', waveWidth: 'w-1' },
    md: { container: 'w-48 h-48', orb: 'w-40 h-40', waveHeight: 'h-11', waveWidth: 'w-1.5' },
    lg: { container: 'w-64 h-64', orb: 'w-56 h-56', waveHeight: 'h-14', waveWidth: 'w-2' },
    xl: { container: 'w-80 h-80', orb: 'w-72 h-72', waveHeight: 'h-18', waveWidth: 'w-2.5' }
  }

  const currentSize = sizeMap[size]

  // Smooth, jitter-free animation profiles using GPU transforms only
  const orbScaleConfig = useMemo(() => {
    switch (state) {
      case 'listening':
        return {
          scale: [1, 1.12, 0.98, 1.1, 1],
          duration: 2.8
        }
      case 'thinking':
        return {
          scale: [1, 1.06, 0.97, 1],
          duration: 1.8
        }
      case 'speaking':
        return {
          scale: [1, 1.09, 1.01, 1.1, 1],
          duration: 1.6
        }
      case 'idle':
      default:
        return {
          scale: [1, 1.05, 0.98, 1],
          duration: 4.2
        }
    }
  }, [state])

  return (
    <div 
      className={`relative flex items-center justify-center cursor-pointer select-none ${currentSize.container} ${className}`}
      onClick={onClick}
      style={{
        isolation: 'isolate',
        transform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden'
      }}
    >
      {/* 1. Deep Radiant Atmospheric Aura (GPU Opacity + Subtle Scale - No subpixel jitter) */}
      <motion.div
        animate={{
          scale: [0.95, 1.18, 0.95],
          opacity: [0.45, 0.75, 0.45]
        }}
        transition={{
          repeat: Infinity,
          duration: state === 'listening' ? 2 : 4,
          ease: 'easeInOut'
        }}
        style={{
          willChange: 'transform, opacity',
          transform: 'translate3d(0, 0, 0)'
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600/40 via-pink-600/45 to-cyan-400/35 blur-2xl pointer-events-none"
      />

      {/* 2. Secondary Chromatic Orbit Field */}
      <motion.div
        animate={{
          rotate: [0, 360],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          rotate: { repeat: Infinity, duration: 16, ease: 'linear' },
          opacity: { repeat: Infinity, duration: 4, ease: 'easeInOut' }
        }}
        style={{
          willChange: 'transform, opacity',
          transform: 'translate3d(0, 0, 0)'
        }}
        className="absolute inset-3 rounded-full bg-gradient-to-r from-violet-600/35 via-fuchsia-500/30 to-cyan-400/25 blur-lg pointer-events-none"
      />

      {/* 3. Outer Neon Ripple Pulse (Smooth opacity without border clipping) */}
      <motion.div
        animate={{
          scale: [0.92, 1.15, 0.92],
          opacity: [0.65, 0.2, 0.65]
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut'
        }}
        style={{
          willChange: 'transform, opacity',
          transform: 'translate3d(0, 0, 0)'
        }}
        className="absolute inset-3 rounded-full border border-pink-400/40 pointer-events-none shadow-[0_0_25px_rgba(236,72,153,0.4)]"
      />

      {/* 4. Concentric Luminous Halo Ring */}
      <motion.div
        animate={{
          rotate: [0, -360],
          opacity: [0.4, 0.75, 0.4]
        }}
        transition={{
          rotate: { repeat: Infinity, duration: 20, ease: 'linear' },
          opacity: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' }
        }}
        style={{
          willChange: 'transform, opacity',
          transform: 'translate3d(0, 0, 0)'
        }}
        className="absolute inset-6 rounded-full border border-cyan-400/30 pointer-events-none shadow-[0_0_18px_rgba(6,182,212,0.35)]"
      />

      {/* 5. Main 3D Glossy Holographic Sphere */}
      <motion.div
        key={state}
        initial={{ scale: 1 }}
        animate={{
          scale: orbScaleConfig.scale
        }}
        transition={{
          repeat: Infinity,
          duration: orbScaleConfig.duration,
          ease: 'easeInOut'
        }}
        className={`relative ${currentSize.orb} rounded-full shadow-[0_0_40px_rgba(236,72,153,0.6),0_0_80px_rgba(168,85,247,0.35)] border border-white/40 flex items-center justify-center`}
        style={{
          background: 'radial-gradient(circle at 35% 25%, #f472b6 0%, #ec4899 24%, #a855f7 50%, #4f46e5 78%, #0d0620 100%)',
          willChange: 'transform',
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden'
        }}
      >
        {/* Specular high-gloss sheen reflection (Static, smooth light source) */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 38% 18%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.2) 32%, transparent 60%)'
          }}
        />

        {/* Dynamic Inner Swirling Light Core */}
        <motion.div
          animate={{
            rotate: [0, 360],
            opacity: [0.55, 0.85, 0.55]
          }}
          transition={{
            rotate: { repeat: Infinity, duration: 10, ease: 'linear' },
            opacity: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' }
          }}
          className="absolute inset-2 rounded-full pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(236, 72, 153, 0.5) 25%, rgba(6, 182, 212, 0.4) 50%, rgba(168, 85, 247, 0.5) 75%, transparent 100%)',
            willChange: 'transform, opacity',
            transform: 'translate3d(0, 0, 0)'
          }}
        />

        {/* Ambient Core Bottom Glow */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(168, 85, 247, 0.6) 0%, transparent 45%)'
          }}
        />

        {/* Central Audio Waveform Bars (Smooth GPU transforms without layout thrashing) */}
        <div 
          className="absolute inset-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none"
          style={{ transform: 'translate3d(0, 0, 0)' }}
        >
          {[0.4, 0.8, 1, 0.7, 0.45].map((multiplier, i) => {
            const isListening = state === 'listening'
            const isSpeaking = state === 'speaking'
            return (
              <motion.span
                key={i}
                animate={{
                  scaleY: isListening 
                    ? [0.35 * multiplier, 1.45 * multiplier, 0.25 * multiplier, 1.25 * multiplier] 
                    : isSpeaking
                    ? [0.45 * multiplier, 1.35 * multiplier, 0.55 * multiplier]
                    : [0.65 * multiplier, 1.05 * multiplier, 0.65 * multiplier],
                  opacity: [0.85, 1, 0.85]
                }}
                transition={{
                  repeat: Infinity,
                  duration: isListening ? 0.7 + i * 0.08 : 1.4 + i * 0.1,
                  ease: 'easeInOut',
                  delay: i * 0.07
                }}
                style={{
                  transformOrigin: '50% 50%',
                  willChange: 'transform',
                  transform: 'translate3d(0, 0, 0)'
                }}
                className={`${currentSize.waveWidth} ${currentSize.waveHeight} rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9),0_0_12px_rgba(236,72,153,0.7)]`}
              />
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
