import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Heart, 
  ChevronDown, 
  ShieldCheck,
  Watch,
  TrendingUp,
  Activity
} from 'lucide-react'
import { ActivityRing } from './ActivityRing'
import { FocusTimer } from './FocusTimer'
import { useAppStore } from '../stores/useAppStore'
import { activityRepository } from '../lib/repository'

export function HealthScreen() {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'activity' | 'heart' | 'focus'>('overview')
  const [hoveredDay, setHoveredDay] = useState<{ day: string; steps: string; percent: number } | null>(null)
  const { watch, sendWatchAlert } = useAppStore()

  const isConnected = watch.connectionState === 'connected'
  const displaySteps = watch.stepCount > 0 ? watch.stepCount : 7842
  const displayHeartRate = watch.heartRate > 0 ? watch.heartRate : 78

  // Live weekly logs from Dexie
  const weeklyLogs = useLiveQuery(() => activityRepository.getWeekly()) || []

  // Auto-record today's biometrics to Dexie
  useEffect(() => {
    activityRepository.recordDailyMetrics({
      steps: displaySteps,
      heartRateAvg: displayHeartRate
    })
  }, [displaySteps, displayHeartRate])

  // Map weekly logs into the bar chart or fallback to standard week
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const todayIndex = new Date().getDay()
  const todayDayName = dayNames[todayIndex]

  const weeklyData = weeklyLogs.length >= 7 
    ? weeklyLogs.slice(-7).map((log) => {
        const d = new Date(log.date)
        const day = dayNames[d.getDay()]
        const percent = Math.min(100, Math.round((log.steps / log.stepGoal) * 100))
        return {
          day,
          percent,
          steps: log.steps.toLocaleString(),
          isToday: day === todayDayName
        }
      })
    : [
        { day: 'Mon', percent: 55, steps: '5,500', isToday: todayDayName === 'Mon' },
        { day: 'Tue', percent: 70, steps: '7,020', isToday: todayDayName === 'Tue' },
        { day: 'Wed', percent: 60, steps: '6,140', isToday: todayDayName === 'Wed' },
        { day: 'Thu', percent: 85, steps: '8,510', isToday: todayDayName === 'Thu' },
        { day: 'Fri', percent: 95, steps: '9,842', isToday: todayDayName === 'Fri' },
        { day: 'Sat', percent: 78, steps: '7,842', isToday: todayDayName === 'Sat' },
        { day: 'Sun', percent: 45, steps: '4,500', isToday: todayDayName === 'Sun' }
      ]

  return (
    <div className="space-y-6">
      
      {/* Header & Sub-Navigation Pills (From Mockup Screen 3) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-purple-500/25 bg-gradient-to-r from-[#1c123b]/85 via-[#140e2b]/80 to-[#0e0820]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-pink-400" />
              <span>HEALTH & BIOMETRICS</span>
            </span>
            {isConnected && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>HRS 0x180D Live</span>
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            Health Intelligence
          </h2>
          <p className="text-xs text-purple-200/80 font-medium">
            Biometric telemetry streaming continuously from your PineTime smartwatch
          </p>
        </div>

        {/* Sub-tab pills with sliding motion indicator */}
        <div className="flex items-center p-1.5 rounded-2xl bg-[#0d091d]/80 border border-purple-500/25 shadow-inner overflow-x-auto">
          {(['overview', 'activity', 'heart', 'focus'] as const).map((tab) => {
            const isSelected = activeSubTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`relative px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors shrink-0 ${
                  isSelected ? 'text-white' : 'text-slate-400 hover:text-purple-200'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="healthSubTabPill"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 shadow-md shadow-pink-600/30"
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* OVERVIEW / ACTIVITY VIEW (From Mockup Screen 3) */}
        {(activeSubTab === 'overview' || activeSubTab === 'activity') && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Primary Activity Ring Card (Mockup Screen 3 Top) */}
            <div className="p-8 sm:p-10 rounded-3xl border border-purple-500/30 bg-gradient-to-b from-[#221345]/90 via-[#150d2c]/85 to-[#0b071a]/95 backdrop-blur-2xl shadow-2xl shadow-purple-950/40 flex flex-col items-center relative overflow-hidden">
              {/* Soft ambient breathing radial glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-tr from-purple-600/25 via-pink-600/30 to-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

              <ActivityRing
                steps={displaySteps}
                goal={10000}
                calories={Math.round(displaySteps * 0.04)}
                distanceKm={parseFloat((displaySteps * 0.00075).toFixed(1))}
                activeMinutes={Math.round(displaySteps / 160)}
                size={240}
              />
            </div>

            {/* Two Column Section: Trend Bar Chart & Heart Rate Card (Mockup Screen 3 Bottom) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Activity Trend Card */}
              <motion.div
                whileHover={{ y: -3, scale: 1.008 }}
                transition={{ duration: 0.2 }}
                className="p-6 rounded-3xl border border-purple-500/25 bg-gradient-to-b from-[#1b1236]/85 via-[#130d29]/80 to-[#0b081d]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span>Activity Trend</span>
                    </h3>
                    <p className="text-[11px] text-purple-300/80 font-medium">Daily step consistency</p>
                  </div>
                  
                  <div className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-200 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 shadow-sm">
                    <span>This Week</span>
                    <ChevronDown className="w-3 h-3 text-purple-300" />
                  </div>
                </div>

                {/* Animated Glowing Pillar Bars */}
                <div className="relative">
                  {hoveredDay && (
                    <motion.div 
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-6 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-lg bg-pink-500/90 text-white text-[10px] font-mono font-bold shadow-lg shadow-pink-500/40 pointer-events-none"
                    >
                      {hoveredDay.day}: {hoveredDay.steps} steps ({hoveredDay.percent}%)
                    </motion.div>
                  )}

                  <div className="flex items-end justify-between gap-2.5 h-36 pt-4 pb-1 px-1">
                    {weeklyData.map((item, i) => (
                      <div 
                        key={item.day} 
                        className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                        onMouseEnter={() => setHoveredDay(item)}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        <div className="relative w-full flex items-end justify-center h-28">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${item.percent}%` }}
                            transition={{ delay: 0.08 + i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                            className={`w-full max-w-[22px] rounded-t-xl transition-all ${
                              item.isToday
                                ? 'bg-gradient-to-t from-purple-600 via-pink-500 to-rose-400 shadow-[0_0_20px_rgba(236,72,153,0.85)] scale-y-105'
                                : 'bg-gradient-to-t from-indigo-900/90 via-purple-700/80 to-purple-400/90 shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:brightness-125'
                            }`}
                          />
                        </div>
                        <span className={`text-[10px] font-mono font-bold transition-colors ${
                          item.isToday 
                            ? 'text-pink-400 drop-shadow-[0_0_6px_rgba(236,72,153,0.7)]' 
                            : 'text-purple-300/70 group-hover:text-purple-200'
                        }`}>
                          {item.day}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Heart Rate Wave Card (Mockup Screen 3 Bottom Right) */}
              <motion.div
                whileHover={{ y: -3, scale: 1.008 }}
                transition={{ duration: 0.2 }}
                className="p-6 rounded-3xl border border-purple-500/25 bg-gradient-to-b from-[#1b1236]/85 via-[#130d29]/80 to-[#0b081d]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25 flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500/30 to-purple-500/20 border border-pink-400/40 text-pink-400 flex items-center justify-center shadow-[0_0_16px_rgba(236,72,153,0.45)]">
                      <Heart className="w-5 h-5 fill-current animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-white tracking-tight">Heart Rate</h3>
                      <p className="text-[11px] text-purple-300/80 font-medium">Nordic HRS 0x180D</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-3xl font-black font-mono text-white flex items-baseline gap-1 justify-end drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                      <span>{displayHeartRate}</span>
                      <span className="text-xs font-sans text-pink-300 font-bold">BPM</span>
                    </div>
                  </div>
                </div>

                {/* Animated Glowing ECG Pulse Curve */}
                <div className="relative h-24 overflow-hidden rounded-2xl bg-[#0e0921]/90 border border-purple-500/20 flex items-center justify-center px-2 shadow-inner">
                  <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                        <stop offset="35%" stopColor="#a855f7" stopOpacity="0.9" />
                        <stop offset="65%" stopColor="#ec4899" stopOpacity="1" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.8" />
                      </linearGradient>
                      <filter id="ecgGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Smooth ECG path with spring-like stroke offset */}
                    <motion.path
                      d="M 0 40 L 40 40 L 55 25 L 70 55 L 85 10 L 100 65 L 115 40 L 170 40 L 185 25 L 200 55 L 215 10 L 230 65 L 245 40 L 300 40"
                      fill="none"
                      stroke="url(#ecgGrad)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#ecgGlow)"
                      animate={{
                        strokeDashoffset: [0, -300]
                      }}
                      strokeDasharray="300"
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: 'linear'
                      }}
                    />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[11px] text-purple-300/80 pt-1">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Zone: Normal Resting Cardio</span>
                  </span>
                  <span className="font-mono text-[10px] text-purple-400 font-bold">PINETIME GATT</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* HEART RATE DEEP DIVE */}
        {activeSubTab === 'heart' && (
          <motion.div
            key="heart"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="p-8 sm:p-12 rounded-3xl border border-purple-500/30 bg-gradient-to-b from-[#221345]/90 via-[#150d2c]/85 to-[#0b071a]/95 backdrop-blur-2xl shadow-2xl shadow-purple-950/40 space-y-7 text-center relative overflow-hidden"
          >
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-pink-500/30 to-purple-500/20 border border-pink-400/40 text-pink-400 flex items-center justify-center mx-auto shadow-[0_0_35px_rgba(236,72,153,0.5)]">
              <Heart className="w-10 h-10 fill-current animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-4xl font-black text-white font-mono drop-shadow-[0_0_15px_rgba(236,72,153,0.6)]">
                {displayHeartRate} <span className="text-sm font-sans text-pink-300 font-bold">BPM</span>
              </h3>
              <p className="text-xs text-purple-200/80 max-w-md mx-auto font-medium">
                Continuous biometric sampling over Bluetooth GATT Heart Rate Service (0x180D). Wrist haptic notifications trigger automatically if heart rate spikes above 120 BPM.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto pt-2">
              <div className="p-3 rounded-2xl bg-[#140e29] border border-purple-500/20 text-center">
                <span className="text-[10px] font-mono text-purple-400 uppercase">Resting</span>
                <p className="text-lg font-bold font-mono text-white">64 <span className="text-[10px] font-sans">BPM</span></p>
              </div>
              <div className="p-3 rounded-2xl bg-[#140e29] border border-pink-500/30 text-center shadow-[0_0_12px_rgba(236,72,153,0.2)]">
                <span className="text-[10px] font-mono text-pink-400 uppercase">Current</span>
                <p className="text-lg font-bold font-mono text-white">{displayHeartRate} <span className="text-[10px] font-sans">BPM</span></p>
              </div>
              <div className="p-3 rounded-2xl bg-[#140e29] border border-purple-500/20 text-center">
                <span className="text-[10px] font-mono text-purple-400 uppercase">Peak Today</span>
                <p className="text-lg font-bold font-mono text-white">118 <span className="text-[10px] font-sans">BPM</span></p>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => sendWatchAlert("Heart check: 78 BPM normal resting rhythm")}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-pink-500/30 flex items-center gap-2"
              >
                <Watch className="w-4 h-4" />
                <span>Test Wrist Telemetry Alert</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* FOCUS TIMER VIEW */}
        {activeSubTab === 'focus' && (
          <motion.div
            key="focus"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="p-8 sm:p-12 rounded-3xl border border-purple-500/30 bg-gradient-to-b from-[#221345]/90 via-[#150d2c]/85 to-[#0b071a]/95 backdrop-blur-2xl shadow-2xl shadow-purple-950/40 flex flex-col items-center justify-center space-y-5"
          >
            <div className="space-y-1 text-center mb-2">
              <h3 className="text-xl font-extrabold text-white tracking-tight">Focus & Productivity Session</h3>
              <p className="text-xs text-purple-200/80 font-medium">Deep work countdown with automated wrist haptic alerts</p>
            </div>
            
            <FocusTimer defaultDurationMinutes={25} size={250} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
