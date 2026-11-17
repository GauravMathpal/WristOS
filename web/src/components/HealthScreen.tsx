import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Heart, 
  ChevronDown, 
  ShieldCheck,
  Watch
} from 'lucide-react'
import { ActivityRing } from './ActivityRing'
import { FocusTimer } from './FocusTimer'
import { useAppStore } from '../stores/useAppStore'

export function HealthScreen() {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'activity' | 'heart' | 'focus'>('overview')
  const { watch, sendWatchAlert } = useAppStore()

  const isConnected = watch.connectionState === 'connected'
  const displaySteps = watch.stepCount > 0 ? watch.stepCount : 7842
  const displayHeartRate = watch.heartRate > 0 ? watch.heartRate : 78

  // Days for the activity trend bar chart
  const weeklyData = [
    { day: 'Mon', percent: 45, steps: '4,500' },
    { day: 'Tue', percent: 65, steps: '6,500' },
    { day: 'Wed', percent: 50, steps: '5,000' },
    { day: 'Thu', percent: 85, steps: '8,500' },
    { day: 'Fri', percent: 95, steps: '9,500', isToday: true },
    { day: 'Sat', percent: 60, steps: '6,000' },
    { day: 'Sun', percent: 40, steps: '4,000' }
  ]

  return (
    <div className="space-y-6">
      
      {/* Header & Sub-Navigation Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-semibold">HEALTH & BIOMETRICS</span>
            {isConnected && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Nordic HRS Live</span>
              </span>
            )}
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Health Intelligence</h2>
        </div>

        {/* Sub-tab pills with sliding motion indicator */}
        <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto">
          {(['overview', 'activity', 'heart', 'focus'] as const).map((tab) => {
            const isSelected = activeSubTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors shrink-0 ${
                  isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="healthSubTabPill"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 shadow-md shadow-purple-600/30"
                  />
                )}
                <span className="relative z-10">{tab}</span>
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* OVERVIEW / ACTIVITY VIEW */}
        {(activeSubTab === 'overview' || activeSubTab === 'activity') && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Primary Activity Ring Card */}
            <div className="p-7 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-2xl flex flex-col items-center shadow-xl">
              <ActivityRing
                steps={displaySteps}
                goal={10000}
                calories={Math.round(displaySteps * 0.04)}
                distanceKm={parseFloat((displaySteps * 0.00075).toFixed(1))}
                activeMinutes={Math.round(displaySteps / 160)}
                size={230}
              />
            </div>

            {/* Two Column Section: Trend Bar Chart & Heart Rate Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Activity Trend Card */}
              <motion.div
                whileHover={{ y: -3, scale: 1.008 }}
                transition={{ duration: 0.2 }}
                className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Activity Trend</h3>
                    <p className="text-[11px] text-slate-400">Weekly step consistency</p>
                  </div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                    <span>This Week</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>

                {/* Animated Bars */}
                <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-1 px-2">
                  {weeklyData.map((item, i) => (
                    <div key={item.day} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="relative w-full flex items-end justify-center h-28">
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${item.percent}%` }}
                          transition={{ delay: 0.1 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className={`w-full max-w-[20px] rounded-t-lg transition-all ${
                            item.isToday
                              ? 'bg-gradient-to-t from-purple-600 to-pink-500 shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                              : 'bg-white/[0.1] hover:bg-white/[0.2]'
                          }`}
                        />
                      </div>
                      <span className={`text-[10px] font-mono ${item.isToday ? 'text-pink-400 font-bold' : 'text-slate-500'}`}>
                        {item.day}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Heart Rate Wave Card */}
              <motion.div
                whileHover={{ y: -3, scale: 1.008 }}
                transition={{ duration: 0.2 }}
                className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl flex flex-col justify-between space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center">
                      <Heart className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">Heart Rate</h3>
                      <p className="text-[11px] text-slate-400">Cardio pulse sensor (HRS 0x180D)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-1 justify-end">
                      <span>{displayHeartRate}</span>
                      <span className="text-xs font-sans text-slate-400">BPM</span>
                    </div>
                  </div>
                </div>

                {/* Animated ECG Pulse Curve */}
                <div className="relative h-24 overflow-hidden rounded-xl bg-white/[0.01] border border-white/[0.04] flex items-center justify-center px-2">
                  <svg className="w-full h-full" viewBox="0 0 300 80" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
                        <stop offset="50%" stopColor="#ec4899" stopOpacity="1" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0.2" />
                      </linearGradient>
                    </defs>

                    {/* Smooth ECG path with spring-like stroke offset */}
                    <motion.path
                      d="M 0 40 L 40 40 L 55 25 L 70 55 L 85 10 L 100 65 L 115 40 L 170 40 L 185 25 L 200 55 L 215 10 L 230 65 L 245 40 L 300 40"
                      fill="none"
                      stroke="url(#ecgGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      animate={{
                        strokeDashoffset: [0, -300]
                      }}
                      strokeDasharray="300"
                      transition={{
                        repeat: Infinity,
                        duration: 3.5,
                        ease: 'linear'
                      }}
                    />
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Resting Heart Rate: Normal</span>
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">PINETIME GATT</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* HEART RATE DEEP DIVE */}
        {activeSubTab === 'heart' && (
          <motion.div
            key="heart"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="p-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-6 text-center"
          >
            <div className="w-16 h-16 rounded-3xl bg-pink-500/10 border border-pink-500/20 text-pink-400 flex items-center justify-center mx-auto shadow-[0_0_24px_rgba(236,72,153,0.3)]">
              <Heart className="w-8 h-8 fill-current" />
            </div>

            <div className="space-y-2">
              <h3 className="text-3xl font-extrabold text-white font-mono">{displayHeartRate} <span className="text-sm font-sans text-slate-400">BPM</span></h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Continuous biometric sampling over Bluetooth GATT Heart Rate Service (0x180D). Wrist haptic notifications trigger if rhythm exceeds threshold.
              </p>
            </div>

            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => sendWatchAlert("Heart check: 78 BPM normal")}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-pink-300 border border-pink-500/30 flex items-center gap-2"
              >
                <Watch className="w-3.5 h-3.5" />
                <span>Test Wrist Telemetry Alert</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* FOCUS TIMER VIEW */}
        {activeSubTab === 'focus' && (
          <motion.div
            key="focus"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="p-8 rounded-3xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl flex flex-col items-center justify-center space-y-4"
          >
            <div className="space-y-1 text-center mb-2">
              <h3 className="text-lg font-bold text-white">Focus & Productivity Session</h3>
              <p className="text-xs text-slate-400">Deep work countdown with automated wrist haptic alerts</p>
            </div>
            
            <FocusTimer defaultDurationMinutes={25} size={240} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
