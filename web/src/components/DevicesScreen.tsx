import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { 
  Watch, 
  Battery, 
  Bluetooth, 
  Vibrate, 
  CheckCircle2, 
  Clock, 
  Heart, 
  Cpu
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import { watchBleService } from '../lib/bleService'

export function DevicesScreen() {
  const { watch, connectWatch, disconnectWatch, sendWatchAlert } = useAppStore()
  const [timeSyncStatus, setTimeSyncStatus] = useState<string | null>(null)
  const [hapticTestStatus, setHapticTestStatus] = useState<string | null>(null)
  const [currentTimeStr, setCurrentTimeStr] = useState('')

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [])

  const isConnected = watch.connectionState === 'connected'

  const handleTestHaptic = () => {
    sendWatchAlert("WristOS • Haptic Pulse Test")
    setHapticTestStatus("Haptic alert dispatched to PineTime!")
    setTimeout(() => setHapticTestStatus(null), 3000)
  }

  const handleSyncTime = async () => {
    await watchBleService.syncTime()
    setTimeSyncStatus("Clock synchronized via CTS 0x1805")
    setTimeout(() => setTimeSyncStatus(null), 3000)
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-semibold">HARDWARE & WEARABLES</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Smartwatch Management</h2>
          <p className="text-xs text-slate-400">
            Bi-directional Bluetooth Low Energy companion integration with InfiniTime PineTime
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 450, damping: 20 }}
          onClick={isConnected ? disconnectWatch : connectWatch}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shrink-0 ${
            isConnected
              ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
              : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-purple-500/25'
          }`}
        >
          <Watch className="w-4 h-4" />
          <span>{isConnected ? 'Disconnect PineTime' : 'Scan & Connect BLE'}</span>
        </motion.button>
      </div>

      {/* Main Showcase Grid: Smartwatch 3D Mockup & Telemetry Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Realistic Smartwatch Hardware Preview (Inspired by Mockup Image) */}
        <div className="md:col-span-5 p-8 rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
          {/* Ambient watch aura */}
          <div className="absolute w-52 h-52 rounded-full bg-gradient-to-tr from-purple-600/30 to-pink-500/20 blur-3xl pointer-events-none" />

          {/* Watch Straps (Top & Bottom) */}
          <div className="w-24 h-6 rounded-t-xl bg-gradient-to-b from-slate-900 to-slate-800 border-t border-x border-white/10" />

          {/* Watch Chassis */}
          <div className="relative w-56 h-64 rounded-[36px] bg-gradient-to-b from-[#221e33] via-[#120e22] to-[#0a0715] p-3 border-2 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.3)]">
            
            {/* Physical Crown Button */}
            <div className="absolute right-[-7px] top-[40%] w-2 h-7 rounded-r-md bg-gradient-to-b from-slate-400 to-slate-600 border border-white/20 shadow-md" />

            {/* Glass Curved Display */}
            <div className="relative w-full h-full rounded-[26px] bg-[#07050d] overflow-hidden border border-white/10 p-4 flex flex-col justify-between select-none">
              
              {/* Glass reflection sheen */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.02) 40%, transparent 60%)'
                }}
              />

              {/* Watch Display Top: Brand & Battery */}
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-mono font-bold text-purple-300 tracking-wider">WristOS™</span>
                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400">
                  <Battery className="w-3 h-3 text-emerald-400" />
                  <span>{watch.batteryLevel > 0 ? `${watch.batteryLevel}%` : '87%'}</span>
                </div>
              </div>

              {/* Watch Display Center: Time & Date */}
              <div className="text-center my-auto z-10 space-y-0.5">
                <div className="text-3xl font-black tracking-tight text-white font-mono">
                  {currentTimeStr || '10:24'}
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  Tue, 17 Nov
                </div>

                {/* Animated Aurora Wave Ribbon */}
                <div className="relative h-9 w-full mt-2 overflow-hidden flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 160 36" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="watchWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="50%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                    </defs>
                    <motion.path
                      d="M 0 18 Q 40 4 80 18 T 160 18"
                      fill="none"
                      stroke="url(#watchWaveGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      animate={{
                        d: [
                          "M 0 18 Q 40 4 80 18 T 160 18",
                          "M 0 18 Q 40 30 80 18 T 160 18",
                          "M 0 18 Q 40 4 80 18 T 160 18"
                        ]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 3,
                        ease: 'easeInOut'
                      }}
                    />
                  </svg>
                </div>
              </div>

              {/* Watch Display Bottom: Biometric telemetry */}
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 z-10 pt-1 border-t border-white/[0.08]">
                <span className="flex items-center gap-1 text-pink-400">
                  <Heart className="w-3 h-3 fill-current" />
                  <span>{watch.heartRate > 0 ? watch.heartRate : 78}</span>
                </span>
                <span className="text-purple-300">
                  {(watch.stepCount || 7842).toLocaleString()} st
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Strap */}
          <div className="w-24 h-6 rounded-b-xl bg-gradient-to-t from-slate-900 to-slate-800 border-b border-x border-white/10" />
        </div>

        {/* Companion Configuration & Diagnostics Panel */}
        <div className="md:col-span-7 space-y-4">
          
          {/* Hardware Connection Card */}
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>PineTime Smartwatch</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    isConnected 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {isConnected ? 'GATT Connected' : 'Simulated / Standby'}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nordic Semiconductor nRF52832 • ARM Cortex-M4F • InfiniTime 1.14
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                <Bluetooth className="w-5 h-5" />
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono">BATTERY (BAS)</span>
                <p className="text-base font-bold text-white font-mono">{watch.batteryLevel > 0 ? `${watch.batteryLevel}%` : '87%'}</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono">HEART RATE (HRS)</span>
                <p className="text-base font-bold text-pink-400 font-mono">{watch.heartRate > 0 ? `${watch.heartRate} BPM` : '78 BPM'}</p>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono">STEPS TODAY</span>
                <p className="text-base font-bold text-purple-300 font-mono">{(watch.stepCount || 7842).toLocaleString()}</p>
              </div>
            </div>

            {/* Interactive Triggers */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                onClick={handleTestHaptic}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] flex items-center gap-2"
              >
                <Vibrate className="w-3.5 h-3.5 text-pink-400" />
                <span>Test Wrist Haptic Alert</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                onClick={handleSyncTime}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] flex items-center gap-2"
              >
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>Sync Time (CTS 0x1805)</span>
              </motion.button>
            </div>

            {/* Feedback toasts */}
            {(hapticTestStatus || timeSyncStatus) && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-emerald-400 font-medium flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{hapticTestStatus || timeSyncStatus}</span>
              </motion.p>
            )}
          </div>

          {/* GATT Profiles & Services Matrix */}
          <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-3.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>GATT Bluetooth Profiles Diagnostic</span>
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div>
                  <span className="font-semibold text-slate-200">Current Time Service (CTS)</span>
                  <p className="text-[10px] text-slate-500 font-mono">UUID: 0x1805 • Characteristic: 0x2A2B</p>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div>
                  <span className="font-semibold text-slate-200">Heart Rate Service (HRS)</span>
                  <p className="text-[10px] text-slate-500 font-mono">UUID: 0x180D • Characteristic: 0x2A37</p>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div>
                  <span className="font-semibold text-slate-200">Battery Service (BAS)</span>
                  <p className="text-[10px] text-slate-500 font-mono">UUID: 0x180F • Characteristic: 0x2A19</p>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div>
                  <span className="font-semibold text-slate-200">Alert Notification Service (ANS)</span>
                  <p className="text-[10px] text-slate-500 font-mono">UUID: 0x1811 • Characteristic: 0x2A46</p>
                </div>
                <span className="text-[11px] font-mono text-emerald-400">ACTIVE</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
