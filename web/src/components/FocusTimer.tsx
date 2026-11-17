import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Play, Pause, RotateCcw, Timer, CheckCircle2 } from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'

interface FocusTimerProps {
  defaultDurationMinutes?: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function FocusTimer({
  defaultDurationMinutes = 25,
  size = 220,
  strokeWidth = 12,
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
              scale: [1, 1.08, 1],
              opacity: [0.3, 0.55, 0.3]
            }}
            transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
            className="absolute inset-4 rounded-full bg-gradient-to-tr from-purple-600/35 to-pink-500/35 blur-2xl pointer-events-none"
          />
        )}

        <svg width={size} height={size} className="rotate-[-90deg]">
          <defs>
            <linearGradient id="focusTimerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
          </defs>

          {/* Background track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.06)"
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
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.5, ease: 'linear' }}
          />
        </svg>

        {/* Center Countdown Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-1">
            <Timer className="w-4 h-4" />
          </div>

          <motion.div 
            key={formattedTime}
            initial={{ scale: 0.96 }}
            animate={{ scale: 1 }}
            className="text-4xl font-extrabold tracking-tight text-white font-mono"
          >
            {formattedTime}
          </motion.div>

          <span className="text-[11px] font-medium text-slate-400 tracking-wider uppercase mt-1">
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
            className={`px-3 py-1 rounded-xl text-xs font-mono font-medium transition-all ${
              totalSeconds === mins * 60 && !isRunning
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]'
            }`}
          >
            {mins}m
          </motion.button>
        ))}
      </div>

      {/* Primary Control Buttons */}
      <div className="flex items-center gap-3 mt-4">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 450, damping: 20 }}
          onClick={handleStartPause}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-lg ${
            isRunning
              ? 'bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.1]'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-purple-500/25'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5" />
              <span>Pause Session</span>
            </>
          ) : isCompleted ? (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Focus</span>
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 450, damping: 20 }}
          onClick={() => resetTimer(totalSeconds / 60)}
          className="p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.06]"
          title="Reset Timer"
        >
          <RotateCcw className="w-4 h-4" />
        </motion.button>
      </div>

      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 mt-3 text-xs text-emerald-400 font-medium"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Watch vibration alert dispatched!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
