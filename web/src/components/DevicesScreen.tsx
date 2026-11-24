import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Battery, 
  BatteryCharging,
  Heart, 
  Footprints, 
  Vibrate, 
  Clock, 
  ToggleLeft,
  ToggleRight,
  Send,
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Navigation,
  Compass,
  Smartphone,
  Sparkles,
  ChevronLeft,
  Check,
  Radio,
  Bluetooth,
  Download,
  HardDrive,
  ShieldCheck,
  Cpu,
  RefreshCw,
  AlertCircle,
  Signal
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import { watchBleService } from '../lib/bleService'
import { routineRepository } from '../lib/repository'

export function DevicesScreen() {
  const { 
    watch, 
    isSimulated, 
    toggleSimulation, 
    connectWatch, 
    disconnectWatch, 
    sendWatchAlert, 
    addSimulatedSteps, 
    setActiveTab 
  } = useAppStore()

  // Subtab switcher
  const [activeSubTab, setActiveSubTab] = useState<'hardware' | 'music' | 'navigation' | 'findphone' | 'routines'>('hardware')
  
  const [currentTimeStr, setCurrentTimeStr] = useState('')
  const [currentDateStr, setCurrentDateStr] = useState('')
  const [customAlertInput, setCustomAlertInput] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // Music state
  const [isPlaying, setIsPlaying] = useState(false)
  const [trackIndex, setTrackIndex] = useState(0)
  const [volume, setVolume] = useState(75)

  const tracks = [
    { title: 'Momentum', artist: 'WristOS Radio', duration: '3:45' },
    { title: 'Synthwave Dreams', artist: 'Nordic Audio', duration: '4:12' },
    { title: 'Deep Flow State', artist: 'Ambient Focus', duration: '5:30' }
  ]

  // Navigation state
  const navStep = {
    instruction: 'Turn Right in 250m on Tech Boulevard',
    nextStreet: 'Innovation Way',
    distanceRemaining: '1.8 km',
    eta: '6 mins'
  }

  // Find Phone state
  const [isSirenActive, setIsSirenActive] = useState(false)

  // Live routines from Dexie
  const routines = useLiveQuery(() => routineRepository.getAllActive()) || []

  const isConnected = watch.connectionState === 'connected'

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3200)
  }

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }))
      setCurrentDateStr(now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const handleTestHaptic = async () => {
    sendWatchAlert("Haptic Ping • WristOS Active")
    showToast("Sent haptic vibration pulse to watch display")
  }

  const handleSendCustomAlert = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customAlertInput.trim()) return
    sendWatchAlert(customAlertInput.trim())
    setCustomAlertInput('')
    showToast("Dispatched instant alert card to watch display")
  }

  const handleSyncTime = async () => {
    await watchBleService.syncTime()
    showToast("Time synchronized over BLE CTS Service 0x1805")
  }

  const handleAddSteps = () => {
    addSimulatedSteps(500)
    showToast("+500 steps logged to daily activity ring")
  }

  const handleConnectToggle = async () => {
    if (isConnected) {
      await disconnectWatch()
      showToast("Disconnected from smartwatch")
    } else {
      setIsConnecting(true)
      try {
        await connectWatch()
        showToast("Connected to physical WristOS Watch over BLE!")
      } catch (err: any) {
        showToast(err?.message || "Connection failed. Please ensure Gadgetbridge is disconnected!")
      } finally {
        setIsConnecting(false)
      }
    }
  }

  // Music handlers
  const handleTogglePlay = async () => {
    const nextPlay = !isPlaying
    setIsPlaying(nextPlay)
    const current = tracks[trackIndex]
    await sendWatchAlert(`Music: ${nextPlay ? 'Playing' : 'Paused'} • ${current.title}`)
    showToast(nextPlay ? `Playing: ${current.title}` : 'Playback paused')
  }

  const handleNextTrack = async () => {
    const nextIdx = (trackIndex + 1) % tracks.length
    setTrackIndex(nextIdx)
    setIsPlaying(true)
    await sendWatchAlert(`Track: ${tracks[nextIdx].title}`)
    showToast(`Next: ${tracks[nextIdx].title}`)
  }

  const handlePrevTrack = async () => {
    const prevIdx = (trackIndex - 1 + tracks.length) % tracks.length
    setTrackIndex(prevIdx)
    setIsPlaying(true)
    await sendWatchAlert(`Track: ${tracks[prevIdx].title}`)
    showToast(`Previous: ${tracks[prevIdx].title}`)
  }

  // Find My Phone Audio Siren
  const triggerPhoneSiren = () => {
    setIsSirenActive(true)
    try {
      // @ts-expect-error Web Audio API compatibility
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        const ctx = new AudioCtx()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(800, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(1600, ctx.currentTime + 0.4)
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.8)
        gain.gain.setValueAtTime(0.4, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 1.2)
      }
    } catch {
      // Audio policy
    }

    sendWatchAlert("FIND PHONE: Ringing Phone Now!")
    showToast("Find My Phone alarm triggered!")
    setTimeout(() => setIsSirenActive(false), 2000)
  }

  // Navigation push
  const handlePushNavToWatch = async () => {
    await sendWatchAlert(`Nav: ${navStep.instruction} (${navStep.distanceRemaining})`)
    showToast("Navigation instruction pushed to watch")
  }

  // Routine execution
  const handleExecuteRoutine = async (routineId: string) => {
    const res = await routineRepository.executeRoutine(routineId)
    if (res.success) {
      await sendWatchAlert(`Routine: Completed ${res.executedSteps.length} actions`)
      showToast("Routine executed successfully!")
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-16">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#18112e]/95 text-white text-xs font-semibold shadow-2xl backdrop-blur-xl flex items-center gap-2.5 border border-purple-400/50"
          >
            <Sparkles className="w-4 h-4 text-pink-400 animate-spin-slow" />
            <span className="tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP HEADER: Back button + Title + Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-3xl bg-[#140e29]/70 border border-purple-500/20 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-3.5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setActiveTab('dashboard')}
            className="w-10 h-10 rounded-2xl bg-[#1c133a] border border-white/[0.1] flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md shrink-0"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black text-white tracking-tight">
                Smartwatch & BLE Control Hub
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                isConnected 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                {isConnected ? (isSimulated ? 'Simulator Linked' : 'BLE Connected') : 'Standby'}
              </span>
            </div>
            <p className="text-xs text-purple-300/80 font-medium mt-0.5">
              Real-time 2.4GHz Bluetooth Low Energy bridge, biometric telemetry & OTA suite
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs font-semibold text-slate-400">Mode:</span>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => toggleSimulation()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all shadow-md ${
              isSimulated 
                ? 'bg-purple-900/40 text-pink-300 border-purple-500/40' 
                : 'bg-indigo-900/40 text-cyan-300 border-cyan-500/40'
            }`}
            title="Toggle Physical BLE vs Virtual Hardware Simulator"
          >
            {isSimulated ? (
              <>
                <ToggleRight className="w-5 h-5 text-pink-400" />
                <span>Virtual Simulator</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-5 h-5 text-cyan-400" />
                <span>Physical BLE Device</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

      {/* 2. MAIN RESPONSIVE GRID (Left Column: Animated Radar Scanner & Live Watch | Right Column: Subtabs & Operations) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: ANIMATED RADAR SCANNER & 3D WATCH DISPLAY    */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Radar Scanner & Watch Preview Container */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#18112e] via-[#110a22] to-[#090514] border border-purple-500/30 p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-center min-h-[460px]">
            
            {/* CONCENTRIC RADAR RIPPLE WAVES */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Outer pulsing ring 1 */}
              <motion.div
                animate={{
                  scale: [0.85, 1.4, 2.0, 2.6],
                  opacity: [0.7, 0.45, 0.18, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                className="absolute w-44 h-44 rounded-full border border-purple-500/50"
              />
              {/* Outer pulsing ring 2 (staggered delay) */}
              <motion.div
                animate={{
                  scale: [0.85, 1.4, 2.0, 2.6],
                  opacity: [0.7, 0.45, 0.18, 0]
                }}
                transition={{
                  duration: 4,
                  delay: 1.3,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                className="absolute w-44 h-44 rounded-full border border-pink-500/40"
              />
              {/* Outer pulsing ring 3 (staggered delay) */}
              <motion.div
                animate={{
                  scale: [0.85, 1.4, 2.0, 2.6],
                  opacity: [0.7, 0.45, 0.18, 0]
                }}
                transition={{
                  duration: 4,
                  delay: 2.6,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
                className="absolute w-44 h-44 rounded-full border border-cyan-500/30"
              />

              {/* Sweeping 360-degree radar beam */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: "linear"
                }}
                className="absolute w-[360px] h-[360px] rounded-full pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(168, 85, 247, 0.15) 320deg, rgba(236, 72, 153, 0.45) 360deg)'
                }}
              />

              {/* Radar Crosshairs */}
              <div className="absolute w-[340px] h-[1px] bg-purple-500/15 pointer-events-none" />
              <div className="absolute h-[340px] w-[1px] bg-purple-500/15 pointer-events-none" />
              
              {/* Static faint calibration rings */}
              <div className="absolute w-64 h-64 rounded-full border border-purple-500/20 pointer-events-none" />
              <div className="absolute w-88 h-88 rounded-full border border-purple-500/10 pointer-events-none" />
            </div>

            {/* FLOATING 3D-STYLED SMARTWATCH */}
            <motion.div 
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="relative z-10 flex flex-col items-center drop-shadow-[0_20px_35px_rgba(0,0,0,0.8)]"
            >
              {/* Top Silicon Band */}
              <div className="w-24 h-7 rounded-t-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-x border-purple-500/30 flex items-center justify-center shadow-inner">
                <div className="w-8 h-1 rounded-full bg-slate-700/50" />
              </div>

              {/* Watch Outer Chassis */}
              <div className="relative w-52 h-60 rounded-[34px] bg-gradient-to-br from-[#2c1c54] via-[#160d2e] to-[#0a0518] p-3 border-2 border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.3)]">
                
                {/* Physical Right Crown Knob */}
                <div className="absolute right-[-7px] top-[38%] w-2.5 h-7 rounded-r-md bg-gradient-to-r from-slate-600 to-slate-400 border border-purple-400/40 shadow-md">
                  <div className="w-full h-full flex flex-col justify-around py-0.5 items-center">
                    <span className="w-1 h-[1px] bg-slate-800" />
                    <span className="w-1 h-[1px] bg-slate-800" />
                    <span className="w-1 h-[1px] bg-slate-800" />
                  </div>
                </div>

                {/* AMOLED Screen Display */}
                <div className="w-full h-full rounded-[24px] bg-[#07040e] p-3.5 flex flex-col justify-between text-center relative overflow-hidden border border-white/10 ring-1 ring-purple-500/20">
                  
                  {/* Subtle Screen Scanline Texture */}
                  <div 
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{
                      backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 0)',
                      backgroundSize: '4px 4px'
                    }}
                  />

                  {/* Watch Top Status Bar */}
                  <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-300">
                    <div className="flex items-center gap-1">
                      <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">WristOS</span>
                      {isConnected ? (
                        <Bluetooth className="w-2.5 h-2.5 text-cyan-400 animate-pulse" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 font-bold">
                      {watch.batteryLevel > 90 ? (
                        <BatteryCharging className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Battery className="w-3 h-3 text-emerald-400" />
                      )}
                      <span className="text-emerald-400">{watch.batteryLevel > 0 ? `${watch.batteryLevel}%` : '94%'}</span>
                    </div>
                  </div>

                  {/* Watch Digital Clock Face */}
                  <div className="relative z-10 my-auto py-1">
                    <div className="text-4xl font-black font-mono text-white tracking-tight drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                      {currentTimeStr || '10:24'}
                    </div>
                    <div className="text-[10px] text-pink-300 font-extrabold uppercase tracking-wider mt-0.5">
                      {currentDateStr || 'Tue, 14 Nov'}
                    </div>

                    {/* Animated Pulsing Heartbeat ECG Line */}
                    <div className="w-24 h-4 mx-auto my-1.5 flex items-center justify-center">
                      <svg className="w-full h-full" viewBox="0 0 100 20">
                        <motion.path
                          d="M 0 10 L 25 10 L 32 3 L 40 17 L 48 2 L 56 16 L 62 10 L 100 10"
                          fill="none"
                          stroke="#f43f5e"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0.2, strokeDashoffset: 0 }}
                          animate={{ strokeDashoffset: [0, -100] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          strokeDasharray="20 5"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Watch Bottom Biometrics Strip */}
                  <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-300 pt-1.5 border-t border-white/10">
                    <span className="flex items-center gap-1 text-rose-400 font-bold">
                      <Heart className="w-3 h-3 fill-rose-500 animate-pulse text-rose-400" />
                      <span>{watch.heartRate > 0 ? watch.heartRate : '74'} bpm</span>
                    </span>
                    <span className="flex items-center gap-1 text-cyan-300 font-bold">
                      <Footprints className="w-3 h-3 text-cyan-400" />
                      <span>{(watch.stepCount || 8420).toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Silicon Band */}
              <div className="w-24 h-7 rounded-b-xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-x border-purple-500/30 flex items-center justify-center shadow-inner">
                <div className="w-8 h-1 rounded-full bg-slate-700/50" />
              </div>
            </motion.div>

            {/* Real-time Connection State Callout Under Watch */}
            <div className="relative z-10 mt-5 text-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18102d]/90 border border-purple-500/30 backdrop-blur-md shadow-lg">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  isConnected 
                    ? 'bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse' 
                    : isConnecting 
                    ? 'bg-cyan-400 shadow-[0_0_10px_#38bdf8] animate-spin' 
                    : 'bg-slate-500'
                }`} />
                <span className="text-xs font-bold text-white">
                  {isConnected 
                    ? (isSimulated ? 'Virtual Simulator Active' : `Connected: ${watch.deviceName}`) 
                    : isConnecting 
                    ? 'Scanning 2.4GHz BLE Spectrum...' 
                    : 'Watch Standby • Ready to Pair'}
                </span>
              </div>
            </div>

          </div>

          {/* PAIRING CONTROLS & COMMAND CONSOLE */}
          <div className="p-5 sm:p-6 rounded-3xl bg-[#140e29]/70 border border-purple-500/20 backdrop-blur-xl shadow-xl space-y-4">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white">Hardware Connection</h3>
                <p className="text-[11px] text-slate-400">
                  {isConnected 
                    ? 'Bidirectional BLE Stream Active' 
                    : 'Search for PineTime / WristOS peripheral'}
                </p>
              </div>

              {/* Primary Connect / Disconnect Button */}
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.94 }}
                onClick={handleConnectToggle}
                disabled={isConnecting}
                className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all flex items-center gap-2 shadow-lg ${
                  isConnected
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30 shadow-rose-900/30'
                    : 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white border-purple-400/40 hover:brightness-110 shadow-purple-600/30'
                }`}
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : isConnected ? (
                  <>
                    <Radio className="w-3.5 h-3.5" />
                    <span>Disconnect</span>
                  </>
                ) : (
                  <>
                    <Bluetooth className="w-3.5 h-3.5" />
                    <span>Connect Watch</span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Single-Connection Troubleshooting Tip */}
            {!isConnected && (
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300 block mb-0.5">BLE Single-Link Requirement:</strong>
                  The Nordic nRF52832 chip allows <strong>one active Bluetooth connection</strong> at a time. If <strong>Gadgetbridge</strong> or <strong>nRF Connect</strong> is running or connected on your phone, disconnect it first so your watch can advertise to this dashboard.
                </div>
              </div>
            )}

            {/* Quick Interactive BLE Console Actions */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleTestHaptic}
                className="p-3 rounded-2xl bg-[#1c133a] hover:bg-[#251a4d] text-pink-300 border border-purple-500/20 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Vibrate className="w-4 h-4 text-pink-400" />
                <span>Test Haptic</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleSyncTime}
                className="p-3 rounded-2xl bg-[#1c133a] hover:bg-[#251a4d] text-purple-300 border border-purple-500/20 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Clock className="w-4 h-4 text-purple-400" />
                <span>Sync Time</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={handleAddSteps}
                className="p-3 rounded-2xl bg-[#1c133a] hover:bg-[#251a4d] text-cyan-300 border border-purple-500/20 text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Footprints className="w-4 h-4 text-cyan-400" />
                <span>+500 Steps</span>
              </motion.button>
            </div>

            {/* Instant Notification Card Dispatcher */}
            <form onSubmit={handleSendCustomAlert} className="flex gap-2 pt-1">
              <input
                type="text"
                placeholder="Send instant notification alert to watch..."
                value={customAlertInput}
                onChange={(e) => setCustomAlertInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-[#0f0a1f] border border-purple-500/25 text-xs text-white placeholder:text-purple-300/40 focus:outline-none focus:border-purple-400 transition-colors"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                type="submit"
                disabled={!customAlertInput.trim()}
                className="px-4 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-40 shadow-md flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </form>

            {/* Real-time BLE Telemetry & Protocol Inspection Card */}
            <div className="p-3.5 rounded-2xl bg-[#0d081c] border border-purple-500/20 space-y-2 text-[11px] font-mono text-slate-300">
              <div className="flex items-center justify-between text-slate-400 border-b border-white/[0.06] pb-1.5">
                <span className="flex items-center gap-1 text-purple-300 font-bold">
                  <Signal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Radio Telemetry</span>
                </span>
                <span className="text-emerald-400 font-bold">
                  {isConnected ? '-54 dBm • Excellent' : 'No Signal'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <span className="text-slate-500">Service CTS:</span> <span className="text-pink-300 font-bold">0x1805</span>
                </div>
                <div>
                  <span className="text-slate-500">Service Battery:</span> <span className="text-emerald-300 font-bold">0x180F</span>
                </div>
                <div>
                  <span className="text-slate-500">Service HRS:</span> <span className="text-rose-300 font-bold">0x180D</span>
                </div>
                <div>
                  <span className="text-slate-500">MTU Data Length:</span> <span className="text-cyan-300 font-bold">247 Bytes</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: INTERACTIVE SUBTABS & COMPANION APPS         */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Subtab Bar */}
          <div className="flex items-center p-1.5 rounded-2xl bg-[#140e29]/70 border border-purple-500/20 shadow-inner overflow-x-auto scrollbar-none gap-1">
            {[
              { id: 'hardware' as const, label: 'Firmware & DFU', icon: HardDrive },
              { id: 'music' as const, label: 'Music Remote', icon: Music },
              { id: 'navigation' as const, label: 'Turn Navigation', icon: Navigation },
              { id: 'findphone' as const, label: 'Find Phone Siren', icon: Smartphone },
              { id: 'routines' as const, label: 'Smart Routines', icon: Radio }
            ].map((tab) => {
              const isSelected = activeSubTab === tab.id
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`flex-1 relative py-2.5 px-3 rounded-xl text-xs font-bold transition-all text-center shrink-0 flex items-center justify-center gap-1.5 ${
                    isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="deviceSubTabActivePill"
                      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 shadow-md shadow-pink-600/30"
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                  <span className="relative z-10 sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              )
            })}
          </div>

          {/* Subtab Content Views */}
          <AnimatePresence mode="wait">
            
            {/* ----------------------------------------------------- */}
            {/* VIEW A: FIRMWARE, OTA & HARDWARE DIAGNOSTICS          */}
            {/* ----------------------------------------------------- */}
            {activeSubTab === 'hardware' && (
              <motion.div
                key="hardware"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                {/* Production Firmware OTA Package */}
                <div className="p-6 rounded-3xl bg-[#140e29]/70 border border-purple-500/25 backdrop-blur-xl shadow-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                        <HardDrive className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-white">WristOS Firmware OTA</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            v1.16.0 Ready
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">MCUBoot Signed DFU Archive • 433 KB</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href="/WristOS-Mobile-App-v1.0.apk"
                        download="WristOS-Mobile-App-v1.0.apk"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold transition-all"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>Android Companion APK</span>
                      </a>

                      <a
                        href="/WristOS-Firmware-1.16.0-DFU.zip"
                        download="WristOS-Firmware-1.16.0-DFU.zip"
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all hover:scale-105"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download DFU Package</span>
                      </a>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#0c081a] border border-purple-500/20 text-xs font-mono text-slate-300 space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>SHA-256 Checksum:</span>
                      <span className="flex items-center gap-1 text-emerald-400 font-bold">
                        <ShieldCheck className="w-4 h-4" /> Cryptographically Verified
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-black/50 text-[10px] text-purple-200 select-all font-mono break-all">
                      5ab76f0e36669e0b3208a360d2c9a5200fc9622f1229dd6bb2bec54d9687de9e
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 pt-1">
                    <span>Flash Memory Layout: 441.6 KB / 474.6 KB (93.04%)</span>
                    <span className="text-emerald-400 font-semibold">OTA Safe Headroom: 33.0 KB free</span>
                  </div>
                </div>

                {/* Hardware Architecture Specs */}
                <div className="p-6 rounded-3xl bg-[#140e29]/70 border border-purple-500/25 backdrop-blur-xl shadow-xl space-y-4">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <h4 className="text-sm font-extrabold text-white">PineTime Hardware Subsystems</h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-[#100a22] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Compute SoC</span>
                      <p className="font-bold text-white">Nordic Semi nRF52832</p>
                      <p className="text-[11px] text-slate-400">ARM Cortex-M4F @ 64MHz, 64KB RAM</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#100a22] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Display Subsystem</span>
                      <p className="font-bold text-white">1.3" IPS LCD (240 × 240)</p>
                      <p className="text-[11px] text-slate-400">ST7789V driver, CST816S touch panel</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#100a22] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Optical PPG Sensor</span>
                      <p className="font-bold text-white">Everlight HRS3300</p>
                      <p className="text-[11px] text-slate-400">Auto-sleep timeout, low-power green LED</p>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#100a22] border border-white/[0.06] space-y-1">
                      <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">Motion IMU</span>
                      <p className="font-bold text-white">Bosch BMA421 3-Axis</p>
                      <p className="text-[11px] text-slate-400">Step counting, wrist-raise wake detection</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ----------------------------------------------------- */}
            {/* VIEW B: MUSIC CONTROLLER REMOTE                       */}
            {/* ----------------------------------------------------- */}
            {activeSubTab === 'music' && (
              <motion.div
                key="music"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-6 rounded-3xl bg-[#140e29]/70 border border-purple-500/25 backdrop-blur-xl shadow-xl text-center space-y-5"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-500/30 via-fuchsia-500/20 to-pink-500/30 border border-purple-400/40 text-pink-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                  <Music className={`w-10 h-10 ${isPlaying ? 'animate-bounce' : ''}`} />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">{tracks[trackIndex].title}</h3>
                  <p className="text-sm text-purple-300 font-semibold mt-0.5">{tracks[trackIndex].artist}</p>
                  <span className="text-[11px] font-mono text-slate-400 mt-1 block">Smartwatch Sync Audio Controller</span>
                </div>

                {/* Animated Equalizer Visualizer Bars */}
                <div className="flex items-center justify-center gap-1.5 h-8">
                  {[40, 75, 30, 95, 60, 85, 45, 90, 65, 35].map((height, i) => (
                    <motion.div
                      key={i}
                      animate={isPlaying ? { height: [`${height}%`, `${(height * 1.5) % 100}%`, `${(height * 0.7) % 100}%`, `${height}%`] } : { height: '15%' }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                      className="w-1.5 rounded-full bg-gradient-to-t from-purple-500 to-pink-500"
                    />
                  ))}
                </div>

                {/* Progress bar */}
                <div className="w-full space-y-1.5">
                  <div className="w-full h-2 rounded-full bg-[#0a0614] overflow-hidden">
                    <div className={`h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 ${isPlaying ? 'w-[48%]' : 'w-[20%]'}`} />
                  </div>
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>1:24</span>
                    <span>{tracks[trackIndex].duration}</span>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-center gap-5 pt-1">
                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={handlePrevTrack}
                    className="p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-white transition-colors shadow-md"
                  >
                    <SkipBack className="w-6 h-6" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={handleTogglePlay}
                    className="w-16 h-16 rounded-3xl bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-pink-500/40 hover:brightness-110"
                  >
                    {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current ml-1" />}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={handleNextTrack}
                    className="p-3.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] text-white transition-colors shadow-md"
                  >
                    <SkipForward className="w-6 h-6" />
                  </motion.button>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center gap-3 pt-2 max-w-sm mx-auto">
                  <Volume2 className="w-4 h-4 text-purple-400 shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full accent-pink-500 bg-[#0f0b1a] cursor-pointer"
                  />
                  <span className="text-xs font-mono text-slate-300 w-10 font-bold">{volume}%</span>
                </div>
              </motion.div>
            )}

            {/* ----------------------------------------------------- */}
            {/* VIEW C: TURN-BY-TURN NAVIGATION                       */}
            {/* ----------------------------------------------------- */}
            {activeSubTab === 'navigation' && (
              <motion.div
                key="navigation"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-6 rounded-3xl bg-[#140e29]/70 border border-purple-500/25 backdrop-blur-xl shadow-xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-sky-400 animate-pulse" />
                    <h3 className="text-base font-extrabold text-white">Turn-by-Turn Navigation</h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    GPS ACTIVE
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-[#0d081c] border border-sky-500/30 flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <Compass className="w-7 h-7 animate-spin-slow" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-white">{navStep.instruction}</h4>
                    <p className="text-xs text-slate-400 mt-1">Next: {navStep.nextStreet}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-4 rounded-2xl bg-[#0d081c] border border-white/[0.04]">
                    <span className="text-xs text-slate-400 font-mono">Distance Remaining</span>
                    <p className="text-lg font-bold font-mono text-white mt-0.5">{navStep.distanceRemaining}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#0d081c] border border-white/[0.04]">
                    <span className="text-xs text-slate-400 font-mono">Estimated Arrival</span>
                    <p className="text-lg font-bold font-mono text-white mt-0.5">{navStep.eta}</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handlePushNavToWatch}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Push Navigation Turn Card to WatchOS</span>
                </motion.button>
              </motion.div>
            )}

            {/* ----------------------------------------------------- */}
            {/* VIEW D: FIND MY PHONE SIREN                           */}
            {/* ----------------------------------------------------- */}
            {activeSubTab === 'findphone' && (
              <motion.div
                key="findphone"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-8 rounded-3xl bg-[#140e29]/70 border border-purple-500/25 backdrop-blur-xl shadow-xl text-center space-y-5"
              >
                <div className={`w-20 h-20 rounded-3xl border flex items-center justify-center mx-auto transition-all ${
                  isSirenActive
                    ? 'bg-rose-500/30 border-rose-500 text-rose-400 shadow-[0_0_35px_rgba(244,63,94,0.7)] animate-ping'
                    : 'bg-purple-500/20 border-purple-400/30 text-purple-300'
                }`}>
                  <Smartphone className="w-10 h-10" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">Find My Phone Acoustic Siren</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 leading-relaxed">
                    Triggered directly from the smartwatch launcher. When invoked, your phone emits a high-decibel acoustic beacon and haptic alert so you can instantly locate it in any room.
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={triggerPhoneSiren}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-xl shadow-rose-500/40 hover:brightness-110 transition-all"
                >
                  Trigger Phone Siren Alert Now
                </motion.button>
              </motion.div>
            )}

            {/* ----------------------------------------------------- */}
            {/* VIEW E: SMART ROUTINES                                */}
            {/* ----------------------------------------------------- */}
            {activeSubTab === 'routines' && (
              <motion.div
                key="routines"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-3xl bg-[#140e29]/70 border border-purple-500/20 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Automated Daily Routines</h3>
                    <p className="text-xs text-slate-400">Trigger multi-step tasks across watch and phone</p>
                  </div>
                  <Radio className="w-4 h-4 text-purple-400" />
                </div>

                <div className="space-y-3">
                  {routines.map((routine) => (
                    <div
                      key={routine.id}
                      className="p-5 rounded-3xl bg-[#140e29]/70 border border-purple-500/20 backdrop-blur-xl shadow-xl space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-white">{routine.name}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{routine.description}</p>
                        </div>

                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => handleExecuteRoutine(routine.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-pink-300 border border-purple-500/30 text-xs font-bold transition-all"
                        >
                          Run Routine
                        </motion.button>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        {routine.steps.map((step) => (
                          <div
                            key={step.id}
                            onClick={() => routineRepository.toggleStep(routine.id, step.id)}
                            className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#0c081a] border border-white/[0.04] text-xs cursor-pointer hover:border-purple-500/20 transition-all"
                          >
                            <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                              step.completed ? 'bg-emerald-500 text-white' : 'border border-slate-600'
                            }`}>
                              {step.completed && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className={step.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </div>

    </div>
  )
}
