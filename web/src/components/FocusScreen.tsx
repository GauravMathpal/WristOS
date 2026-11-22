import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Timer, 
  Coffee, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Trash2,
  ChevronLeft,
  MoreHorizontal,
  Flag,
  Sparkles,
  Sliders,
  Send,
  X
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import { focusRepository } from '../lib/repository'

type TimerMode = 'pomodoro' | 'short_break' | 'long_break' | 'deep_work' | 'stopwatch' | 'custom'

interface LapRecord {
  lapNumber: number
  timeSeconds: number
  splitSeconds: number
}

export function FocusScreen() {
  const { setActiveTab, sendWatchAlert } = useAppStore()
  const [mode, setMode] = useState<TimerMode>('pomodoro')
  const [totalSeconds, setTotalSeconds] = useState(25 * 60)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [stopwatchSeconds, setStopwatchSeconds] = useState(0)
  const [laps, setLaps] = useState<LapRecord[]>([])

  // Custom Duration State
  const [customMinutes, setCustomMinutes] = useState(30)
  const [showCustomModal, setShowCustomModal] = useState(false)
  
  // Daily Goal & Session Tag
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(120)
  const [sessionTag, setSessionTag] = useState('#General')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Focus history from Dexie local database with live reactive updates
  const sessionHistory = useLiveQuery(() => focusRepository.getAllActive()) || []
  const intervalRef = useRef<number | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const modePresets: Record<Exclude<TimerMode, 'stopwatch' | 'custom'>, { name: string; minutes: number; icon: any; color: string }> = {
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
      // Audio policy
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
              sendWatchAlert("Focus Complete • WristOS Break Time")
              showToast("Focus block complete! Great work.")
              
              // Record history to Dexie
              const duration = Math.round(totalSeconds / 60)
              focusRepository.add(
                `${sessionTag} Focus Session`,
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
  }, [isRunning, mode, totalSeconds, sessionTag, sendWatchAlert])

  const handleSelectMode = (newMode: TimerMode) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(false)
    setIsCompleted(false)
    setMode(newMode)

    if (newMode === 'stopwatch') {
      setStopwatchSeconds(0)
      setLaps([])
    } else if (newMode === 'custom') {
      const secs = customMinutes * 60
      setTotalSeconds(secs)
      setSecondsLeft(secs)
    } else {
      const secs = modePresets[newMode].minutes * 60
      setTotalSeconds(secs)
      setSecondsLeft(secs)
    }
  }

  const handleStartPause = () => {
    if (isCompleted) {
      const secs = mode === 'custom' ? customMinutes * 60 : modePresets[mode as keyof typeof modePresets]?.minutes * 60 || 25 * 60
      setTotalSeconds(secs)
      setSecondsLeft(secs)
      setIsCompleted(false)
      setIsRunning(true)
    } else {
      const nextRunning = !isRunning
      setIsRunning(nextRunning)
      if (nextRunning) {
        showToast("Focus session active")
      }
    }
  }

  const handleReset = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setIsRunning(false)
    setIsCompleted(false)
    if (mode === 'stopwatch') {
      setStopwatchSeconds(0)
      setLaps([])
    } else if (mode === 'custom') {
      const secs = customMinutes * 60
      setSecondsLeft(secs)
    } else {
      const secs = modePresets[mode as keyof typeof modePresets]?.minutes * 60 || 25 * 60
      setSecondsLeft(secs)
    }
    showToast("Timer reset")
  }

  const handleAddLap = () => {
    if (mode !== 'stopwatch') return
    const prevTime = laps.length > 0 ? laps[laps.length - 1].timeSeconds : 0
    const split = stopwatchSeconds - prevTime
    const newLap: LapRecord = {
      lapNumber: laps.length + 1,
      timeSeconds: stopwatchSeconds,
      splitSeconds: split
    }
    setLaps((prev) => [...prev, newLap])
    showToast(`Lap ${newLap.lapNumber} recorded`)
  }

  const handleSyncTimerToWatch = async () => {
    const mins = Math.ceil(secondsLeft / 60)
    await sendWatchAlert(`Timer: ${mins}m Focus (${sessionTag})`)
    showToast("Dispatched timer alert to WatchOS")
  }

  // Circular dial calculations
  const size = 230
  const strokeWidth = 11
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
  const goalProgressPercent = Math.min(100, Math.round((totalFocusMinutesToday / dailyGoalMinutes) * 100))

  return (
    <div className="space-y-5 max-w-md mx-auto pb-8">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-purple-600/90 text-white text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 border border-purple-400/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-300" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP HEADER: Back button + Title + Goal Customizer */}
      <div className="flex items-center justify-between pt-1">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setActiveTab('dashboard')}
          className="w-10 h-10 rounded-full bg-[#161224] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md"
          title="Back to Home"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        <div className="text-center">
          <h2 className="text-lg font-extrabold text-white tracking-tight">
            Focus & Productivity
          </h2>
          <span className="text-[10px] font-mono text-purple-300/80">
            {totalFocusMinutesToday} / {dailyGoalMinutes} mins focused today
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setShowCustomModal(true)}
          className="w-10 h-10 rounded-full bg-[#161224] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md"
          title="Custom Duration & Goal"
        >
          <MoreHorizontal className="w-5 h-5" />
        </motion.button>
      </div>

      {/* 2. SEGMENTED MODE SELECTOR */}
      <div className="flex items-center p-1 rounded-2xl bg-[#161224] border border-white/[0.08] shadow-inner overflow-x-auto scrollbar-none">
        {(Object.keys(modePresets) as (keyof typeof modePresets)[]).map((key) => {
          const isSelected = mode === key
          return (
            <button
              key={key}
              onClick={() => handleSelectMode(key)}
              className={`relative flex-1 px-3 py-2 rounded-xl text-xs font-bold capitalize transition-colors shrink-0 text-center ${
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
          className={`relative flex-1 px-3 py-2 rounded-xl text-xs font-bold capitalize transition-colors shrink-0 text-center ${
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

        <button
          onClick={() => {
            handleSelectMode('custom')
            setShowCustomModal(true)
          }}
          className={`relative flex-1 px-3 py-2 rounded-xl text-xs font-bold capitalize transition-colors shrink-0 text-center ${
            mode === 'custom' ? 'text-white' : 'text-slate-400 hover:text-purple-200'
          }`}
        >
          {mode === 'custom' && (
            <motion.div
              layoutId="focusModePill"
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 shadow-md shadow-pink-600/30"
            />
          )}
          <span className="relative z-10">{customMinutes}m</span>
        </button>
      </div>

      {/* 3. MAIN FOCUS CARD */}
      <div className="p-7 rounded-3xl border border-white/[0.08] bg-[#161224] shadow-2xl flex flex-col items-center justify-center space-y-5 relative overflow-hidden">
        
        {/* Breathing ambient glow */}
        {isRunning && (
          <motion.div
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.25, 0.45, 0.25]
            }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute w-72 h-72 rounded-full bg-gradient-to-tr from-purple-600/30 via-pink-600/30 to-cyan-500/25 blur-3xl pointer-events-none"
          />
        )}

        {/* Circular Countdown Dial */}
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="rotate-[-90deg]">
            <defs>
              <linearGradient id="focusDialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>

            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth={strokeWidth}
              fill="transparent"
            />

            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#focusDialGrad)"
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
            <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold mb-1">
              {mode === 'stopwatch' ? 'ELAPSED' : isRunning ? 'FOCUSING' : 'READY'}
            </span>

            <motion.div 
              key={formattedTime}
              initial={{ scale: 0.96 }}
              animate={{ scale: 1 }}
              className="text-5xl font-black tracking-tight text-white font-mono drop-shadow-[0_2px_15px_rgba(236,72,153,0.4)]"
            >
              {formattedTime}
            </motion.div>

            <span className="text-xs text-purple-300/80 mt-1 font-medium">
              {isCompleted ? 'Goal reached! Well done.' : isRunning ? 'Stay in the flow' : 'Tap start to begin'}
            </span>
          </div>
        </div>

        {/* Task Tag Selector Pill */}
        <div className="flex items-center gap-1.5 z-10 text-[10px]">
          {['#Study', '#Coding', '#Reading', '#General'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSessionTag(tag)}
              className={`px-2.5 py-0.5 rounded-full border transition-all ${
                sessionTag === tag
                  ? 'bg-purple-500/25 border-purple-400 text-pink-300 font-bold'
                  : 'bg-[#0f0b1a] border-white/10 text-slate-400'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 relative z-10 pt-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleStartPause}
            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-xs font-bold transition-all shadow-xl ${
              isRunning
                ? 'bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/20'
                : 'bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 text-white shadow-pink-500/35'
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

          {mode === 'stopwatch' && isRunning && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleAddLap}
              className="p-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-amber-300 border border-white/[0.08] transition-all"
              title="Record Lap"
            >
              <Flag className="w-4 h-4" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] text-purple-300 border border-white/[0.08] transition-all"
            title="Reset timer"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleSyncTimerToWatch}
            className="p-3.5 rounded-2xl bg-purple-500/15 hover:bg-purple-500/25 text-pink-300 border border-purple-500/30 transition-all"
            title="Sync Timer to Watch"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Daily Focus Goal Bar */}
        <div className="w-full pt-4 border-t border-white/[0.08] space-y-1.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Daily Goal ({dailyGoalMinutes}m)</span>
            <span className="font-mono text-purple-300 font-bold">{goalProgressPercent}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[#0f0b1a] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goalProgressPercent}%` }}
              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
            />
          </div>
        </div>
      </div>

      {/* 4. STOPWATCH LAPS LIST (When in Stopwatch mode) */}
      {mode === 'stopwatch' && laps.length > 0 && (
        <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#161224] shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white">Lap Times</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{laps.length} Laps</span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {laps.slice().reverse().map((lap) => (
              <div
                key={lap.lapNumber}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#0f0b1a] border border-white/[0.04] text-xs font-mono"
              >
                <span className="text-purple-300 font-bold">Lap {lap.lapNumber}</span>
                <span className="text-slate-400">+{lap.splitSeconds}s</span>
                <span className="text-white font-bold">{Math.floor(lap.timeSeconds / 60)}m {lap.timeSeconds % 60}s</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. FOCUS SESSION HISTORY */}
      <div className="p-5 rounded-3xl border border-white/[0.08] bg-[#161224] shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white">Recent Completed Sessions</h3>
          </div>
          <span className="text-[11px] font-mono text-pink-400 font-bold">
            {sessionHistory.length} recorded
          </span>
        </div>

        {sessionHistory.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 font-medium">
            No focus sessions logged today yet.
          </div>
        ) : (
          <div className="space-y-2">
            {sessionHistory.slice(0, 4).map((session) => (
              <motion.div
                key={session.id}
                whileHover={{ x: 2 }}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#0f0c1c] border border-white/[0.05] transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-pink-500/15 text-pink-400 flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">{session.title}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {session.completedAt}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-bold bg-purple-500/15 text-purple-300">
                    +{session.durationMinutes}m
                  </span>
                  <button
                    onClick={() => {
                      focusRepository.delete(session.id)
                      showToast("Session log removed")
                    }}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* CUSTOM DURATION & GOAL MODAL */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-white/[0.12] bg-[#161224] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-pink-400" />
                  <span>Timer Preferences</span>
                </h3>
                <button onClick={() => setShowCustomModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-purple-200">Custom Focus Block (Minutes)</label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[15, 30, 45, 60].map((m) => (
                      <button
                        key={m}
                        onClick={() => {
                          setCustomMinutes(m)
                          const secs = m * 60
                          setTotalSeconds(secs)
                          setSecondsLeft(secs)
                          setMode('custom')
                          setShowCustomModal(false)
                          showToast(`Custom timer set to ${m} minutes`)
                        }}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          customMinutes === m
                            ? 'bg-purple-600 text-white border-purple-400'
                            : 'bg-[#0f0b1a] text-slate-300 border-white/10'
                        }`}
                      >
                        {m}m
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-purple-200">Daily Focus Goal</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[60, 120, 180].map((g) => (
                      <button
                        key={g}
                        onClick={() => {
                          setDailyGoalMinutes(g)
                          setShowCustomModal(false)
                          showToast(`Daily focus goal set to ${g} mins`)
                        }}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          dailyGoalMinutes === g
                            ? 'bg-pink-600 text-white border-pink-400'
                            : 'bg-[#0f0b1a] text-slate-300 border-white/10'
                        }`}
                      >
                        {g} mins
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
