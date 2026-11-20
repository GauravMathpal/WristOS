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
  size = 240,
  strokeWidth = 20,
  className = ''
}: ActivityRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(1, Math.max(0, steps / goal))
  const strokeDashoffset = circumference - progress * circumference

  return (
    <div className={`flex flex-col items-center w-full ${className}`}>
      {/* Circular Progress Container with Ambient Glow */}
      <div className="relative flex items-center justify-center my-2" style={{ width: size, height: size }}>
        
        {/* Deep ambient radial backlights */}
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.45, 0.75, 0.45]
          }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
          className="absolute inset-4 rounded-full bg-gradient-to-tr from-purple-600/40 via-fuchsia-500/35 to-pink-500/45 blur-3xl pointer-events-none"
        />

        <svg width={size} height={size} className="rotate-[-90deg] overflow-visible">
          <defs>
            <linearGradient id="vibrantActivityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="35%" stopColor="#a855f7" />
              <stop offset="70%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <filter id="ringGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(168, 85, 247, 0.16)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Glowing Progress Circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#vibrantActivityGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            filter="url(#ringGlow)"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500/30 to-pink-500/30 border border-pink-400/40 flex items-center justify-center text-pink-300 mb-1 shadow-[0_0_15px_rgba(236,72,153,0.5)]"
          >
            <Footprints className="w-5 h-5 drop-shadow-[0_0_6px_rgba(236,72,153,0.8)]" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-4xl font-extrabold tracking-tight text-white font-mono drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
          >
            {steps.toLocaleString()}
          </motion.div>

          <span className="text-xs font-bold text-pink-300/90 uppercase tracking-widest text-[11px] mt-0.5">
            steps ({Math.round(progress * 100)}%)
          </span>
        </div>
      </div>

      {/* 3 Saturated Sub-Metrics Row (Matching Reference Mockup Screen 3) */}
      <div className="grid grid-cols-3 gap-3.5 w-full mt-6">
        
        {/* Calories Chip */}
        <motion.div
          whileHover={{ y: -3, scale: 1.03 }}
          transition={{ duration: 0.2 }}
          className="p-4 rounded-2xl bg-gradient-to-b from-orange-500/15 via-[#1a1224]/80 to-[#100a18]/90 border border-orange-500/30 hover:border-orange-500/60 flex flex-col items-center text-center backdrop-blur-xl shadow-lg shadow-orange-950/20"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500/30 to-red-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center mb-1.5 shadow-[0_0_10px_rgba(249,115,22,0.4)]">
            <Flame className="w-4 h-4 fill-current drop-shadow-[0_0_6px_#f97316]" />
          </div>
          <span className="text-base font-extrabold text-white font-mono tracking-tight">{calories}</span>
          <span className="text-[10px] text-orange-300/80 font-bold uppercase tracking-wider">kcal</span>
        </motion.div>

        {/* Distance Chip */}
        <motion.div
          whileHover={{ y: -3, scale: 1.03 }}
          transition={{ duration: 0.2 }}
          className="p-4 rounded-2xl bg-gradient-to-b from-cyan-500/15 via-[#0e1828]/80 to-[#09101b]/90 border border-cyan-500/30 hover:border-cyan-500/60 flex flex-col items-center text-center backdrop-blur-xl shadow-lg shadow-cyan-950/20"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/30 to-blue-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mb-1.5 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
            <MapPin className="w-4 h-4 drop-shadow-[0_0_6px_#06b6d4]" />
          </div>
          <span className="text-base font-extrabold text-white font-mono tracking-tight">{distanceKm}</span>
          <span className="text-[10px] text-cyan-300/80 font-bold uppercase tracking-wider">km</span>
        </motion.div>

        {/* Active Minutes Chip */}
        <motion.div
          whileHover={{ y: -3, scale: 1.03 }}
          transition={{ duration: 0.2 }}
          className="p-4 rounded-2xl bg-gradient-to-b from-purple-500/15 via-[#1a102c]/80 to-[#10081d]/90 border border-purple-500/30 hover:border-purple-500/60 flex flex-col items-center text-center backdrop-blur-xl shadow-lg shadow-purple-950/20"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500/30 to-pink-500/20 border border-purple-500/40 text-pink-400 flex items-center justify-center mb-1.5 shadow-[0_0_10px_rgba(236,72,153,0.4)]">
            <Zap className="w-4 h-4 fill-current drop-shadow-[0_0_6px_#ec4899]" />
          </div>
          <span className="text-base font-extrabold text-white font-mono tracking-tight">{activeMinutes}</span>
          <span className="text-[10px] text-pink-300/80 font-bold uppercase tracking-wider">min Active</span>
        </motion.div>
      </div>
    </div>
  )
}
