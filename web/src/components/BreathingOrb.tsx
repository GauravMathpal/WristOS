import { motion, TargetAndTransition } from 'motion/react'

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

  // Dynamic animation variants based on state
  const getOrbAnimation = (): TargetAndTransition => {
    switch (state) {
      case 'listening':
        return {
          scale: [1, 1.15, 0.95, 1.12, 1],
          rotate: [0, 90, 180, 270, 360],
          transition: { repeat: Infinity, duration: 3.2, ease: 'easeInOut' }
        }
      case 'thinking':
        return {
          scale: [1, 1.08, 0.96, 1],
          rotate: [0, 360],
          transition: { repeat: Infinity, duration: 2, ease: 'linear' }
        }
      case 'speaking':
        return {
          scale: [1, 1.12, 1.02, 1.15, 1],
          transition: { repeat: Infinity, duration: 1.6, ease: 'easeInOut' }
        }
      case 'idle':
      default:
        return {
          scale: [1, 1.06, 0.97, 1],
          transition: { repeat: Infinity, duration: 4.5, ease: 'easeInOut' }
        }
    }
  }

  return (
    <div 
      className={`relative flex items-center justify-center cursor-pointer select-none ${currentSize.container} ${className}`}
      onClick={onClick}
    >
      {/* 1. Deep Radiant Atmospheric Aura */}
      <motion.div
        animate={{
          scale: [1, 1.35, 1],
          opacity: [0.55, 0.85, 0.55]
        }}
        transition={{
          repeat: Infinity,
          duration: state === 'listening' ? 2 : 4,
          ease: 'easeInOut'
        }}
        className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-600/50 via-pink-600/50 to-cyan-400/40 blur-3xl pointer-events-none"
      />

      {/* 2. Secondary Chromatic Orbit Field */}
      <motion.div
        animate={{
          rotate: [0, 360],
          scale: [0.92, 1.12, 0.92]
        }}
        transition={{
          rotate: { repeat: Infinity, duration: 12, ease: 'linear' },
          scale: { repeat: Infinity, duration: 4.8, ease: 'easeInOut' }
        }}
        className="absolute inset-2 rounded-full bg-gradient-to-r from-violet-600/45 via-fuchsia-500/40 to-cyan-400/35 blur-xl pointer-events-none"
      />

      {/* 3. Outer Neon Ripple Shockwave */}
      <motion.div
        animate={{
          scale: [0.88, 1.2, 0.88],
          opacity: [0.8, 0.25, 0.8]
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut'
        }}
        className="absolute inset-3 rounded-full border-2 border-pink-400/40 pointer-events-none shadow-[0_0_30px_rgba(236,72,153,0.5)]"
      />

      {/* 4. Concentric Luminous Ring */}
      <motion.div
        animate={{
          scale: [1.1, 0.95, 1.1],
          rotate: [0, -360]
        }}
        transition={{
          scale: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
          rotate: { repeat: Infinity, duration: 16, ease: 'linear' }
        }}
        className="absolute inset-6 rounded-full border border-cyan-400/35 pointer-events-none shadow-[0_0_20px_rgba(6,182,212,0.4)]"
      />

      {/* 5. Main 3D Glossy Holographic Sphere */}
      <motion.div
        animate={getOrbAnimation()}
        className={`relative ${currentSize.orb} rounded-full overflow-hidden shadow-[0_0_50px_rgba(236,72,153,0.65),0_0_100px_rgba(168,85,247,0.4)] border-2 border-white/30`}
        style={{
          background: 'radial-gradient(circle at 35% 25%, #f472b6 0%, #ec4899 22%, #a855f7 48%, #4f46e5 78%, #0d0620 100%)'
        }}
      >
        {/* Specular high-gloss sheen reflection */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 38% 18%, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.25) 30%, transparent 60%)'
          }}
        />

        {/* Dynamic Inner Swirling Light Ribbon */}
        <motion.div
          animate={{
            rotate: [0, 360],
            opacity: [0.6, 0.9, 0.6]
          }}
          transition={{
            rotate: { repeat: Infinity, duration: 8, ease: 'linear' },
            opacity: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
          }}
          className="absolute inset-2 rounded-full pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0%, rgba(236, 72, 153, 0.6) 25%, rgba(6, 182, 212, 0.5) 50%, rgba(168, 85, 247, 0.6) 75%, transparent 100%)',
            filter: 'blur(4px)'
          }}
        />

        {/* Radiant Ambient Core Bottom Glow */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(168, 85, 247, 0.7) 0%, transparent 45%)'
          }}
        />

        {/* Central Audio Waveform Bars (Vibrant White & Pink) */}
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 z-10">
          {[0.4, 0.8, 1, 0.7, 0.45].map((multiplier, i) => {
            const isListening = state === 'listening'
            const isSpeaking = state === 'speaking'
            return (
              <motion.span
                key={i}
                animate={{
                  scaleY: isListening 
                    ? [0.3 * multiplier, 1.6 * multiplier, 0.2 * multiplier, 1.3 * multiplier] 
                    : isSpeaking
                    ? [0.5 * multiplier, 1.4 * multiplier, 0.6 * multiplier]
                    : [0.6 * multiplier, 1.1 * multiplier, 0.6 * multiplier],
                  opacity: [0.85, 1, 0.85]
                }}
                transition={{
                  repeat: Infinity,
                  duration: isListening ? 0.6 + i * 0.08 : 1.3 + i * 0.12,
                  ease: 'easeInOut',
                  delay: i * 0.08
                }}
                className={`${currentSize.waveWidth} ${currentSize.waveHeight} rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,1),0_0_15px_rgba(236,72,153,0.8)]`}
              />
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
