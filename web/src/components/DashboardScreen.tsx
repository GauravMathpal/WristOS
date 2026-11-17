import { useAppStore } from '../stores/useAppStore'
import { db, TaskRecord } from '../lib/db'
import { taskRepository } from '../lib/repository'
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
  TrendingUp
} from 'lucide-react'
import { motion } from 'motion/react'
import { BreathingOrb } from './BreathingOrb'

export function DashboardScreen() {
  const { watch, connectWatch, disconnectWatch, sendWatchAlert, setActiveTab } = useAppStore()
  
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || []
  
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
    sendWatchAlert("Focus Session • WristOS")
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
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Good Evening, Gaurav <span className="inline-block animate-wave">👋</span>
            </h1>
          </motion.div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Let's make today productive.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={handleTestAlert}
            className="p-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] transition-all relative"
            title="Notifications / Haptic test"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_6px_#ec4899]" />
          </motion.button>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('settings')}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[1.5px] cursor-pointer shadow-md shadow-purple-500/20"
          >
            <div className="w-full h-full rounded-full bg-[#0e0a1a] flex items-center justify-center font-bold text-xs text-white">
              G
            </div>
          </motion.div>
        </div>
      </div>

      {/* WristOS Watch Companion Card (From Mockup Screen 1) */}
      <motion.div
        whileHover={{ y: -3, scale: 1.008 }}
        transition={{ duration: 0.2 }}
        className="p-4 sm:p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.035] backdrop-blur-xl transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <Watch className="w-6 h-6" />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-tight">WristOS Watch</h3>
                {isConnected && (
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.2 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    InfiniTime
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-600'}`} />
                <span className={isConnected ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
                <span>•</span>
                <span>{watch.batteryLevel > 0 ? `${watch.batteryLevel}%` : '87%'}</span>
                <span>•</span>
                <span>{watch.heartRate > 0 ? `${watch.heartRate} bpm` : '78 bpm'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={isConnected ? disconnectWatch : connectWatch}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isConnected
                  ? 'bg-white/[0.05] hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 border border-white/[0.08]'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold shadow-md shadow-purple-500/25'
              }`}
            >
              {isConnected ? 'Settings' : 'Connect'}
            </motion.button>
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </div>
        </div>
      </motion.div>

      {/* "Ask WristOS anything..." Breathing Orb Card (From Mockup Screen 1) */}
      <motion.div
        whileHover={{ y: -3, scale: 1.008 }}
        transition={{ duration: 0.2 }}
        className="relative overflow-hidden p-6 sm:p-7 rounded-3xl border border-purple-500/20 bg-gradient-to-b from-purple-900/20 via-pink-900/10 to-transparent backdrop-blur-2xl shadow-xl space-y-6 text-center flex flex-col items-center"
      >
        {/* Soft background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <BreathingOrb 
            size="md" 
            state="idle"
            onClick={() => setActiveTab('assistant')} 
          />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white tracking-tight">Ask WristOS anything...</h3>
          <p className="text-xs text-slate-400">
            Intelligent companion with memory context and watch telemetry integration
          </p>
        </div>

        {/* 3 Action Buttons: Speak, Type, Capture */}
        <div className="flex items-center justify-center gap-3 w-full max-w-xs">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={() => setActiveTab('assistant')}
            className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-purple-500/30 transition-all text-slate-300 hover:text-white"
          >
            <Mic className="w-4 h-4 text-pink-400" />
            <span className="text-[11px] font-semibold">Speak</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={() => setActiveTab('assistant')}
            className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-purple-500/30 transition-all text-slate-300 hover:text-white"
          >
            <Keyboard className="w-4 h-4 text-purple-400" />
            <span className="text-[11px] font-semibold">Type</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={() => sendWatchAlert("WristOS Focus Ping")}
            className="flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] hover:border-purple-500/30 transition-all text-slate-300 hover:text-white"
          >
            <Vibrate className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] font-semibold">Haptic</span>
          </motion.button>
        </div>
      </motion.div>

      {/* "Today's Plan" (From Mockup Screen 1) */}
      <motion.div
        whileHover={{ y: -3, scale: 1.008 }}
        transition={{ duration: 0.2 }}
        className="p-6 rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Today's Plan</h3>
            <p className="text-xs text-slate-400">
              {completedTasks.length} of {activeTasks.length} completed
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-pink-400 font-mono">
              {completionPercent}%
            </span>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setActiveTab('tasks')}
              className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06]"
              title="Add task"
            >
              <Plus className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.5)]"
          />
        </div>

        {/* Tasks List with Spring Checkboxes */}
        <div className="space-y-2.5 pt-1">
          {activeTasks.slice(0, 4).map((task) => (
            <motion.div
              key={task.id}
              whileHover={{ x: 3 }}
              transition={{ duration: 0.15 }}
              onClick={() => handleToggleTask(task)}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.04] hover:border-white/[0.08] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <motion.div
                  whileTap={{ scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    task.isCompleted
                      ? 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-sm'
                      : 'border border-white/20 hover:border-purple-400'
                  }`}
                >
                  {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </motion.div>

                <p className={`text-xs sm:text-sm font-medium truncate ${
                  task.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                }`}>
                  {task.title}
                </p>
              </div>

              <span className="text-[11px] font-mono text-slate-400 shrink-0 pl-3">
                {task.dueTime}
              </span>
            </motion.div>
          ))}

          {activeTasks.length === 0 && (
            <div className="text-center py-6 text-xs text-slate-500">
              No tasks scheduled for today. Tap + to add one.
            </div>
          )}
        </div>
      </motion.div>

      {/* Quick Biometrics Snapshot linking to Health screen */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          onClick={() => setActiveTab('health')}
          className="p-4 sm:p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-purple-500/30 cursor-pointer backdrop-blur-xl space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Activity Ring</span>
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Footprints className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono">
              {(watch.stepCount || 7842).toLocaleString()}
            </div>
            <div className="text-[11px] text-pink-400 flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>78% of daily goal</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ duration: 0.2 }}
          onClick={() => setActiveTab('health')}
          className="p-4 sm:p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:border-pink-500/30 cursor-pointer backdrop-blur-xl space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Heart Rate</span>
            <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
              <Heart className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white font-mono flex items-baseline gap-1">
              <span>{watch.heartRate || 78}</span>
              <span className="text-xs font-sans text-slate-400 font-normal">BPM</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5">
              Normal resting cardio
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  )
}
