import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Timer, 
  Coffee, 
  Flame, 
  Watch, 
  CheckCircle2, 
  Clock, 
  TrendingUp
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'

type TimerMode = 'pomodoro' | 'short_break' | 'long_break' | 'deep_work' | 'stopwatch'

interface FocusSessionRecord {
  id: string
  title: string
  durationMinutes: number
  completedAt: string
}

export function FocusScreen() {
  const [mode, setMode] = useState<TimerMode>('pomodoro')
  const [totalSeconds, setTotalSeconds] = useState(25 * 60)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0)

  // Focus history
  const [sessionHistory, setSessionHistory] = useState<FocusSessionRecord[]>([
    { id: '1', title: 'Data Structures Revision', durationMinutes: 25, completedAt: '10:30 AM' },
    { id: '2', title: 'C Algorithm Debugging', durationMinutes: 45, completedAt: '2:15 PM' },
    { id: '3', title: 'System Architecture Notes', durationMinutes: 25, completedAt: '4:45 PM' }
  ])

  const intervalRef = useRef<number | null>(null)
  const { sendWatchAlert } = useAppStore()

  const modePresets: Record<Exclude<TimerMode, 'stopwatch'>, { name: string; minutes: number; icon: any }> = {
    pomodoro: { name: 'Pomodoro', minutes: 25, icon: Timer },
    short_break: { name: 'Short Break', minutes: 5, icon: Coffee },
    long_break: { name: 'Long Break', minutes: 15, icon: Coffee },
    deep_work: { name: 'Deep Work', minutes: 45, icon: Flame }
  }

  // Handle timer ticks
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        if (mode === 'stopwatch') {
          setStopwatchSeconds((prev) => prev + 1)
        } else {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              clearInterval(intervalRef.current!)
              setIsRunning(false)
              setIsCompleted(true)
              sendWatchAlert("Focus Session Complete! Take a break.")
              
              // Record history
              const duration = Math.round(totalSeconds / 60)
              setSessionHistory((h) => [
                {
                  id: String(Date.now()),
                  title: `${modePresets[mode as keyof typeof modePresets]?.name || 'Focus'} Session`,
                  durationMinutes: duration,
                  completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                },
                ...h
              ])
              return 0
            }
            return prev - 1
          })
        }
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, mode, totalSeconds, sendWatchAlert])

  const handleSelectMode = (newMode: TimerMode) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(false)
    setIsCompleted(false)
    setMode(newMode)

    if (newMode === 'stopwatch') {
      setStopwatchSeconds(0)
    } else {
      const secs = modePresets[newMode].minutes * 60
      setTotalSeconds(secs)
      setSecondsLeft(secs)
    }
  }

  const handleStartPause = () => {
    if (isCompleted) {
      const secs = modePresets[mode as keyof typeof modePresets]?.minutes * 60 || 25 * 60
      setTotalSeconds(secs)
      setSecondsLeft(secs)
      setIsCompleted(false)
      setIsRunning(true)
    } else {
      setIsRunning(!isRunning)
    }
  }

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(false)
    setIsCompleted(false)
    if (mode === 'stopwatch') {
      setStopwatchSeconds(0)
    } else {
      const secs = modePresets[mode as keyof typeof modePresets]?.minutes * 60 || 25 * 60
      setSecondsLeft(secs)
    }
  }

  // Circular calculations
  const size = 260
  const strokeWidth = 14
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  
  const displaySeconds = mode === 'stopwatch' ? stopwatchSeconds : secondsLeft
  const progress = mode === 'stopwatch' 
    ? (stopwatchSeconds % 60) / 60 
    : totalSeconds > 0 ? (totalSeconds - secondsLeft) / totalSeconds : 0
  const strokeDashoffset = circumference - (1 - progress) * circumference

  const minutes = Math.floor(displaySeconds / 60)
  const seconds = displaySeconds % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const totalFocusMinutesToday = sessionHistory.reduce((acc, s) => acc + s.durationMinutes, 0)

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-semibold">PRODUCTIVITY & FLOW</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Focus Session</h2>
          <p className="text-xs text-slate-400">
            Distraction-free deep work timer with automated PineTime haptic notifications
          </p>
        </div>

        {/* Mode Selector Pills */}
        <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto">
          {(Object.keys(modePresets) as (keyof typeof modePresets)[]).map((key) => {
            const isSelected = mode === key
            return (
              <button
                key={key}
                onClick={() => handleSelectMode(key)}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors shrink-0 ${
                  isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="focusModePill"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 shadow-md shadow-purple-600/30"
                  />
                )}
                <span className="relative z-10">{modePresets[key].name}</span>
              </button>
            )
          })}
          
          <button
            onClick={() => handleSelectMode('stopwatch')}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors shrink-0 ${
              mode === 'stopwatch' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {mode === 'stopwatch' && (
              <motion.div
                layoutId="focusModePill"
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 shadow-md shadow-purple-600/30"
              />
            )}
            <span className="relative z-10">Stopwatch</span>
          </button>
        </div>
      </div>

      {/* Main Focus Center Card */}
      <div className="p-8 sm:p-12 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-white/[0.01] backdrop-blur-2xl flex flex-col items-center justify-center space-y-7 shadow-2xl relative overflow-hidden">
        
        {/* Ambient breathing glow when active */}
        {isRunning && (
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.25, 0.5, 0.25]
            }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-purple-600/35 via-pink-600/35 to-cyan-500/25 blur-3xl pointer-events-none"
          />
        )}

        {/* Large Circular Timer */}
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="rotate-[-90deg]">
            <defs>
              <linearGradient id="focusMainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>

            {/* Track background */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="var(--ring-track, rgba(255, 255, 255, 0.07))"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            {/* Animated stroke */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#focusMainGrad)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: 'linear' }}
            />
          </svg>

          {/* Center countdown numbers */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-mono uppercase tracking-widest text-purple-400 font-semibold mb-1">
              {mode === 'stopwatch' ? 'ELAPSED' : isRunning ? 'FOCUS TIME' : 'READY'}
            </span>

            <motion.div 
              key={formattedTime}
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              className="text-5xl font-black tracking-tight text-white font-mono"
            >
              {formattedTime}
            </motion.div>

            <span className="text-xs text-slate-400 mt-2 font-medium">
              {isCompleted ? 'Goal reached!' : isRunning ? 'Stay in your zone' : 'Press start to begin'}
            </span>
          </div>
        </div>

        {/* Action Controls (Start / Pause / Reset) */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={handleStartPause}
            className={`flex items-center gap-2.5 px-7 py-3 rounded-2xl text-xs font-bold transition-all shadow-xl ${
              isRunning
                ? 'bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/[0.1]'
                : 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-purple-500/30'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Session</span>
              </>
            ) : isCompleted ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>Restart Session</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Start Focus</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={handleReset}
            className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.06] transition-all"
            title="Reset Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={() => sendWatchAlert("Focus checkpoint: 15m done")}
            className="p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-pink-300 border border-white/[0.06] transition-all"
            title="Test PineTime Wrist Haptic"
          >
            <Watch className="w-4 h-4" />
          </motion.button>
        </div>

        <AnimatePresence>
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Session complete! PineTime wrist vibration dispatched.</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Two Column Layout: Metrics & Session History */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Metric Card 1: Total Focus */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl flex flex-col justify-between space-y-3"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Focus Today</span>
          <div className="text-3xl font-extrabold text-white font-mono">
            {totalFocusMinutesToday} <span className="text-xs font-sans text-slate-400 font-normal">MIN</span>
          </div>
          <div className="text-[11px] text-purple-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+35 min over daily target</span>
          </div>
        </motion.div>

        {/* Metric Card 2: Completed Sessions */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl flex flex-col justify-between space-y-3"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Completed Sessions</span>
          <div className="text-3xl font-extrabold text-white font-mono">
            {sessionHistory.length} <span className="text-xs font-sans text-slate-400 font-normal">STREAK</span>
          </div>
          <div className="text-[11px] text-pink-400 flex items-center gap-1">
            <Flame className="w-3 h-3" />
            <span>Optimal Pomodoro cadence</span>
          </div>
        </motion.div>

        {/* Metric Card 3: Watch Haptics */}
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl flex flex-col justify-between space-y-3"
        >
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">PineTime Integration</span>
          <div className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>GATT ANS 0x1811 Active</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Automated tactile pulses signal breaks without phone interaction
          </div>
        </motion.div>
      </div>

      {/* Focus Session Log */}
      <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-white">Today's Focus Log</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{sessionHistory.length} sessions logged</span>
        </div>

        <div className="space-y-2">
          {sessionHistory.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
                <span className="text-xs font-semibold text-slate-200">{s.title}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <span className="text-purple-300 font-bold">{s.durationMinutes}m</span>
                <span className="text-slate-600">•</span>
                <span>{s.completedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
