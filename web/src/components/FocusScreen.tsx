import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
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
  Trash2
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import { focusRepository } from '../lib/repository'

type TimerMode = 'pomodoro' | 'short_break' | 'long_break' | 'deep_work' | 'stopwatch'

export function FocusScreen() {
  const [mode, setMode] = useState<TimerMode>('pomodoro')
  const [totalSeconds, setTotalSeconds] = useState(25 * 60)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0)

  // Focus history from Dexie local database with live reactive updates
  const sessionHistory = useLiveQuery(() => focusRepository.getAllActive()) || []

  const intervalRef = useRef<number | null>(null)
  const { sendWatchAlert } = useAppStore()

  const modePresets: Record<Exclude<TimerMode, 'stopwatch'>, { name: string; minutes: number; icon: any; color: string }> = {
    pomodoro: { name: 'Pomodoro', minutes: 25, icon: Timer, color: 'from-purple-500 to-pink-500' },
    short_break: { name: 'Short Break', minutes: 5, icon: Coffee, color: 'from-cyan-500 to-blue-500' },
    long_break: { name: 'Long Break', minutes: 15, icon: Coffee, color: 'from-indigo-500 to-purple-500' },
    deep_work: { name: 'Deep Work', minutes: 45, icon: Flame, color: 'from-amber-500 to-rose-500' }
  }

  const playCompletionChime = () => {
    try {
      // @ts-expect-error Web Audio API compatibility
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(587.33, ctx.currentTime) // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3) // A5
      gain.gain.setValueAtTime(0.35, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.8)
    } catch {
      // Web Audio policy
    }
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
              playCompletionChime()
              sendWatchAlert("Focus Session Complete! Take a break.")
              
              // Record history to Dexie local database and trigger sync
              const duration = Math.round(totalSeconds / 60)
              focusRepository.add(
                `${modePresets[mode as keyof typeof modePresets]?.name || 'Focus'} Session`,
                duration,
                mode
              )
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-purple-500/25 bg-gradient-to-r from-[#1c123b]/85 via-[#140e2b]/80 to-[#0e0820]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-pink-400" />
              <span>PRODUCTIVITY & FLOW</span>
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            Focus Session
          </h2>
          <p className="text-xs text-purple-200/80 font-medium">
            Distraction-free deep work timer with automated PineTime haptic notifications
          </p>
        </div>

        {/* Mode Selector Pills */}
        <div className="flex items-center p-1.5 rounded-2xl bg-[#0d091d]/80 border border-purple-500/25 shadow-inner overflow-x-auto">
          {(Object.keys(modePresets) as (keyof typeof modePresets)[]).map((key) => {
            const isSelected = mode === key
            return (
              <button
                key={key}
                onClick={() => handleSelectMode(key)}
                className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors shrink-0 ${
                  isSelected ? 'text-white' : 'text-slate-400 hover:text-purple-200'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="focusModePill"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 shadow-md shadow-pink-600/30"
                  />
                )}
                <span className="relative z-10">{modePresets[key].name}</span>
              </button>
            )
          })}
          
          <button
            onClick={() => handleSelectMode('stopwatch')}
            className={`relative px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors shrink-0 ${
              mode === 'stopwatch' ? 'text-white' : 'text-slate-400 hover:text-purple-200'
            }`}
          >
            {mode === 'stopwatch' && (
              <motion.div
                layoutId="focusModePill"
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 shadow-md shadow-pink-600/30"
              />
            )}
            <span className="relative z-10">Stopwatch</span>
          </button>
        </div>
      </div>

      {/* Main Focus Center Card */}
      <div className="p-8 sm:p-12 rounded-3xl border border-purple-500/30 bg-gradient-to-b from-[#221345]/90 via-[#150d2c]/85 to-[#0b071a]/95 backdrop-blur-2xl shadow-2xl shadow-purple-950/40 flex flex-col items-center justify-center space-y-7 relative overflow-hidden">
        
        {/* Ambient breathing glow when active */}
        {isRunning && (
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.55, 0.3]
            }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-purple-600/40 via-pink-600/40 to-cyan-500/30 blur-3xl pointer-events-none"
          />
        )}

        {/* Large Circular Timer */}
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="rotate-[-90deg]">
            <defs>
              <linearGradient id="focusMainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="35%" stopColor="#a855f7" />
                <stop offset="70%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
              <filter id="focusGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Track background */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.08)"
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
              filter="url(#focusGlow)"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: 'linear' }}
            />
          </svg>

          {/* Center countdown numbers */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-mono uppercase tracking-widest text-purple-400 font-bold mb-1">
              {mode === 'stopwatch' ? 'ELAPSED' : isRunning ? 'FOCUS TIME' : 'READY'}
            </span>

            <motion.div 
              key={formattedTime}
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              className="text-5xl font-black tracking-tight text-white font-mono drop-shadow-[0_2px_15px_rgba(236,72,153,0.5)]"
            >
              {formattedTime}
            </motion.div>

            <span className="text-xs text-purple-300/80 mt-2 font-medium">
              {isCompleted ? 'Goal reached! Great job.' : isRunning ? 'Stay in your zone' : 'Press start to begin'}
            </span>
          </div>
        </div>

        {/* Action Controls (Start / Pause / Reset) */}
        <div className="flex items-center gap-3 relative z-10">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={handleStartPause}
            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-xl ${
              isRunning
                ? 'bg-[#181133] hover:bg-[#201744] text-white border border-purple-500/40 shadow-purple-950/40'
                : 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-pink-500/35'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>{isCompleted ? 'Start Again' : 'Start Focus'}</span>
              </>
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-[#140e29] hover:bg-[#1c133a] text-purple-300 border border-purple-500/30 transition-all shadow-md"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Focus stats overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-md pt-2 border-t border-purple-500/20">
          <div className="p-3 rounded-2xl bg-[#140e29]/70 border border-purple-500/20 text-center">
            <span className="text-[10px] font-mono text-purple-400 uppercase font-semibold">Today's Focus</span>
            <p className="text-lg font-bold font-mono text-white mt-0.5">{totalFocusMinutesToday} <span className="text-[10px] font-sans">min</span></p>
          </div>
          <div className="p-3 rounded-2xl bg-[#140e29]/70 border border-purple-500/20 text-center">
            <span className="text-[10px] font-mono text-pink-400 uppercase font-semibold">Sessions</span>
            <p className="text-lg font-bold font-mono text-white mt-0.5">{sessionHistory.length}</p>
          </div>
          <div className="p-3 rounded-2xl bg-[#140e29]/70 border border-purple-500/20 text-center col-span-2 sm:col-span-1">
            <span className="text-[10px] font-mono text-cyan-400 uppercase font-semibold">Watch Sync</span>
            <p className="text-xs font-bold text-emerald-400 mt-1 flex items-center justify-center gap-1">
              <Watch className="w-3 h-3" />
              <span>Haptics Active</span>
            </p>
          </div>
        </div>
      </div>

      {/* Focus Session History */}
      <div className="p-6 rounded-3xl border border-purple-500/25 bg-gradient-to-b from-[#1b1236]/85 via-[#130d29]/80 to-[#0b081d]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center shadow-[0_0_12px_rgba(168,85,247,0.4)]">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-white tracking-tight">Recent Focus History</h3>
              <p className="text-[11px] text-purple-300/80 font-medium">Logged locally with cloud sync</p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-pink-400">
            {sessionHistory.length} recorded
          </span>
        </div>

        {sessionHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-purple-300/60 font-medium">
            No completed focus sessions today yet. Start a session above!
          </div>
        ) : (
          <div className="space-y-2">
            {sessionHistory.slice(0, 5).map((session) => (
              <motion.div
                key={session.id}
                whileHover={{ x: 3 }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-[#140e29]/80 border border-purple-500/15 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{session.title}</h4>
                    <span className="text-[10px] text-purple-300/70 font-mono">
                      {new Date(session.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    +{session.durationMinutes} min
                  </span>
                  <button
                    onClick={() => focusRepository.delete(session.id)}
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete session log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
