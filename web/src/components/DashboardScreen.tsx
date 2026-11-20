import { useState } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { db, TaskRecord } from '../lib/db'
import { taskRepository } from '../lib/repository'
import { syncService, DailyBriefingData } from '../lib/syncService'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Footprints, 
  Heart, 
  Vibrate, 
  ChevronRight, 
  Check, 
  Watch, 
  Mic, 
  Keyboard, 
  Bell, 
  Plus,
  TrendingUp,
  Sparkles,
  RefreshCw,
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { BreathingOrb } from './BreathingOrb'

export function DashboardScreen() {
  const { watch, connectWatch, sendWatchAlert, setActiveTab } = useAppStore()
  
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || []
  const memories = useLiveQuery(() => db.memories.toArray(), []) || []
  const focusSessions = useLiveQuery(() => db.focusSessions.toArray(), []) || []
  
  const [briefing, setBriefing] = useState<DailyBriefingData | null>(null)
  const [isBriefingLoading, setIsBriefingLoading] = useState(false)
  
  const activeTasks = tasks.filter(t => !t.deletedAt)
  const completedTasks = activeTasks.filter(t => t.isCompleted)
  const isConnected = watch.connectionState === 'connected'

  const completionPercent = activeTasks.length > 0 
    ? Math.round((completedTasks.length / activeTasks.length) * 100) 
    : 0

  const handleToggleTask = async (task: TaskRecord) => {
    await taskRepository.toggleComplete(task.id)
  }

  const handleTestAlert = () => {
    sendWatchAlert("Focus Alert • WristOS Haptic Pulse")
  }

  const handleGenerateBriefing = async () => {
    setIsBriefingLoading(true)
    const activeMemories = memories.filter(m => !m.deletedAt)
    const totalFocusMins = focusSessions
      .filter(f => !f.deletedAt)
      .reduce((acc, f) => acc + (f.durationMinutes || 0), 0)

    const result = await syncService.getDailyBriefing({
      tasks: activeTasks.map(t => ({ title: t.title, dueTime: t.dueTime, priority: t.priority, isCompleted: t.isCompleted })),
      memories: activeMemories.map(m => ({ tag: m.tag, fact: m.fact })),
      activity: {
        steps: watch.stepCount || 7842,
        stepGoal: 10000,
        heartRateAvg: watch.heartRate || 78
      },
      focusMinutes: totalFocusMins
    })

    if (result) {
      setBriefing(result)
    }
    setIsBriefingLoading(false)
  }

  return (
    <div className="space-y-6">
      
      {/* Top Greeting Header (From Mockup Screen 1) */}
      <div className="flex items-center justify-between">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)]">
              Good Evening, Gaurav <span className="inline-block animate-wave">👋</span>
            </h1>
          </motion.div>
          <p className="text-xs sm:text-sm text-purple-300/80 mt-1 font-medium">
            Let's make today productive and focused.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleTestAlert}
            className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-pink-300 border border-purple-500/30 transition-all relative shadow-md shadow-purple-950/40"
            title="Notifications / Haptic test"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899] animate-ping" />
          </motion.button>

          <motion.div
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('settings')}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-pink-500 p-[1.5px] cursor-pointer shadow-lg shadow-purple-500/30"
          >
            <div className="w-full h-full rounded-[14px] bg-[#0c0819] flex items-center justify-center font-bold text-xs text-white">
              G
            </div>
          </motion.div>
        </div>
      </div>

      {/* WristOS Watch Companion Card (From Mockup Screen 1) */}
      <motion.div
        whileHover={{ y: -3, scale: 1.01 }}
        transition={{ duration: 0.2 }}
        className="p-5 rounded-3xl border border-purple-500/25 bg-gradient-to-r from-[#1c123b]/85 via-[#140e2b]/80 to-[#0e0820]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25 transition-all relative overflow-hidden"
      >
        {/* Subtle ambient light flare */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/30 to-pink-500/20 border border-purple-400/40 flex items-center justify-center text-pink-300 shrink-0 shadow-[0_0_20px_rgba(168,85,247,0.35)]">
              <Watch className="w-6 h-6 drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-white tracking-tight">WristOS Watch</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                  InfiniTime BLE
                </span>
              </div>
              
              <div className="flex items-center gap-2.5 mt-1 text-xs text-slate-300">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse' : 'bg-slate-600'}`} />
                <span className={isConnected ? 'text-emerald-400 font-bold' : 'text-slate-400 font-medium'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-purple-300 font-mono font-semibold">{watch.batteryLevel > 0 ? `${watch.batteryLevel}%` : '94%'}</span>
                <span className="text-slate-600">•</span>
                <span className="text-pink-300 font-mono font-semibold">{watch.heartRate > 0 ? `${watch.heartRate} bpm` : '78 bpm'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={isConnected ? () => setActiveTab('devices') : connectWatch}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                isConnected
                  ? 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-purple-500/30'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-purple-500/30'
              }`}
            >
              {isConnected ? 'Manage' : 'Connect'}
            </motion.button>
            <ChevronRight className="w-4 h-4 text-purple-400" />
          </div>
        </div>
      </motion.div>

      {/* AI Daily Intelligence Briefing Card (Powered by Gemini 3.8 Flash Backend) */}
      <motion.div
        whileHover={{ y: -3, scale: 1.008 }}
        transition={{ duration: 0.2 }}
        className="p-5 sm:p-6 rounded-3xl border border-purple-500/25 bg-gradient-to-r from-[#191033]/85 via-[#130b26]/80 to-[#0e071e]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25 space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500/30 to-pink-500/20 border border-purple-400/40 flex items-center justify-center text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.4)]">
              <Sparkles className="w-4 h-4 text-pink-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                <span>AI Daily Intelligence Briefing</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {briefing?.source === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'Cloud Intelligence'}
                </span>
              </h3>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={handleGenerateBriefing}
            disabled={isBriefingLoading}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-pink-200 border border-purple-500/30 flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
            title="Generate fresh personalized AI briefing"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-pink-400 ${isBriefingLoading ? 'animate-spin' : ''}`} />
            <span>{isBriefingLoading ? 'Generating...' : briefing ? 'Refresh' : 'Get Briefing'}</span>
          </motion.button>
        </div>

        {briefing ? (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 pt-1 text-xs"
            >
              <p className="text-sm font-semibold text-white leading-relaxed">
                {briefing.greeting}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-2xl bg-[#140e29]/70 border border-purple-500/20 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-pink-400 flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    <span>Top Focus Priorities</span>
                  </span>
                  <ul className="space-y-1 text-slate-200 text-xs">
                    {briefing.priorities.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-pink-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#140e29]/70 border border-purple-500/20 space-y-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-cyan-400 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-cyan-400" />
                    <span>Health & Biometrics</span>
                  </span>
                  <p className="text-slate-200 text-xs leading-relaxed">
                    {briefing.healthInsight}
                  </p>
                  <p className="text-purple-300/80 text-[11px] pt-1 border-t border-purple-500/15">
                    💡 {briefing.focusRecommendation}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#140e29]/50 border border-purple-500/15 text-xs text-purple-200/70">
            <p>Tap "Get Briefing" to generate an instant synthesis of your pending tasks, health telemetry, and knowledge vault.</p>
          </div>
        )}
      </motion.div>

      {/* "Ask WristOS anything..." Vibrant Holographic Card (From Mockup Screen 1) */}
      <motion.div
        whileHover={{ y: -3, scale: 1.008 }}
        transition={{ duration: 0.2 }}
        className="relative overflow-hidden p-7 sm:p-8 rounded-3xl border border-purple-500/30 bg-gradient-to-b from-[#221342]/90 via-[#150d2c]/85 to-[#0b071a]/95 backdrop-blur-2xl shadow-2xl shadow-purple-950/40 text-center flex flex-col items-center space-y-6"
      >
        {/* Vibrant multi-stop radiant ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-purple-600/30 via-pink-600/35 to-cyan-500/25 rounded-full blur-3xl pointer-events-none" />

        {/* Central Luminous 3D Breathing Orb */}
        <div className="relative">
          <BreathingOrb 
            size="md" 
            state="idle"
            onClick={() => setActiveTab('assistant')} 
          />
        </div>

        {/* Flowing Neon Aurora Ribbon Wave across the card */}
        <div className="w-full max-w-sm h-10 overflow-hidden relative flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 200 40" preserveAspectRatio="none">
            <defs>
              <linearGradient id="auroraRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="35%" stopColor="#a855f7" />
                <stop offset="70%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
            </defs>
            <motion.path
              d="M 0 20 Q 50 2 100 20 T 200 20"
              fill="none"
              stroke="url(#auroraRibbonGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              filter="drop-shadow(0 0 8px rgba(236,72,153,0.8))"
              animate={{
                d: [
                  "M 0 20 Q 50 2 100 20 T 200 20",
                  "M 0 20 Q 50 36 100 20 T 200 20",
                  "M 0 20 Q 50 2 100 20 T 200 20"
                ]
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: 'easeInOut'
              }}
            />
          </svg>
        </div>

        <div className="space-y-1 relative z-10">
          <h3 className="text-xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
            Ask WristOS anything...
          </h3>
          <p className="text-xs text-purple-200/80 font-medium">
            Intelligent assistant grounded in your knowledge vault and watch telemetry
          </p>
        </div>

        {/* 3 Color-Infused Action Buttons: Speak (Pink), Type (Purple), Haptic (Cyan) */}
        <div className="flex items-center justify-center gap-3 w-full max-w-xs relative z-10">
          <motion.button
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={() => setActiveTab('assistant')}
            className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gradient-to-b from-pink-500/20 to-purple-600/10 hover:from-pink-500/30 hover:to-purple-600/20 border border-pink-500/35 hover:border-pink-500/60 transition-all text-white shadow-lg shadow-pink-950/30"
          >
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-300 shadow-[0_0_12px_rgba(236,72,153,0.5)]">
              <Mic className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-pink-200">Speak</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={() => setActiveTab('assistant')}
            className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gradient-to-b from-purple-500/20 to-indigo-600/10 hover:from-purple-500/30 hover:to-indigo-600/20 border border-purple-500/35 hover:border-purple-500/60 transition-all text-white shadow-lg shadow-purple-950/30"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.5)]">
              <Keyboard className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-purple-200">Type</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={() => sendWatchAlert("WristOS Focus Ping")}
            className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-gradient-to-b from-cyan-500/20 to-blue-600/10 hover:from-cyan-500/30 hover:to-blue-600/20 border border-cyan-500/35 hover:border-cyan-500/60 transition-all text-white shadow-lg shadow-cyan-950/30"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.5)]">
              <Vibrate className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold text-cyan-200">Haptic</span>
          </motion.button>
        </div>
      </motion.div>

      {/* "Today's Plan" Progress Card (From Mockup Screen 1) */}
      <motion.div
        whileHover={{ y: -3, scale: 1.008 }}
        transition={{ duration: 0.2 }}
        className="p-6 sm:p-7 rounded-3xl border border-purple-500/25 bg-gradient-to-b from-[#1b1236]/85 via-[#130d29]/80 to-[#0b081d]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">Today's Plan</h3>
            <p className="text-xs text-purple-300/80 font-medium">
              {completedTasks.length} of {activeTasks.length} completed
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-extrabold text-pink-400 font-mono drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]">
              {completionPercent}%
            </span>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setActiveTab('tasks')}
              className="p-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-pink-300 border border-purple-500/30"
              title="Add task"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Animated Radiant Progress Bar with Glowing Shimmer */}
        <div className="w-full bg-[#0a0715] rounded-full h-2.5 overflow-hidden p-0.5 border border-purple-500/20 shadow-inner">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.7)] animate-shimmer"
          />
        </div>

        {/* Tasks List with Spring Checkboxes */}
        <div className="space-y-2.5 pt-1">
          {activeTasks.slice(0, 4).map((task) => (
            <motion.div
              key={task.id}
              whileHover={{ x: 4, scale: 1.005 }}
              transition={{ duration: 0.15 }}
              onClick={() => handleToggleTask(task)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#140e29]/70 hover:bg-[#1b1338] border border-purple-500/15 hover:border-purple-500/40 cursor-pointer transition-all shadow-sm"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <motion.div
                  whileTap={{ scale: 0.75 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    task.isCompleted
                      ? 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-md shadow-pink-500/40'
                      : 'border-2 border-purple-400/40 hover:border-pink-400'
                  }`}
                >
                  {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </motion.div>

                <p className={`text-xs sm:text-sm font-semibold truncate ${
                  task.isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                }`}>
                  {task.title}
                </p>
              </div>

              <span className="text-[11px] font-mono font-medium text-purple-300/80 shrink-0 pl-3">
                {task.dueTime}
              </span>
            </motion.div>
          ))}

          {activeTasks.length === 0 && (
            <div className="text-center py-6 text-xs text-purple-300/60 font-medium">
              No tasks scheduled for today. Tap + to add one.
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Biometrics Snapshot Cards linking to Health screen */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Activity Ring Snapshot */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          onClick={() => setActiveTab('health')}
          className="p-5 rounded-3xl border border-purple-500/25 bg-gradient-to-b from-[#1b1236]/85 via-[#130d29]/80 to-[#0b081d]/90 hover:border-purple-400/50 cursor-pointer backdrop-blur-2xl space-y-3 shadow-xl shadow-purple-950/25"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-300">Activity Ring</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/35 text-purple-300 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.4)]">
              <Footprints className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white font-mono tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              {(watch.stepCount || 7842).toLocaleString()}
            </div>
            <div className="text-[11px] text-pink-400 font-bold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>78% of 10,000 daily goal</span>
            </div>
          </div>
        </motion.div>

        {/* Heart Rate Snapshot */}
        <motion.div
          whileHover={{ y: -4, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          onClick={() => setActiveTab('health')}
          className="p-5 rounded-3xl border border-pink-500/25 bg-gradient-to-b from-[#221033]/85 via-[#150a24]/80 to-[#0c0517]/90 hover:border-pink-400/50 cursor-pointer backdrop-blur-2xl space-y-3 shadow-xl shadow-pink-950/25"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-pink-300">Heart Rate</span>
            <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-400/35 text-pink-300 flex items-center justify-center shadow-[0_0_10px_rgba(236,72,153,0.4)]">
              <Heart className="w-4 h-4 fill-current drop-shadow-[0_0_6px_#ec4899]" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white font-mono flex items-baseline gap-1.5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
              <span>{watch.heartRate || 78}</span>
              <span className="text-xs font-sans text-pink-300/80 font-bold">BPM</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-bold mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Optimal resting cardio</span>
            </div>
          </div>
        </motion.div>

      </div>

    </div>
  )
}
