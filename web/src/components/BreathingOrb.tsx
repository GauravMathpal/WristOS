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
    md: { container: 'w-44 h-44', orb: 'w-36 h-36', waveHeight: 'h-10', waveWidth: 'w-1.5' },
    lg: { container: 'w-60 h-60', orb: 'w-52 h-52', waveHeight: 'h-14', waveWidth: 'w-2' },
    xl: { container: 'w-72 h-72', orb: 'w-64 h-64', waveHeight: 'h-16', waveWidth: 'w-2.5' }
  }

  const currentSize = sizeMap[size]

  // Animation variants depending on assistant state
  const getOrbAnimation = (): TargetAndTransition => {
    switch (state) {
      case 'listening':
        return {
          scale: [1, 1.12, 0.98, 1.1],
          rotate: [0, 90, 180, 360],
          transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
        }
      case 'thinking':
        return {
          scale: [1, 1.06, 0.96, 1],
          rotate: [0, 360],
          transition: { repeat: Infinity, duration: 2, ease: 'linear' }
        }
      case 'speaking':
        return {
          scale: [1, 1.08, 1.02, 1.12, 1],
          transition: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' }
        }
      case 'idle':
      default:
        return {
          scale: [1, 1.05, 0.98, 1],
          transition: { repeat: Infinity, duration: 4.5, ease: 'easeInOut' }
        }
    }
  }

  const getAuraColor = () => {
    switch (state) {
      case 'listening':
        return 'from-purple-500/40 via-pink-500/40 to-cyan-400/40'
      case 'thinking':
        return 'from-indigo-500/40 via-purple-500/40 to-pink-500/40'
      case 'speaking':
        return 'from-pink-500/40 via-purple-500/40 to-violet-600/40'
      case 'idle':
      default:
        return 'from-purple-600/30 via-fuchsia-500/25 to-indigo-600/30'
    }
  }

  return (
    <div 
      className={`relative flex items-center justify-center cursor-pointer select-none ${currentSize.container} ${className}`}
      onClick={onClick}
    >
      {/* Outer diffuse pulsating aura */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.35, 0.65, 0.35]
        }}
        transition={{
          repeat: Infinity,
          duration: state === 'listening' ? 2 : 4,
          ease: 'easeInOut'
        }}
        className={`absolute inset-0 rounded-full bg-gradient-to-tr ${getAuraColor()} blur-2xl pointer-events-none`}
      />

      {/* Secondary rotating color field */}
      <motion.div
        animate={{
          rotate: [0, 360],
          scale: [0.95, 1.08, 0.95]
        }}
        transition={{
          rotate: { repeat: Infinity, duration: 14, ease: 'linear' },
          scale: { repeat: Infinity, duration: 5, ease: 'easeInOut' }
        }}
        className="absolute inset-2 rounded-full bg-gradient-to-r from-violet-600/30 via-pink-500/30 to-cyan-500/20 blur-xl pointer-events-none"
      />

      {/* Outer glowing ring ripple */}
      <motion.div
        animate={{
          scale: [0.9, 1.15, 0.9],
          opacity: [0.6, 0.2, 0.6]
        }}
        transition={{
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut'
        }}
        className="absolute inset-3 rounded-full border border-purple-400/30 pointer-events-none shadow-[0_0_20px_rgba(192,132,252,0.3)]"
      />

      {/* Main 3D Glossy Sphere */}
      <motion.div
        animate={getOrbAnimation()}
        className={`relative ${currentSize.orb} rounded-full overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.45)] border border-white/20`}
        style={{
          background: 'radial-gradient(circle at 35% 30%, #ec4899 0%, #9333ea 42%, #3b82f6 75%, #0f0a20 100%)'
        }}
      >
        {/* Specular sheen on top edge */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 42% 22%, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.15) 30%, transparent 60%)'
          }}
        />

        {/* Ambient bottom reflection */}
        <div 
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(147, 51, 234, 0.5) 0%, transparent 40%)'
          }}
        />

        {/* Central Audio Waveform / Frequency Bars */}
        <div className="absolute inset-0 flex items-center justify-center gap-1.5 z-10">
          {[0.4, 0.8, 1, 0.7, 0.45].map((multiplier, i) => {
            const isListening = state === 'listening'
            const isSpeaking = state === 'speaking'
            return (
              <motion.span
                key={i}
                animate={{
                  scaleY: isListening 
                    ? [0.3 * multiplier, 1.5 * multiplier, 0.2 * multiplier, 1.2 * multiplier] 
                    : isSpeaking
                    ? [0.5 * multiplier, 1.3 * multiplier, 0.6 * multiplier]
                    : [0.6 * multiplier, 1 * multiplier, 0.6 * multiplier],
                  opacity: [0.75, 1, 0.75]
                }}
                transition={{
                  repeat: Infinity,
                  duration: isListening ? 0.7 + i * 0.1 : 1.4 + i * 0.15,
                  ease: 'easeInOut',
                  delay: i * 0.1
                }}
                className={`${currentSize.waveWidth} ${currentSize.waveHeight} rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]`}
              />
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
