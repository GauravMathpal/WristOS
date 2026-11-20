import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Watch, 
  Battery, 
  Heart, 
  Footprints, 
  Vibrate, 
  Clock, 
  Bluetooth, 
  CheckCircle2, 
  Cpu, 
  ToggleLeft,
  ToggleRight,
  Send
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import { watchBleService } from '../lib/bleService'

export function DevicesScreen() {
  const { watch, isSimulated, toggleSimulation, connectWatch, disconnectWatch, sendWatchAlert, addSimulatedSteps } = useAppStore()
  
  const [currentTimeStr, setCurrentTimeStr] = useState('')
  const [hapticTestStatus, setHapticTestStatus] = useState<string | null>(null)
  const [timeSyncStatus, setTimeSyncStatus] = useState<string | null>(null)
  const [stepTestStatus, setStepTestStatus] = useState<string | null>(null)
  const [customAlertInput, setCustomAlertInput] = useState('')
  const [lastAlertMessage, setLastAlertMessage] = useState<string | null>(null)

  const isConnected = watch.connectionState === 'connected'

  // Update clock every second for realistic watch face
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleTestHaptic = async () => {
    sendWatchAlert("Haptic Ping • WristOS Active")
    setLastAlertMessage("Haptic Ping • WristOS Active")
    setTimeout(() => setLastAlertMessage(null), 3000)
    setHapticTestStatus("Haptic pulse dispatched to watch display!")
    setTimeout(() => setHapticTestStatus(null), 3500)
  }

  const handleSendCustomAlert = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customAlertInput.trim()) return
    sendWatchAlert(customAlertInput.trim())
    setLastAlertMessage(customAlertInput.trim())
    setTimeout(() => setLastAlertMessage(null), 3500)
    setCustomAlertInput('')
    setHapticTestStatus("Alert notification displayed on watch screen!")
    setTimeout(() => setHapticTestStatus(null), 3500)
  }

  const handleSyncTime = async () => {
    await watchBleService.syncTime()
    setTimeSyncStatus("Clock synchronized via CTS 0x1805")
    setTimeout(() => setTimeSyncStatus(null), 3000)
  }

  const handleAddSteps = () => {
    addSimulatedSteps(500)
    setStepTestStatus("+500 steps logged to daily activity ring!")
    setTimeout(() => setStepTestStatus(null), 3000)
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-purple-500/25 bg-gradient-to-r from-[#1c123b]/85 via-[#140e2b]/80 to-[#0e0820]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
              <Watch className="w-3.5 h-3.5 text-pink-400" />
              <span>HARDWARE & WEARABLES</span>
            </span>
            {isSimulated && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                Virtual Simulator Active
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            Smartwatch Management
          </h2>
          <p className="text-xs text-purple-200/80 font-medium">
            Bi-directional Bluetooth Low Energy companion integration with InfiniTime PineTime
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => toggleSimulation()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs bg-[#140e29] hover:bg-[#1c133a] text-purple-200 border border-purple-500/30 transition-all shrink-0 shadow-sm"
            title="Toggle between Virtual Simulated Watch and Physical BLE"
          >
            {isSimulated ? <ToggleRight className="w-4 h-4 text-pink-400" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
            <span>{isSimulated ? 'Simulator Mode' : 'Physical BLE'}</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 450, damping: 20 }}
            onClick={isConnected ? disconnectWatch : connectWatch}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs transition-all shadow-lg shrink-0 ${
              isConnected
                ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-pink-500/30'
            }`}
          >
            <Watch className="w-4 h-4" />
            <span>{isConnected ? 'Disconnect' : 'Scan Physical BLE'}</span>
          </motion.button>
        </div>
      </div>

      {/* Main Showcase Grid: Smartwatch 3D Mockup & Telemetry Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Realistic Smartwatch Hardware Preview (Inspired by Mockup Image) */}
        <div className="md:col-span-5 p-8 rounded-3xl border border-purple-500/30 bg-gradient-to-b from-[#221345]/90 via-[#150d2c]/85 to-[#0b071a]/95 backdrop-blur-2xl shadow-2xl shadow-purple-950/40 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Ambient watch aura */}
          <div className="absolute w-56 h-56 rounded-full bg-gradient-to-tr from-purple-600/35 via-pink-600/35 to-cyan-500/25 blur-3xl pointer-events-none" />

          {/* Watch Straps (Top & Bottom) */}
          <div className="w-24 h-6 rounded-t-xl bg-gradient-to-b from-slate-900 to-slate-800 border-t border-x border-purple-500/30" />

          {/* Watch Chassis */}
          <div className="relative w-56 h-64 rounded-[36px] bg-gradient-to-b from-[#251842] via-[#140c29] to-[#090514] p-3 border-2 border-purple-500/40 shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_25px_rgba(168,85,247,0.3),inset_0_2px_4px_rgba(255,255,255,0.25)]">
            
            {/* Physical Crown Button */}
            <div className="absolute right-[-7px] top-[40%] w-2 h-7 rounded-r-md bg-gradient-to-b from-slate-300 to-slate-600 border border-purple-400/30 shadow-md" />

            {/* Glass Curved Display */}
            <div className="relative w-full h-full rounded-[26px] bg-[#07050d] overflow-hidden border border-purple-500/20 p-4 flex flex-col justify-between select-none shadow-inner">
              
              {/* Glass reflection sheen */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.02) 40%, transparent 60%)'
                }}
              />

              {/* Incoming Haptic Alert Overlay */}
              <AnimatePresence>
                {lastAlertMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute inset-x-2 top-2 z-30 p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-xl text-center border border-white/30"
                  >
                    <div className="flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-wider">
                      <Vibrate className="w-3 h-3 animate-bounce" />
                      <span>WristOS Alert</span>
                    </div>
                    <p className="text-[10px] font-bold truncate mt-0.5">{lastAlertMessage}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Watch Display Top: Brand & Battery */}
              <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-mono font-extrabold text-pink-300 tracking-wider">WristOS™</span>
                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-300">
                  <Battery className="w-3 h-3 text-emerald-400" />
                  <span>{watch.batteryLevel > 0 ? `${watch.batteryLevel}%` : '94%'}</span>
                </div>
              </div>

              {/* Watch Display Center: Time & Date */}
              <div className="text-center my-auto z-10 space-y-0.5">
                <div className="text-3xl font-black tracking-tight text-white font-mono drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                  {currentTimeStr || '10:24'}
                </div>
                <div className="text-[10px] text-purple-300/80 font-bold">
                  {new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>

                {/* Animated Aurora Wave Ribbon inside the watch screen */}
                <div className="relative h-9 w-full mt-2 overflow-hidden flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 160 36" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="watchWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="50%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                    <motion.path
                      d="M 0 18 Q 40 4 80 18 T 160 18"
                      fill="none"
                      stroke="url(#watchWaveGrad)"
                      strokeWidth="2.8"
                      strokeLinecap="round"
                      filter="drop-shadow(0 0 6px rgba(236,72,153,0.8))"
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
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 z-10 pt-1 border-t border-purple-500/20">
                <span className="flex items-center gap-1 text-pink-400 font-bold">
                  <Heart className="w-3 h-3 fill-current animate-pulse" />
                  <span>{watch.heartRate > 0 ? watch.heartRate : 78}</span>
                </span>
                <span className="text-purple-300 font-bold">
                  {(watch.stepCount || 7842).toLocaleString()} st
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Strap */}
          <div className="w-24 h-6 rounded-b-xl bg-gradient-to-t from-slate-900 to-slate-800 border-b border-x border-purple-500/30" />
        </div>

        {/* Companion Configuration & Diagnostics Panel */}
        <div className="md:col-span-7 space-y-4">
          
          {/* Hardware Connection Card */}
          <div className="p-6 sm:p-7 rounded-3xl border border-purple-500/25 bg-gradient-to-b from-[#1b1236]/85 via-[#130d29]/80 to-[#0b081d]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>{watch.deviceName || 'PineTime Smartwatch'}</span>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    isConnected 
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 shadow-[0_0_8px_rgba(52,211,153,0.3)]' 
                      : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                  }`}>
                    {isConnected ? (isSimulated ? 'Simulated BLE Connected' : 'GATT BLE Connected') : 'Disconnected'}
                  </span>
                </h3>
                <p className="text-xs text-purple-200/80 mt-0.5 font-medium">
                  Nordic Semiconductor nRF52832 • ARM Cortex-M4F • InfiniTime 1.14
                </p>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500/30 to-pink-500/20 border border-purple-400/40 text-purple-300 flex items-center justify-center shadow-[0_0_16px_rgba(168,85,247,0.35)]">
                <Bluetooth className="w-5 h-5" />
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3.5 rounded-2xl bg-[#140e29]/80 border border-purple-500/20 space-y-1">
                <span className="text-[10px] text-purple-400 uppercase font-mono font-bold">BATTERY (BAS)</span>
                <p className="text-lg font-black text-white font-mono">{watch.batteryLevel > 0 ? `${watch.batteryLevel}%` : '94%'}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#140e29]/80 border border-pink-500/25 space-y-1 shadow-[0_0_10px_rgba(236,72,153,0.15)]">
                <span className="text-[10px] text-pink-400 uppercase font-mono font-bold">HEART RATE (HRS)</span>
                <p className="text-lg font-black text-pink-400 font-mono drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]">
                  {watch.heartRate > 0 ? `${watch.heartRate} BPM` : '78 BPM'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#140e29]/80 border border-purple-500/20 space-y-1">
                <span className="text-[10px] text-cyan-400 uppercase font-mono font-bold">STEPS TODAY</span>
                <p className="text-lg font-black text-purple-200 font-mono">{(watch.stepCount || 7842).toLocaleString()}</p>
              </div>
            </div>

            {/* Custom Watch Alert Dispatch Form */}
            <form onSubmit={handleSendCustomAlert} className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Send instant alert popup to watch..."
                value={customAlertInput}
                onChange={(e) => setCustomAlertInput(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-xs text-white placeholder:text-purple-400/50 focus:outline-none focus:border-pink-500"
              />
              <motion.button
                type="submit"
                whileTap={{ scale: 0.94 }}
                disabled={!customAlertInput.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md disabled:opacity-40 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </motion.button>
            </form>

            {/* Interactive Triggers */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                onClick={handleTestHaptic}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.08] hover:bg-white/[0.14] text-pink-300 border border-pink-500/30 flex items-center gap-2 shadow-sm"
              >
                <Vibrate className="w-3.5 h-3.5" />
                <span>Test Wrist Haptic Alert</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                onClick={handleSyncTime}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.08] hover:bg-white/[0.14] text-purple-300 border border-purple-500/30 flex items-center gap-2 shadow-sm"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Sync Time (CTS 0x1805)</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                onClick={handleAddSteps}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.08] hover:bg-white/[0.14] text-cyan-300 border border-cyan-500/30 flex items-center gap-2 shadow-sm"
              >
                <Footprints className="w-3.5 h-3.5" />
                <span>Simulate Walking (+500 Steps)</span>
              </motion.button>
            </div>

            {/* Feedback toasts */}
            {(hapticTestStatus || timeSyncStatus || stepTestStatus) && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-emerald-400 font-bold flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{hapticTestStatus || timeSyncStatus || stepTestStatus}</span>
              </motion.p>
            )}
          </div>

          {/* GATT Profiles & Services Matrix */}
          <div className="p-6 rounded-3xl border border-purple-500/25 bg-gradient-to-b from-[#1b1236]/85 via-[#130d29]/80 to-[#0b081d]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25 space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-pink-400" />
              <span>GATT Bluetooth Profiles Diagnostic</span>
            </h4>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#140e29]/80 border border-purple-500/20">
                <div>
                  <span className="font-bold text-white">Current Time Service (CTS)</span>
                  <p className="text-[10px] text-purple-300/70 font-mono">UUID: 0x1805 • Characteristic: 0x2A2B</p>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#140e29]/80 border border-purple-500/20">
                <div>
                  <span className="font-bold text-white">Heart Rate Service (HRS)</span>
                  <p className="text-[10px] text-purple-300/70 font-mono">UUID: 0x180D • Characteristic: 0x2A37</p>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#140e29]/80 border border-purple-500/20">
                <div>
                  <span className="font-bold text-white">Battery Service (BAS)</span>
                  <p className="text-[10px] text-purple-300/70 font-mono">UUID: 0x180F • Characteristic: 0x2A19</p>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400">ACTIVE</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-[#140e29]/80 border border-purple-500/20">
                <div>
                  <span className="font-bold text-white">Alert Notification Service (ANS)</span>
                  <p className="text-[10px] text-purple-300/70 font-mono">UUID: 0x1811 • Characteristic: 0x2A46</p>
                </div>
                <span className="text-[11px] font-mono font-bold text-emerald-400">ACTIVE</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
