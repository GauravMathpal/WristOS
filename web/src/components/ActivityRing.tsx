import { motion } from 'motion/react'
import { Footprints, Flame, MapPin, Zap } from 'lucide-react'

interface ActivityRingProps {
  steps?: number
  goal?: number
  calories?: number
  distanceKm?: number
  activeMinutes?: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function ActivityRing({
  steps = 7842,
  goal = 10000,
  calories = 312,
  distanceKm = 5.4,
  activeMinutes = 48,
  size = 230,
  strokeWidth = 18,
  className = ''
}: ActivityRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(1, Math.max(0, steps / goal))
  const strokeDashoffset = circumference - progress * circumference

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Circular Progress Container */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        
        {/* Soft radial glow behind the ring */}
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.35, 0.5, 0.35]
          }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="absolute inset-4 rounded-full bg-gradient-to-tr from-purple-600/30 via-fuchsia-500/25 to-pink-500/30 blur-2xl pointer-events-none"
        />

        <svg width={size} height={size} className="rotate-[-90deg]">
          <defs>
            <linearGradient id="activityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="50%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="var(--ring-track, rgba(255, 255, 255, 0.07))"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Active Progress Circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#activityGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
            filter="url(#glow)"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-9 h-9 rounded-full bg-purple-500/15 border border-purple-400/25 flex items-center justify-center text-purple-300 mb-1 shadow-[0_0_12px_rgba(168,85,247,0.35)]"
          >
            <Footprints className="w-4 h-4" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-3xl font-black tracking-tight text-white font-mono"
          >
            {steps.toLocaleString()}
          </motion.div>

          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider text-[10px]">
            steps ({Math.round(progress * 100)}%)
          </span>
        </div>
      </div>

      {/* Sub-Metrics Row (Calories, Distance, Active Time) */}
      <div className="grid grid-cols-3 gap-3 w-full mt-6">
        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/30 flex flex-col items-center text-center backdrop-blur-md"
        >
          <div className="w-7 h-7 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-1.5">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-bold text-white font-mono">{calories}</span>
          <span className="text-[10px] text-slate-400 font-medium">kcal</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/30 flex flex-col items-center text-center backdrop-blur-md"
        >
          <div className="w-7 h-7 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-1.5">
            <MapPin className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-bold text-white font-mono">{distanceKm}</span>
          <span className="text-[10px] text-slate-400 font-medium">km</span>
        </motion.div>

        <motion.div
          whileHover={{ y: -3, scale: 1.02 }}
          transition={{ duration: 0.2 }}
          className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/30 flex flex-col items-center text-center backdrop-blur-md"
        >
          <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-1.5">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-bold text-white font-mono">{activeMinutes}</span>
          <span className="text-[10px] text-slate-400 font-medium">min Active</span>
        </motion.div>
      </div>
    </div>
  )
}
