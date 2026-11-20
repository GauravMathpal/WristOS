import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Play, Pause, RotateCcw, Timer } from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'

interface FocusTimerProps {
  defaultDurationMinutes?: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function FocusTimer({
  defaultDurationMinutes = 25,
  size = 230,
  strokeWidth = 14,
  className = ''
}: FocusTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(defaultDurationMinutes * 60)
  const [secondsLeft, setSecondsLeft] = useState(defaultDurationMinutes * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const intervalRef = useRef<number | null>(null)

  const { sendWatchAlert } = useAppStore()

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            setIsRunning(false)
            setIsCompleted(true)
            sendWatchAlert("Focus Session Complete! Take a break.")
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, sendWatchAlert])

  const handleStartPause = () => {
    if (isCompleted) {
      resetTimer(totalSeconds / 60)
      setIsRunning(true)
    } else {
      setIsRunning(!isRunning)
    }
  }

  const resetTimer = (mins: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(false)
    setIsCompleted(false)
    const secs = mins * 60
    setTotalSeconds(secs)
    setSecondsLeft(secs)
  }

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0
  const strokeDashoffset = circumference - (1 - progress) * circumference

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Circular Progress Ring */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        {/* Soft breathing background glow when active */}
        {isRunning && (
          <motion.div
            animate={{
              scale: [1, 1.12, 1],
              opacity: [0.35, 0.6, 0.35]
            }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="absolute inset-2 rounded-full bg-gradient-to-tr from-purple-600/40 via-pink-600/40 to-cyan-500/30 blur-2xl pointer-events-none"
          />
        )}

        <svg width={size} height={size} className="rotate-[-90deg]">
          <defs>
            <linearGradient id="focusTimerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="40%" stopColor="#a855f7" />
              <stop offset="75%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <filter id="timerRingGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Active Countdown Stroke */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#focusTimerGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            filter="url(#timerRingGlow)"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'linear' }}
          />
        </svg>

        {/* Center Countdown Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500/25 to-pink-500/25 border border-purple-400/40 flex items-center justify-center text-pink-300 mb-1 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
            <Timer className="w-4 h-4" />
          </div>

          <motion.div 
            key={formattedTime}
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            className="text-4xl font-black tracking-tight text-white font-mono drop-shadow-[0_2px_12px_rgba(236,72,153,0.5)]"
          >
            {formattedTime}
          </motion.div>

          <span className="text-[11px] font-bold text-purple-300 tracking-wider uppercase mt-1">
            {isCompleted ? 'Completed!' : isRunning ? 'In Deep Focus' : 'Ready'}
          </span>
        </div>
      </div>

      {/* Preset Pill Buttons */}
      <div className="flex items-center gap-2 mt-5">
        {[15, 25, 45].map((mins) => (
          <motion.button
            key={mins}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => resetTimer(mins)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              totalSeconds === mins * 60 && !isRunning
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-pink-500/30'
                : 'bg-[#140e29] text-purple-300 hover:text-white border border-purple-500/25'
            }`}
          >
            {mins}m
          </motion.button>
        ))}
      </div>

      {/* Play / Reset Controls */}
      <div className="flex items-center gap-3 mt-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleStartPause}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
            isRunning
              ? 'bg-[#181133] hover:bg-[#201744] text-white border border-purple-500/40 shadow-purple-950/40'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-pink-500/30'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isCompleted ? 'Restart' : 'Start'}</span>
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => resetTimer(totalSeconds / 60)}
          className="p-2.5 rounded-xl bg-[#140e29] hover:bg-[#1c133a] text-purple-300 border border-purple-500/25 transition-all shadow-md"
          title="Reset timer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
  )
}
