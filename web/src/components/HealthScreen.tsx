import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Heart, 
  TrendingUp, 
  ChevronLeft, 
  MoreHorizontal, 
  ShieldCheck, 
  Watch,
  Droplets,
  Pill,
  Check,
  Plus,
  Flame,
  Clock,
  Sparkles,
  X,
  Award,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import { ActivityRing } from './ActivityRing'
import { useAppStore } from '../stores/useAppStore'
import { 
  activityRepository, 
  habitRepository, 
  hydrationRepository, 
  medicationRepository 
} from '../lib/repository'
import { db } from '../lib/db'

export function HealthScreen() {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'activity' | 'heart' | 'wellness'>('overview')
  const [stepGoal, setStepGoal] = useState(10000)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Wellness sub-states
  const [showAddHabitModal, setShowAddHabitModal] = useState(false)
  const [newHabitTitle, setNewHabitTitle] = useState('')
  const [newHabitCategory, setNewHabitCategory] = useState('Health')
  
  const [showAddMedModal, setShowAddMedModal] = useState(false)
  const [newMedName, setNewMedName] = useState('')
  const [newMedDosage, setNewMedDosage] = useState('1 Tablet')
  const [newMedTime, setNewMedTime] = useState('09:00 AM')
  const [newMedInstructions, setNewMedInstructions] = useState('')

  const { watch, setActiveTab, sendWatchAlert, isSimulated, syncWatchTelemetry, connectWatch } = useAppStore()
  const isConnected = watch.connectionState === 'connected'
  const [isSyncing, setIsSyncing] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]

  // Live Dexie queries
  const todayActivity = useLiveQuery(() => activityRepository.getToday())
  const weeklyLogs = useLiveQuery(() => activityRepository.getWeekly()) || []
  const habits = useLiveQuery(() => db.habits.filter(h => !h.deletedAt).toArray(), []) || []
  const hydration = useLiveQuery(() => db.hydrationLogs.where('date').equals(todayStr).first(), [todayStr])
  const medications = useLiveQuery(() => db.medications.filter(m => !m.deletedAt).toArray(), []) || []

  const displaySteps = watch.stepCount > 0 
    ? watch.stepCount 
    : (todayActivity?.steps ?? 0)
  const displayHeartRate = watch.heartRate > 0 
    ? watch.heartRate 
    : (todayActivity?.heartRateAvg ?? (isConnected ? 0 : 72))

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleSyncWatch = async () => {
    setIsSyncing(true)
    try {
      if (!isConnected) {
        showToast('Connecting to Watch via Bluetooth...')
        await connectWatch()
        showToast('Watch connected & biometrics synced')
      } else {
        await syncWatchTelemetry()
        showToast(`Synced: ${(watch.stepCount || 0).toLocaleString()} steps`)
      }
    } catch (e: any) {
      showToast('Could not sync: ' + (e?.message || 'Check BLE'))
    } finally {
      setIsSyncing(false)
    }
  }

  // Auto-record today's biometrics to Dexie
  useEffect(() => {
    if (displaySteps > 0 || displayHeartRate > 0) {
      activityRepository.recordDailyMetrics({
        steps: displaySteps,
        stepGoal: stepGoal,
        heartRateAvg: displayHeartRate
      })
    }
  }, [displaySteps, displayHeartRate, stepGoal])

  // Map weekly logs into the bar chart
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const todayIndex = new Date().getDay()
  const todayDayName = dayNames[todayIndex]

  const weeklyData = weeklyLogs.length >= 7 
    ? weeklyLogs.slice(-7).map((log) => {
        const d = new Date(log.date)
        const day = dayNames[d.getDay()]
        const percent = Math.min(100, Math.round((log.steps / (log.stepGoal || stepGoal)) * 100))
        return {
          day,
          percent,
          steps: log.steps.toLocaleString(),
          isToday: day === todayDayName
        }
      })
    : [6, 5, 4, 3, 2, 1, 0].map((offset) => {
        const d = new Date(Date.now() - offset * 86400000)
        const day = dayNames[d.getDay()]
        const isToday = offset === 0
        const steps = isToday ? displaySteps : 0
        const percent = Math.min(100, Math.round((steps / stepGoal) * 100))
        return {
          day,
          percent,
          steps: steps.toLocaleString(),
          isToday
        }
      })

  // Wellness Handlers
  const handleToggleHabit = async (id: string) => {
    await habitRepository.toggleToday(id)
    showToast("Habit progress updated")
  }

  const handleAddWater = async (amount: number) => {
    await hydrationRepository.addIntake(amount)
    showToast(`Added ${amount}ml water intake`)
  }

  const handleToggleMedication = async (id: string) => {
    await medicationRepository.toggleTaken(id, todayStr)
    showToast("Medication status updated")
  }

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newHabitTitle.trim()) return
    await habitRepository.add(newHabitTitle.trim(), newHabitCategory)
    setNewHabitTitle('')
    setShowAddHabitModal(false)
    showToast("Habit created")
  }

  const handleCreateMedication = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMedName.trim()) return
    await medicationRepository.add(newMedName.trim(), newMedDosage.trim(), newMedTime.trim(), newMedInstructions.trim())
    setNewMedName('')
    setNewMedInstructions('')
    setShowAddMedModal(false)
    showToast("Medication reminder added")
  }

  const currentWaterMl = hydration?.amountMl ?? 1500
  const goalWaterMl = hydration?.goalMl ?? 2500
  const hydrationPercent = Math.min(100, Math.round((currentWaterMl / goalWaterMl) * 100))

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

      {/* 1. TOP HEADER: Back button + Title + Settings */}
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
            Health & Biometrics
          </h2>
          <span className="text-[10px] font-mono text-purple-300/80">
            {isSimulated ? 'Virtual Simulator' : 'Nordic HRS • BLE Live'}
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setShowGoalModal(true)}
          className="w-10 h-10 rounded-full bg-[#161224] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md"
          title="Adjust Daily Goals"
        >
          <MoreHorizontal className="w-5 h-5" />
        </motion.button>
      </div>

      {/* 2. SEGMENTED CONTROL BAR: Overview | Activity | Heart Rate | Wellness */}
      <div className="flex items-center p-1 rounded-2xl bg-[#161224] border border-white/[0.08] shadow-inner">
        {(['overview', 'activity', 'heart', 'wellness'] as const).map((tab) => {
          const isSelected = activeSubTab === tab
          return (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              className={`flex-1 relative py-2 rounded-xl text-xs font-bold capitalize transition-colors text-center ${
                isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="healthSubTabPill"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 shadow-md shadow-pink-600/30"
                />
              )}
              <span className="relative z-10">
                {tab === 'heart' ? 'Heart Rate' : tab === 'wellness' ? 'Wellness' : tab}
              </span>
            </button>
          )
        })}
      </div>

      {/* Live Sync Status & Manual Trigger Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-2xl bg-[#161224]/80 border border-white/[0.06] text-xs">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-500'}`} />
          <span className="text-slate-300 font-medium text-[11px]">
            {isConnected ? 'WatchOS Telemetry Live' : 'WatchOS Disconnected'}
          </span>
          {isConnected && (
            <span className="text-[10px] text-purple-300 font-mono">
              • {(watch.stepCount || 0).toLocaleString()} steps
            </span>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={handleSyncWatch}
          disabled={isSyncing}
          className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white/[0.05] hover:bg-purple-500/20 border border-white/[0.08] hover:border-purple-500/30 text-purple-300 flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-pink-400' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : isConnected ? 'Sync Watch' : 'Connect'}</span>
        </motion.button>
      </div>

      {/* 3. SUBTAB VIEWS */}
      <AnimatePresence mode="wait">
        
        {/* ========================================================= */}
        {/* VIEW A: OVERVIEW                                          */}
        {/* ========================================================= */}
        {activeSubTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-5"
          >
            {/* Primary Activity Ring Card */}
            <div className="p-7 rounded-3xl border border-purple-500/30 bg-[#161224] backdrop-blur-2xl shadow-2xl flex flex-col items-center relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-purple-600/20 via-pink-600/20 to-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

              <ActivityRing
                steps={displaySteps}
                goal={stepGoal}
                calories={Math.round(displaySteps * 0.04)}
                distanceKm={parseFloat((displaySteps * 0.00075).toFixed(1))}
                activeMinutes={Math.round(displaySteps / 160)}
                size={220}
              />
            </div>

            {/* Quick 2-Column: Activity Trend + Heart Pulse */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Activity Trend Pillar Bar */}
              <div className="p-5 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
                    <span>Weekly Steps</span>
                  </span>
                  <span className="text-[10px] font-mono text-purple-300 font-bold">Past 7 Days</span>
                </div>

                <div className="flex items-end justify-between gap-1.5 h-28 pt-2">
                  {weeklyData.map((item) => (
                    <div key={item.day} className="flex-1 flex flex-col items-center gap-1.5">
                      <div className="w-full h-20 flex items-end justify-center">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${item.percent}%` }}
                          transition={{ duration: 0.6 }}
                          className={`w-full max-w-[14px] rounded-t-md ${
                            item.isToday
                              ? 'bg-gradient-to-t from-purple-600 to-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.8)]'
                              : 'bg-purple-900/60 hover:bg-purple-700/80'
                          }`}
                        />
                      </div>
                      <span className="text-[9px] font-mono font-bold text-slate-400">{item.day}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heart Rate Wave Card */}
              <div className="p-5 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />
                    <span>Heart Rate</span>
                  </span>
                  <span className="text-lg font-black font-mono text-white">
                    {displayHeartRate} <span className="text-[10px] text-pink-300 font-sans">BPM</span>
                  </span>
                </div>

                {/* Mini ECG path */}
                <div className="h-20 rounded-2xl bg-[#0f0b1a] border border-white/[0.06] flex items-center justify-center overflow-hidden px-1">
                  <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
                    <path
                      d="M 0 30 L 30 30 L 40 18 L 50 42 L 60 8 L 70 50 L 80 30 L 120 30 L 130 18 L 140 42 L 150 8 L 160 50 L 170 30 L 200 30"
                      fill="none"
                      stroke="#ec4899"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Monthly Statistics Summary */}
            <div className="p-5 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>30-Day Activity Summary</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">+12% vs last month</span>
              </div>

              <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                <div className="p-2.5 rounded-2xl bg-[#0f0b1a] border border-white/[0.04]">
                  <span className="text-[9px] text-slate-400 font-mono">Total Dist</span>
                  <p className="text-xs font-black text-white font-mono mt-0.5">142.6 km</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#0f0b1a] border border-white/[0.04]">
                  <span className="text-[9px] text-slate-400 font-mono">Calories</span>
                  <p className="text-xs font-black text-white font-mono mt-0.5">8,420 kcal</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#0f0b1a] border border-white/[0.04]">
                  <span className="text-[9px] text-slate-400 font-mono">Daily Avg</span>
                  <p className="text-xs font-black text-white font-mono mt-0.5">8,240 st</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-[#0f0b1a] border border-white/[0.04]">
                  <span className="text-[9px] text-slate-400 font-mono">Active Hrs</span>
                  <p className="text-xs font-black text-white font-mono mt-0.5">28.4 h</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* VIEW B: ACTIVITY DEEP-DIVE                                */}
        {/* ========================================================= */}
        {activeSubTab === 'activity' && (
          <motion.div
            key="activity"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Step Goal Banner */}
            <div className="p-5 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">DAILY STEP TARGET</span>
                <h3 className="text-xl font-black text-white font-mono">{stepGoal.toLocaleString()} Steps</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Current: {displaySteps.toLocaleString()} ({Math.round((displaySteps / stepGoal) * 100)}%)
                </p>
              </div>

              <button
                onClick={() => setShowGoalModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold border border-purple-500/30"
              >
                Change Goal
              </button>
            </div>

            {/* Weekly Activity Pillars */}
            <div className="p-5 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white tracking-tight">Weekly Activity Performance</h3>
                <span className="text-xs font-mono font-bold text-pink-400">7-Day Consistency: 86%</span>
              </div>

              <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-1">
                {weeklyData.map((item) => (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end justify-center h-28">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${item.percent}%` }}
                        transition={{ duration: 0.6 }}
                        className={`w-full max-w-[20px] rounded-t-xl ${
                          item.isToday
                            ? 'bg-gradient-to-t from-purple-600 to-pink-500 shadow-[0_0_14px_rgba(236,72,153,0.8)]'
                            : 'bg-purple-900/60'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">{item.day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily Metric Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#161224] border border-white/[0.06] text-center">
                <Flame className="w-4 h-4 text-orange-400 mx-auto" />
                <span className="text-[10px] font-mono text-slate-400 mt-1 block">Calories</span>
                <p className="text-sm font-bold text-white font-mono mt-0.5">{Math.round(displaySteps * 0.04)} kcal</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#161224] border border-white/[0.06] text-center">
                <Clock className="w-4 h-4 text-sky-400 mx-auto" />
                <span className="text-[10px] font-mono text-slate-400 mt-1 block">Active Time</span>
                <p className="text-sm font-bold text-white font-mono mt-0.5">{Math.round(displaySteps / 160)} mins</p>
              </div>
              <div className="p-4 rounded-2xl bg-[#161224] border border-white/[0.06] text-center">
                <Award className="w-4 h-4 text-purple-400 mx-auto" />
                <span className="text-[10px] font-mono text-slate-400 mt-1 block">Distance</span>
                <p className="text-sm font-bold text-white font-mono mt-0.5">{(displaySteps * 0.00075).toFixed(1)} km</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* VIEW C: HEART RATE & ZONES                                */}
        {/* ========================================================= */}
        {activeSubTab === 'heart' && (
          <motion.div
            key="heart"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Real-time BPM Banner */}
            <div className="p-6 rounded-3xl bg-[#161224] border border-purple-500/30 shadow-2xl text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-pink-500/20 border border-pink-400/40 text-pink-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(236,72,153,0.4)]">
                <Heart className="w-7 h-7 fill-current animate-pulse" />
              </div>

              <div>
                <h3 className="text-4xl font-black text-white font-mono">
                  {displayHeartRate} <span className="text-xs font-sans text-pink-300 font-bold">BPM</span>
                </h3>
                <p className="text-xs text-purple-200/80 mt-1">
                  Continuous Bluetooth GATT Heart Rate (0x180D)
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-2 max-w-xs mx-auto">
                <div className="p-2.5 rounded-xl bg-[#0f0b1a] border border-white/[0.06]">
                  <span className="text-[9px] font-mono text-slate-400">Resting</span>
                  <p className="text-sm font-bold font-mono text-white">64 BPM</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0f0b1a] border border-pink-500/30">
                  <span className="text-[9px] font-mono text-pink-400">Current</span>
                  <p className="text-sm font-bold font-mono text-white">{displayHeartRate} BPM</p>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0f0b1a] border border-white/[0.06]">
                  <span className="text-[9px] font-mono text-slate-400">Peak</span>
                  <p className="text-sm font-bold font-mono text-white">118 BPM</p>
                </div>
              </div>
            </div>

            {/* Heart Rate Zones Breakdown */}
            <div className="p-5 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Heart Rate Training Zones</span>
              </h3>

              <div className="space-y-2.5 pt-1 text-xs">
                {/* Zone 1: Rest */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300 font-medium">Zone 1: Rest (&lt; 60 BPM)</span>
                    <span className="font-mono text-slate-400">12% of day</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#0f0b1a] overflow-hidden">
                    <div className="w-[12%] h-full rounded-full bg-blue-400" />
                  </div>
                </div>

                {/* Zone 2: Fat Burn */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300 font-medium">Zone 2: Fat Burn (60–100 BPM)</span>
                    <span className="font-mono text-emerald-400 font-bold">68% of day (Optimal)</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#0f0b1a] overflow-hidden">
                    <div className="w-[68%] h-full rounded-full bg-emerald-400" />
                  </div>
                </div>

                {/* Zone 3: Aerobic */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300 font-medium">Zone 3: Aerobic Cardio (100–140 BPM)</span>
                    <span className="font-mono text-amber-400">16% of day</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#0f0b1a] overflow-hidden">
                    <div className="w-[16%] h-full rounded-full bg-amber-400" />
                  </div>
                </div>

                {/* Zone 4: Peak */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-300 font-medium">Zone 4: Peak (&gt; 140 BPM)</span>
                    <span className="font-mono text-rose-400">4% of day</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#0f0b1a] overflow-hidden">
                    <div className="w-[4%] h-full rounded-full bg-rose-500" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => sendWatchAlert("Heart check: 78 BPM normal resting rhythm")}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 flex items-center gap-2"
              >
                <Watch className="w-3.5 h-3.5" />
                <span>Test Wrist Telemetry Alert</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* VIEW D: WELLNESS (Habits, Hydration, Medications)         */}
        {/* ========================================================= */}
        {activeSubTab === 'wellness' && (
          <motion.div
            key="wellness"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* 1. Daily Hydration Card */}
            <div className="p-5 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-sky-400" />
                  <h3 className="text-sm font-bold text-white">Daily Hydration</h3>
                </div>
                <span className="text-xs font-bold text-sky-300 font-mono">
                  {currentWaterMl} / {goalWaterMl} ml ({hydrationPercent}%)
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-[#0f0b1a] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${hydrationPercent}%` }}
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 via-cyan-400 to-teal-400 shadow-[0_0_10px_rgba(56,189,248,0.6)]"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  {currentWaterMl >= goalWaterMl ? 'Goal reached!' : `${goalWaterMl - currentWaterMl} ml to reach goal`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddWater(250)}
                    className="px-2.5 py-1 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>250ml</span>
                  </button>
                  <button
                    onClick={() => handleAddWater(500)}
                    className="px-2.5 py-1 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>500ml</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Habits & Streaks */}
            <div className="p-5 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Habit Consistency</span>
                </h3>
                <button
                  onClick={() => setShowAddHabitModal(true)}
                  className="px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Habit</span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {habits.map((habit) => {
                  const isCompletedToday = habit.completedDates?.includes(todayStr)
                  return (
                    <div
                      key={habit.id}
                      onClick={() => handleToggleHabit(habit.id)}
                      className="p-3 rounded-2xl bg-[#0f0b1a] border border-white/[0.04] hover:border-emerald-500/30 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                          isCompletedToday
                            ? 'bg-emerald-500 text-white shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                            : 'border-2 border-slate-600'
                        }`}>
                          {isCompletedToday && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className={`text-xs font-semibold ${isCompletedToday ? 'line-through text-slate-500' : 'text-white'}`}>
                          {habit.title}
                        </span>
                      </div>

                      <span className="text-xs font-mono font-bold text-amber-400">
                        🔥 {habit.streakCount} days
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 3. Medication Reminders */}
            <div className="p-5 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white">Daily Medications</h3>
                </div>
                <button
                  onClick={() => setShowAddMedModal(true)}
                  className="px-2.5 py-1 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Med</span>
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {medications.map((med) => {
                  const isTaken = med.takenDates?.includes(todayStr)
                  return (
                    <div
                      key={med.id}
                      onClick={() => handleToggleMedication(med.id)}
                      className="p-3 rounded-2xl bg-[#0f0b1a] border border-white/[0.04] flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{med.name}</span>
                          <span className="text-[10px] text-purple-300 font-mono px-1.5 py-0.2 rounded bg-purple-500/10">
                            {med.dosage}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Scheduled: {med.scheduleTime} {med.instructions && `• ${med.instructions}`}
                        </p>
                      </div>

                      <button
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                          isTaken
                            ? 'bg-emerald-500 text-white shadow-md'
                            : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
                        }`}
                      >
                        {isTaken ? 'Taken' : 'Take'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Medical Disclaimer Banner */}
      <div className="p-3 rounded-2xl bg-[#161224] border border-white/[0.04] flex items-center gap-2.5 text-[10px] text-slate-400">
        <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />
        <span>
          WristOS health, hydration, and activity telemetry is intended for general wellness tracking and does not constitute medical advice or clinical diagnosis.
        </span>
      </div>

      {/* GOAL MODAL */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-white/[0.12] bg-[#161224] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white">Daily Step Goal</h3>
                <button onClick={() => setShowGoalModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[6000, 8000, 10000, 12000].map((goal) => (
                  <button
                    key={goal}
                    onClick={() => {
                      setStepGoal(goal)
                      setShowGoalModal(false)
                      showToast(`Daily step goal set to ${goal.toLocaleString()}`)
                    }}
                    className={`py-3 rounded-2xl font-mono font-bold text-xs border transition-all ${
                      stepGoal === goal
                        ? 'bg-purple-600 text-white border-purple-500'
                        : 'bg-[#0f0b1a] text-slate-300 border-white/10 hover:border-purple-500/40'
                    }`}
                  >
                    {goal.toLocaleString()} st
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD HABIT MODAL */}
      <AnimatePresence>
        {showAddHabitModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-white/[0.12] bg-[#161224] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white">Create Daily Habit</h3>
                <button onClick={() => setShowAddHabitModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateHabit} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-purple-200">Habit Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 15-minute Morning Stretch"
                    value={newHabitTitle}
                    onChange={(e) => setNewHabitTitle(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-purple-200">Category</label>
                  <select
                    value={newHabitCategory}
                    onChange={(e) => setNewHabitCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-[#0f0b1a] border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Health">Health</option>
                    <option value="Focus">Focus</option>
                    <option value="Mindset">Mindset</option>
                    <option value="Routine">Routine</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddHabitModal(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                  >
                    Save Habit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD MEDICATION MODAL */}
      <AnimatePresence>
        {showAddMedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-white/[0.12] bg-[#161224] p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white">Add Medication Schedule</h3>
                <button onClick={() => setShowAddMedModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateMedication} className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-purple-200">Medication Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vitamin B12"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-purple-200">Dosage</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 Tablet"
                      value={newMedDosage}
                      onChange={(e) => setNewMedDosage(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-purple-200">Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 08:00 AM"
                      value={newMedTime}
                      onChange={(e) => setNewMedTime(e.target.value)}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-purple-200">Instructions (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. With breakfast"
                    value={newMedInstructions}
                    onChange={(e) => setNewMedInstructions(e.target.value)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMedModal(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                  >
                    Save Medication
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
