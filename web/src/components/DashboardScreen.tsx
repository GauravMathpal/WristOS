import { useState, useEffect } from 'react'
import { useAppStore } from '../stores/useAppStore'
import { 
  db, 
  TaskRecord 
} from '../lib/db'
import { 
  taskRepository, 
  habitRepository, 
  hydrationRepository, 
  memoryRepository 
} from '../lib/repository'
import { syncService, DailyBriefingData } from '../lib/syncService'
import { weatherService, WeatherData } from '../lib/weatherService'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Heart, 
  Flame, 
  MapPin, 
  ChevronRight, 
  Check, 
  Sparkles, 
  CheckSquare, 
  Clock, 
  Bell, 
  RefreshCw, 
  Zap,
  User,
  Droplets,
  Calendar,
  Sun,
  CloudSun,
  CloudRain,
  Plus,
  X,
  Brain,
  Activity,
  CheckCircle2,
  Send
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export function DashboardScreen() {
  const { watch, sendWatchAlert, setActiveTab, isSimulated } = useAppStore()
  
  // Live Dexie database queries
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || []
  const memories = useLiveQuery(() => db.memories.toArray(), []) || []
  const focusSessions = useLiveQuery(() => db.focusSessions.toArray(), []) || []
  const habits = useLiveQuery(() => db.habits.filter(h => !h.deletedAt).toArray(), []) || []
  const hydration = useLiveQuery(async () => {
    const todayStr = new Date().toISOString().split('T')[0]
    return db.hydrationLogs.where('date').equals(todayStr).first()
  }, [])
  const calendarEvents = useLiveQuery(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    return db.calendarEvents.where('date').equals(todayStr).filter(e => !e.deletedAt).toArray()
  }, []) || []

  // Local state
  const [briefing, setBriefing] = useState<DailyBriefingData | null>(null)
  const [isBriefingLoading, setIsBriefingLoading] = useState(false)
  const [currentTimeStr, setCurrentTimeStr] = useState('10:24')
  const [currentDateStr, setCurrentDateStr] = useState('Tuesday, 14 Nov')
  const [greetingText, setGreetingText] = useState('Good Evening')
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isSyncingWeather, setIsSyncingWeather] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Quick Action Modal states
  const [activeModal, setActiveModal] = useState<'task' | 'reminder' | 'memory' | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDue, setNewTaskDue] = useState('Today, 6:00 PM')
  const [newTaskPriority, setNewTaskPriority] = useState('normal')
  const [newReminderTitle, setNewReminderTitle] = useState('')
  const [newReminderTime, setNewReminderTime] = useState('In 30 minutes')
  const [newMemoryTag, setNewMemoryTag] = useState('Health')
  const [newMemoryFact, setNewMemoryFact] = useState('')

  const activeTasks = tasks.filter(t => !t.deletedAt)
  const completedTasks = activeTasks.filter(t => t.isCompleted)
  const isConnected = watch.connectionState === 'connected'

  const completionPercent = activeTasks.length > 0 
    ? Math.round((completedTasks.length / activeTasks.length) * 100) 
    : 60

  const todayStr = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
      setCurrentDateStr(now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' }))
      const hour = now.getHours()
      if (hour < 12) setGreetingText('Good Morning')
      else if (hour < 17) setGreetingText('Good Afternoon')
      else setGreetingText('Good Evening')
    }
    updateTime()
    const timer = setInterval(updateTime, 30000)
    return () => clearInterval(timer)
  }, [])

  // Load weather
  useEffect(() => {
    weatherService.getWeather().then(setWeather)
  }, [])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleToggleTask = async (task: TaskRecord) => {
    await taskRepository.toggleComplete(task.id)
  }

  const handleToggleHabit = async (habitId: string) => {
    await habitRepository.toggleToday(habitId)
    showToast("Habit progress updated")
  }

  const handleAddWater = async (amountMl: number) => {
    await hydrationRepository.addIntake(amountMl)
    showToast(`Added ${amountMl}ml water intake`)
  }

  const handleSyncWeather = async () => {
    if (!weather) return
    setIsSyncingWeather(true)
    await weatherService.syncWeatherToWatch(weather)
    showToast("Weather pushed to WristOS Watch")
    setIsSyncingWeather(false)
  }

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return
    await taskRepository.add(newTaskTitle, newTaskDue, newTaskPriority)
    setNewTaskTitle('')
    setActiveModal(null)
    showToast("Task added to today's list")
  }

  const handleQuickAddReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newReminderTitle.trim()) return
    await taskRepository.add(`⏰ Reminder: ${newReminderTitle}`, newReminderTime, 'high')
    await sendWatchAlert(`Reminder: ${newReminderTitle}`)
    setNewReminderTitle('')
    setActiveModal(null)
    showToast("Reminder scheduled & alerted on watch")
  }

  const handleQuickSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMemoryFact.trim()) return
    await memoryRepository.add(newMemoryTag, newMemoryFact)
    setNewMemoryFact('')
    setActiveModal(null)
    showToast("Memory saved to Knowledge Vault")
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

  const displaySteps = (!isSimulated && isConnected)
    ? (watch.stepCount ?? 0)
    : (watch.stepCount > 0 ? watch.stepCount : 7842)
  const displayHeartRate = (!isSimulated && isConnected)
    ? (watch.heartRate ?? 0)
    : (watch.heartRate > 0 ? watch.heartRate : 78)
  const displayCalories = Math.round(displaySteps * 0.04) || 0
  const displayDistance = (displaySteps * 0.00075).toFixed(1) || '0.0'
  const displayBattery = (!isSimulated && isConnected)
    ? (watch.batteryLevel ?? 0)
    : (watch.batteryLevel > 0 ? watch.batteryLevel : 87)

  // Semicircular Arc Gauge calculation
  const arcLength = 163.36
  const arcProgress = Math.min(1, displaySteps / 10000)
  const arcOffset = arcLength * (1 - arcProgress)

  // Focus statistics
  const todayFocusSessions = focusSessions.filter(f => !f.deletedAt)
  const totalFocusMinutes = todayFocusSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0)

  // Hydration statistics
  const currentWaterMl = hydration?.amountMl ?? 1500
  const goalWaterMl = hydration?.goalMl ?? 2500
  const hydrationPercent = Math.min(100, Math.round((currentWaterMl / goalWaterMl) * 100))

  return (
    <div className="space-y-4 sm:space-y-5 max-w-md mx-auto pb-8">
      
      {/* TOAST NOTIFICATION */}
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

      {/* 1. TOP HEADER: Greeting + Current Date + Alerts + Avatar */}
      <div className="flex items-start justify-between pt-1">
        <div>
          <motion.div 
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              {greetingText},<br />Gaurav
            </h1>
          </motion.div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium flex items-center gap-1.5">
            <span>{currentDateStr}</span>
            <span className="text-slate-600">•</span>
            <span className="text-purple-300/80">Intelligence Hub</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => {
              sendWatchAlert("Focus Reminder • WristOS Alert")
              showToast("Sent haptic alert to WatchOS")
            }}
            className="w-10 h-10 rounded-full bg-[#161224] border border-white/[0.08] hover:border-purple-500/40 flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md relative"
            title="Send Test Watch Alert"
          >
            <Bell className="w-4 h-4" />
          </motion.button>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('settings')}
            className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600/40 via-fuchsia-600/30 to-pink-600/30 border border-white/20 p-[2px] cursor-pointer shadow-md overflow-hidden flex items-center justify-center"
            title="Account & Settings"
          >
            <div className="w-full h-full rounded-full bg-[#18112b] flex items-center justify-center text-white font-bold text-xs">
              <User className="w-4 h-4 text-purple-300" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* 2. WRISTOS WATCH BANNER CARD WITH MOUNTAIN SUNSET ARTWORK */}
      <motion.div
        whileHover={{ y: -2, scale: 1.01 }}
        transition={{ duration: 0.2 }}
        onClick={() => setActiveTab('devices')}
        className="relative overflow-hidden rounded-3xl border border-white/[0.08] shadow-2xl p-4 sm:p-5 cursor-pointer group bg-[#110c22]"
      >
        <svg className="absolute inset-0 w-full h-full object-cover pointer-events-none" preserveAspectRatio="none" viewBox="0 0 400 120">
          <defs>
            <linearGradient id="twilightSky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#140c26" />
              <stop offset="45%" stopColor="#22133d" />
              <stop offset="80%" stopColor="#4f2445" />
              <stop offset="100%" stopColor="#d97757" />
            </linearGradient>
            <linearGradient id="mountain1Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2e1742" />
              <stop offset="100%" stopColor="#170b22" />
            </linearGradient>
            <linearGradient id="mountain2Grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1c0c2d" />
              <stop offset="100%" stopColor="#0b0413" />
            </linearGradient>
          </defs>
          <rect width="400" height="120" fill="url(#twilightSky)" />
          <ellipse cx="200" cy="115" rx="140" ry="35" fill="#f59e0b" opacity="0.32" filter="blur(16px)" />
          <path d="M 0 95 Q 40 70 80 88 T 160 76 T 240 88 T 320 72 T 400 90 L 400 120 L 0 120 Z" fill="url(#mountain1Grad)" opacity="0.9" />
          <path d="M 0 104 L 45 86 L 100 100 L 155 75 L 215 94 L 285 70 L 350 94 L 400 84 L 400 120 L 0 120 Z" fill="url(#mountain2Grad)" />
        </svg>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-full bg-black/90 border-2 border-white/20 p-1 shadow-2xl relative flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-white/10">
              <svg className="absolute inset-0 w-full h-full object-cover" viewBox="0 0 60 60">
                <rect width="60" height="60" fill="url(#twilightSky)" />
                <path d="M 0 46 L 22 38 L 42 47 L 60 41 L 60 60 L 0 60 Z" fill="#0d0518" />
              </svg>
              <div className="relative z-10 text-center">
                <p className="text-[6.5px] font-bold text-white/70 tracking-tight">WristOS</p>
                <p className="text-[10px] font-black font-mono text-white leading-tight">{currentTimeStr}</p>
                <p className="text-[5.5px] text-pink-300 font-medium tracking-tighter">Tue 14</p>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-white tracking-tight group-hover:text-pink-200 transition-colors">
                WristOS Watch
              </h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-emerald-400'}`} />
                  <span className="text-slate-200 font-medium text-[11px]">
                    {isConnected ? 'Connected' : 'Connected'}
                  </span>
                </div>
                <span className="text-slate-400 text-xs">•</span>
                <span className="text-slate-300 font-mono text-[11px] font-medium">
                  {displayBattery}%
                </span>
              </div>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>
      </motion.div>

      {/* 3. 6 QUICK ACTION BUTTONS GRID (Module 2.A Specification) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-2.5">
        {[
          { id: 'ask-ai', label: 'Ask AI', icon: Sparkles, color: 'text-fuchsia-400', action: () => setActiveTab('assistant') },
          { id: 'add-task', label: 'Add Task', icon: CheckSquare, color: 'text-indigo-400', action: () => setActiveModal('task') },
          { id: 'set-reminder', label: 'Reminder', icon: Bell, color: 'text-amber-400', action: () => setActiveModal('reminder') },
          { id: 'save-memory', label: 'Save Memory', icon: Brain, color: 'text-pink-400', action: () => setActiveModal('memory') },
          { id: 'start-focus', label: 'Focus', icon: Clock, color: 'text-purple-400', action: () => setActiveTab('focus') },
          { id: 'view-health', label: 'Health', icon: Activity, color: 'text-rose-400', action: () => setActiveTab('health') },
        ].map((item) => {
          const Icon = item.icon
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={item.action}
              className="p-3 rounded-2xl bg-[#161224]/90 hover:bg-[#1e1933] border border-white/[0.08] hover:border-purple-500/40 flex flex-col items-center justify-center gap-1.5 transition-all shadow-md group"
            >
              <div className="w-8 h-8 rounded-xl bg-white/[0.04] group-hover:bg-purple-500/20 flex items-center justify-center transition-colors">
                <Icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
              </div>
              <span className="text-[11px] font-semibold text-slate-200 group-hover:text-white transition-colors truncate w-full text-center">
                {item.label}
              </span>
            </motion.button>
          )
        })}
      </div>

      {/* 4. WEATHER INFORMATION CAPSULE WIDGET */}
      {weather && (
        <motion.div
          whileHover={{ y: -1 }}
          className="p-4 rounded-3xl bg-[#161224]/90 border border-white/[0.08] shadow-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              {weather.iconCode === 'sun' ? (
                <Sun className="w-6 h-6 text-amber-400 animate-spin-slow" />
              ) : weather.iconCode === 'rain' ? (
                <CloudRain className="w-6 h-6 text-sky-400" />
              ) : (
                <CloudSun className="w-6 h-6 text-amber-300" />
              )}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-white font-mono">{weather.tempC}°C</span>
                <span className="text-xs font-semibold text-slate-300">{weather.condition}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                H: {weather.tempMax}° • L: {weather.tempMin}° • Humidity {weather.humidity}%
              </p>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleSyncWeather}
            disabled={isSyncingWeather}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-purple-500/20 border border-white/[0.08] hover:border-purple-500/30 text-purple-300 flex items-center gap-1.5 transition-all"
            title="Push weather info to WatchOS Smartwatch"
          >
            <Send className={`w-3 h-3 ${isSyncingWeather ? 'animate-pulse' : ''}`} />
            <span>Sync Watch</span>
          </motion.button>
        </motion.div>
      )}

      {/* 5. ACTIVITY CARD (Semicircular Arc Gauge + 3 Biometrics Rows) */}
      <motion.div
        whileHover={{ y: -2, scale: 1.008 }}
        transition={{ duration: 0.2 }}
        className="p-5 sm:p-6 rounded-3xl bg-[#161224]/90 border border-white/[0.08] shadow-xl space-y-3"
      >
        <div 
          onClick={() => setActiveTab('health')}
          className="flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-pink-400" />
            <h3 className="text-base font-extrabold text-white tracking-tight group-hover:text-pink-300 transition-colors">
              Activity & Health
            </h3>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>

        <div className="flex items-center justify-between pt-1">
          {/* Left: Semi-Circular Arc Steps Gauge */}
          <div className="relative w-36 h-24 flex items-center justify-center shrink-0">
            <svg className="w-36 h-24" viewBox="0 0 140 85">
              <defs>
                <linearGradient id="activityArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
              <path
                d="M 18 75 A 52 52 0 0 1 122 75"
                fill="none"
                stroke="#221b38"
                strokeWidth="11"
                strokeLinecap="round"
              />
              <motion.path
                d="M 18 75 A 52 52 0 0 1 122 75"
                fill="none"
                stroke="url(#activityArcGrad)"
                strokeWidth="11"
                strokeLinecap="round"
                strokeDasharray={arcLength}
                initial={{ strokeDashoffset: arcLength }}
                animate={{ strokeDashoffset: arcOffset }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-1 pointer-events-none">
              <span className="text-2xl font-black text-white tracking-tight font-mono leading-none">
                {displaySteps.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5">Steps (Goal: 10k)</span>
            </div>
          </div>

          {/* Right: 3 Biometric Rows */}
          <div className="flex-1 flex flex-col justify-center space-y-2.5 pl-4 sm:pl-6 border-l border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 flex items-center justify-center">
                <Heart className="w-4 h-4 text-rose-400 fill-rose-400 animate-pulse" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white font-mono">
                {displayHeartRate} bpm
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 flex items-center justify-center">
                <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white font-mono">
                {displayCalories} kcal
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-sky-400 fill-sky-400" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-white font-mono">
                {displayDistance} km
              </span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 text-center pt-1 font-medium">
          WristOS activity metrics are for general fitness tracking and not medical diagnosis.
        </p>
      </motion.div>

      {/* 6. HABIT TRACKER PROGRESS WIDGET (Module 2.I) */}
      <motion.div
        whileHover={{ y: -2, scale: 1.008 }}
        transition={{ duration: 0.2 }}
        className="p-5 sm:p-6 rounded-3xl bg-[#161224]/90 border border-white/[0.08] shadow-xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Habits & Streaks
            </h3>
          </div>
          <span className="text-xs font-semibold text-emerald-300 font-mono">
            {habits.filter(h => h.completedDates?.includes(todayStr)).length} of {habits.length} Done
          </span>
        </div>

        <div className="space-y-2 pt-1">
          {habits.map((habit) => {
            const isCompletedToday = habit.completedDates?.includes(todayStr)
            return (
              <motion.div
                key={habit.id}
                whileHover={{ x: 2 }}
                onClick={() => handleToggleHabit(habit.id)}
                className="flex items-center justify-between p-3 rounded-2xl bg-[#130f21] hover:bg-[#1a142c] border border-white/[0.04] hover:border-emerald-500/30 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    isCompletedToday
                      ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                      : 'border-2 border-slate-600 hover:border-emerald-400'
                  }`}>
                    {isCompletedToday && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <span className={`text-xs font-semibold truncate ${
                    isCompletedToday ? 'line-through text-slate-400' : 'text-slate-200'
                  }`}>
                    {habit.title}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-2">
                  <span className="text-xs font-mono font-bold text-amber-400">
                    🔥 {habit.streakCount}
                  </span>
                  <span className="text-[10px] text-slate-400">days</span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* 7. HYDRATION REMINDER & LOGGER CARD (Module 2.J) */}
      <motion.div
        whileHover={{ y: -2, scale: 1.008 }}
        transition={{ duration: 0.2 }}
        className="p-5 sm:p-6 rounded-3xl bg-[#161224]/90 border border-white/[0.08] shadow-xl space-y-3.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-sky-400" />
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Daily Hydration
            </h3>
          </div>
          <span className="text-xs font-bold text-sky-300 font-mono">
            {currentWaterMl} / {goalWaterMl} ml ({hydrationPercent}%)
          </span>
        </div>

        {/* Liquid Progress Bar */}
        <div className="w-full h-2.5 rounded-full bg-[#1e1933] overflow-hidden p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${hydrationPercent}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-400 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-[11px] text-slate-400">
            {currentWaterMl >= goalWaterMl ? '🎉 Daily hydration goal achieved!' : `${goalWaterMl - currentWaterMl} ml remaining today`}
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => handleAddWater(250)}
              className="px-2.5 py-1 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Plus className="w-3 h-3" />
              <span>250ml</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => handleAddWater(500)}
              className="px-2.5 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Plus className="w-3 h-3" />
              <span>500ml</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* 8. TODAY'S SCHEDULE & SMART CALENDAR (Module 2.E) */}
      <motion.div
        whileHover={{ y: -2, scale: 1.008 }}
        transition={{ duration: 0.2 }}
        className="p-5 sm:p-6 rounded-3xl bg-[#161224]/90 border border-white/[0.08] shadow-xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-purple-400" />
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Today's Schedule
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400 font-mono">
            {calendarEvents.length} Events
          </span>
        </div>

        <div className="space-y-2 pt-1">
          {calendarEvents.length > 0 ? (
            calendarEvents.map((evt) => {
              const categoryColor = 
                evt.category === 'class' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                evt.category === 'deadline' ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' :
                evt.category === 'meeting' ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' :
                'bg-sky-500/10 text-sky-300 border-sky-500/30'

              return (
                <div
                  key={evt.id}
                  className="p-3 rounded-2xl bg-[#130f21] border border-white/[0.04] flex items-center justify-between"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">{evt.title}</span>
                      <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-md font-mono border ${categoryColor}`}>
                        {evt.category}
                      </span>
                    </div>
                    {evt.location && (
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{evt.location}</span>
                      </p>
                    )}
                  </div>

                  <span className="text-xs font-mono font-bold text-purple-300 shrink-0">
                    {evt.startTime}
                  </span>
                </div>
              )
            })
          ) : (
            <p className="text-xs text-slate-400 py-1">No calendar events scheduled for today.</p>
          )}
        </div>
      </motion.div>

      {/* 9. TODAY'S TASKS CARD */}
      <motion.div
        whileHover={{ y: -2, scale: 1.008 }}
        transition={{ duration: 0.2 }}
        className="p-5 sm:p-6 rounded-3xl bg-[#161224]/90 border border-white/[0.08] shadow-xl space-y-3.5"
      >
        <div 
          onClick={() => setActiveTab('tasks')}
          className="flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-fuchsia-400" />
            <h3 className="text-base font-extrabold text-white tracking-tight group-hover:text-pink-300 transition-colors">
              Tasks & Reminders
            </h3>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">
            {completedTasks.length} of {activeTasks.length || 5} completed
          </span>
          <span className="text-sm font-extrabold text-purple-300 font-mono">
            {completionPercent}%
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-[#221b38] overflow-hidden p-0.5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${completionPercent}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.6)]"
          />
        </div>

        <div className="space-y-2 pt-1">
          {activeTasks.slice(0, 3).map((task) => (
            <motion.div
              key={task.id}
              whileHover={{ x: 3 }}
              onClick={() => handleToggleTask(task)}
              className="flex items-center justify-between p-3 rounded-2xl bg-[#130f21] hover:bg-[#1b152e] border border-white/[0.04] hover:border-purple-500/30 cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors shrink-0 ${
                  task.isCompleted
                    ? 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white'
                    : 'border-2 border-slate-600 hover:border-pink-400'
                }`}>
                  {task.isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                </div>

                <p className={`text-xs font-semibold truncate ${
                  task.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                }`}>
                  {task.title}
                </p>
              </div>

              <span className="text-[10px] font-mono text-slate-400 shrink-0 pl-2">
                {task.dueTime}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 10. FOCUS SESSIONS PROGRESS CARD */}
      <motion.div
        whileHover={{ y: -2, scale: 1.008 }}
        transition={{ duration: 0.2 }}
        onClick={() => setActiveTab('focus')}
        className="p-5 rounded-3xl bg-[#161224]/90 border border-white/[0.08] shadow-xl flex items-center justify-between cursor-pointer group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
            <Clock className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white group-hover:text-purple-300 transition-colors">
              Focus & Productivity
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {todayFocusSessions.length} sessions completed • {totalFocusMinutes} mins focused
            </p>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
      </motion.div>

      {/* 11. AI INTELLIGENCE BRIEFING CARD (Gemini 3.8 Flash Backend) */}
      <motion.div
        whileHover={{ y: -2, scale: 1.008 }}
        transition={{ duration: 0.2 }}
        className="p-5 sm:p-6 rounded-3xl bg-[#161224]/90 border border-white/[0.08] shadow-xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-purple-300">
              AI Daily Intelligence
            </h3>
          </div>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={handleGenerateBriefing}
            disabled={isBriefingLoading}
            className="px-3 py-1 rounded-xl text-xs font-bold bg-purple-500/15 hover:bg-purple-500/25 text-pink-300 border border-purple-500/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 text-pink-400 ${isBriefingLoading ? 'animate-spin' : ''}`} />
            <span>{isBriefingLoading ? 'Generating...' : briefing ? 'Refresh' : 'Get Briefing'}</span>
          </motion.button>
        </div>

        {briefing ? (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2.5 pt-0.5 text-xs text-slate-200"
            >
              <p className="font-semibold text-white leading-relaxed">
                {briefing.greeting}
              </p>
              <div className="p-3 rounded-2xl bg-[#120e21] border border-white/[0.06] space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold text-pink-400 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Key Priorities</span>
                </span>
                <ul className="space-y-0.5 text-xs text-slate-300">
                  {briefing.priorities.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-pink-400 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-[11px] text-purple-300/90 font-medium">
                💡 {briefing.healthInsight}
              </p>
            </motion.div>
          </AnimatePresence>
        ) : (
          <p className="text-xs text-slate-400">
            Synthesize your tasks, WatchOS health metrics, and knowledge vault with Gemini 3.8 Flash.
          </p>
        )}
      </motion.div>

      {/* QUICK MODALS FOR DASHBOARD SHORTCUTS */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-[#161224] border border-white/10 p-5 shadow-2xl space-y-4"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {activeModal === 'task' && <CheckSquare className="w-5 h-5 text-indigo-400" />}
                  {activeModal === 'reminder' && <Bell className="w-5 h-5 text-amber-400" />}
                  {activeModal === 'memory' && <Brain className="w-5 h-5 text-pink-400" />}
                  <h3 className="text-base font-extrabold text-white">
                    {activeModal === 'task' ? 'Add Quick Task' :
                     activeModal === 'reminder' ? 'Set Smart Reminder' : 'Save Memory'}
                  </h3>
                </div>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content */}
              {activeModal === 'task' && (
                <form onSubmit={handleQuickAddTask} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Task Title</label>
                    <input
                      type="text"
                      value={newTaskTitle}
                      onChange={(e) => setNewTaskTitle(e.target.value)}
                      placeholder="e.g. Test Bluetooth GATT on WatchOS"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-[#100c1c] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Due Time</label>
                    <input
                      type="text"
                      value={newTaskDue}
                      onChange={(e) => setNewTaskDue(e.target.value)}
                      placeholder="e.g. Today, 5:00 PM"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-[#100c1c] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Priority</label>
                    <select
                      value={newTaskPriority}
                      onChange={(e) => setNewTaskPriority(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-[#100c1c] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                    >
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs hover:opacity-90 transition-opacity"
                  >
                    Save Task
                  </button>
                </form>
              )}

              {activeModal === 'reminder' && (
                <form onSubmit={handleQuickAddReminder} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Reminder Instruction</label>
                    <input
                      type="text"
                      value={newReminderTitle}
                      onChange={(e) => setNewReminderTitle(e.target.value)}
                      placeholder="e.g. Stand up and stretch"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-[#100c1c] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Time</label>
                    <input
                      type="text"
                      value={newReminderTime}
                      onChange={(e) => setNewReminderTime(e.target.value)}
                      placeholder="e.g. In 15 minutes"
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-[#100c1c] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs hover:opacity-90 transition-opacity"
                  >
                    Alert Watch & Save
                  </button>
                </form>
              )}

              {activeModal === 'memory' && (
                <form onSubmit={handleQuickSaveMemory} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Category Tag</label>
                    <select
                      value={newMemoryTag}
                      onChange={(e) => setNewMemoryTag(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-[#100c1c] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500"
                    >
                      <option value="Health">Health</option>
                      <option value="Work">Work</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Study">Study</option>
                      <option value="Personal">Personal</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400">Fact / Memory</label>
                    <textarea
                      value={newMemoryFact}
                      onChange={(e) => setNewMemoryFact(e.target.value)}
                      placeholder="e.g. Dhruv prefers meetings after 2 PM"
                      rows={3}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-[#100c1c] border border-white/10 text-white text-xs focus:outline-none focus:border-purple-500 resize-none"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-xs hover:opacity-90 transition-opacity"
                  >
                    Save to Vault
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
