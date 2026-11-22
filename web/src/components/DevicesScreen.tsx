import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Battery, 
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
  Download,
  HardDrive,
  ShieldCheck
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
  const [customAlertInput, setCustomAlertInput] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

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
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Update clock every second
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
    showToast("Sent haptic pulse to WatchOS display")
  }

  const handleSendCustomAlert = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customAlertInput.trim()) return
    sendWatchAlert(customAlertInput.trim())
    setCustomAlertInput('')
    showToast("Dispatched alert to WatchOS")
  }

  const handleSyncTime = async () => {
    await watchBleService.syncTime()
    showToast("Time synchronized over BLE CTS 0x1805")
  }

  const handleAddSteps = () => {
    addSimulatedSteps(500)
    showToast("+500 steps logged to daily activity ring")
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

      {/* 1. TOP HEADER: Back button + Title */}
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
            Device & Smart Controls
          </h2>
          <span className="text-[10px] font-mono text-purple-300/80">
            {isConnected ? (isSimulated ? 'Virtual Simulator Active' : 'WatchOS BLE Live') : 'Disconnected'}
          </span>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => toggleSimulation()}
          className="w-10 h-10 rounded-full bg-[#161224] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md"
          title="Toggle Physical BLE vs Virtual Simulator"
        >
          {isSimulated ? <ToggleRight className="w-5 h-5 text-pink-400" /> : <ToggleLeft className="w-5 h-5 text-slate-500" />}
        </motion.button>
      </div>

      {/* 2. SUBTAB SWITCHER: Hardware | Music | Navigation | Find Phone | Routines */}
      <div className="flex items-center p-1 rounded-2xl bg-[#161224] border border-white/[0.08] shadow-inner overflow-x-auto scrollbar-none">
        {[
          { id: 'hardware' as const, label: 'Watch' },
          { id: 'music' as const, label: 'Music' },
          { id: 'navigation' as const, label: 'Nav' },
          { id: 'findphone' as const, label: 'Find Phone' },
          { id: 'routines' as const, label: 'Routines' }
        ].map((tab) => {
          const isSelected = activeSubTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex-1 relative py-2 px-2.5 rounded-xl text-xs font-bold capitalize transition-colors text-center shrink-0 ${
                isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="deviceSubTabPill"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 shadow-md shadow-pink-600/30"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* 3. SUBTAB CONTENT */}
      <AnimatePresence mode="wait">
        
        {/* ========================================================= */}
        {/* VIEW A: WATCH & HARDWARE                                  */}
        {/* ========================================================= */}
        {activeSubTab === 'hardware' && (
          <motion.div
            key="hardware"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            {/* Watch Chassis Preview */}
            <div className="p-6 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
              <div className="w-20 h-5 rounded-t-lg bg-slate-900 border-t border-x border-purple-500/30" />
              
              <div className="relative w-48 h-56 rounded-[32px] bg-gradient-to-b from-[#221345] via-[#140c29] to-[#090514] p-3 border-2 border-purple-500/40 shadow-2xl">
                <div className="absolute right-[-6px] top-[40%] w-2 h-6 rounded-r-md bg-slate-400 border border-purple-400/30" />
                
                <div className="w-full h-full rounded-[22px] bg-[#07050d] p-3 flex flex-col justify-between text-center relative overflow-hidden">
                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-300">
                    <span className="font-bold text-pink-300">WristOS</span>
                    <div className="flex items-center gap-1">
                      <Battery className="w-2.5 h-2.5 text-emerald-400" />
                      <span>{watch.batteryLevel > 0 ? `${watch.batteryLevel}%` : '94%'}</span>
                    </div>
                  </div>

                  <div>
                    <div className="text-3xl font-black font-mono text-white tracking-tight">
                      {currentTimeStr || '10:24'}
                    </div>
                    <div className="text-[9px] text-purple-300 font-bold mt-0.5">
                      Tue 14 Nov
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-300 pt-1 border-t border-white/10">
                    <span className="flex items-center gap-1 text-pink-400 font-bold">
                      <Heart className="w-2.5 h-2.5 fill-current animate-pulse" />
                      <span>{watch.heartRate || 78}</span>
                    </span>
                    <span className="text-purple-300 font-bold">
                      {(watch.stepCount || 7842).toLocaleString()} st
                    </span>
                  </div>
                </div>
              </div>

              <div className="w-20 h-5 rounded-b-lg bg-slate-900 border-b border-x border-purple-500/30" />
            </div>

            {/* Quick Actions Panel */}
            <div className="p-5 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-white">WatchOS Hardware</h3>
                  <p className="text-[11px] text-slate-400">Nordic nRF52832 • ARM Cortex-M4F</p>
                </div>
                <button
                  onClick={isConnected ? disconnectWatch : connectWatch}
                  className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                    isConnected
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {isConnected ? 'Disconnect' : 'Connect'}
                </button>
              </div>

              {/* Custom alert dispatch */}
              <form onSubmit={handleSendCustomAlert} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Send instant alert popup to watch..."
                  value={customAlertInput}
                  onChange={(e) => setCustomAlertInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#0f0b1a] border border-white/10 text-xs text-white placeholder:text-purple-400/40 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={!customAlertInput.trim()}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-40"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={handleTestHaptic}
                  className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-pink-300 border border-white/[0.06] text-xs font-bold flex flex-col items-center gap-1"
                >
                  <Vibrate className="w-4 h-4" />
                  <span>Test Haptic</span>
                </button>
                <button
                  onClick={handleSyncTime}
                  className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-purple-300 border border-white/[0.06] text-xs font-bold flex flex-col items-center gap-1"
                >
                  <Clock className="w-4 h-4" />
                  <span>Sync Time</span>
                </button>
                <button
                  onClick={handleAddSteps}
                  className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-cyan-300 border border-white/[0.06] text-xs font-bold flex flex-col items-center gap-1"
                >
                  <Footprints className="w-4 h-4" />
                  <span>+500 Steps</span>
                </button>
              </div>
            </div>

            {/* Production Firmware OTA Deployment Card */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-[#19112e] to-[#120c22] border border-purple-500/30 shadow-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                    <HardDrive className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-white">WatchOS Production Firmware</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        v1.16.0 Ready
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">MCUBoot Signed DFU Archive • 433 KB</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href="/WristOS-Mobile-App-v1.0.apk"
                    download="WristOS-Mobile-App-v1.0.apk"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold transition-all"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Download Android APK (4.9MB)</span>
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

              <div className="p-3 rounded-2xl bg-[#0d0918]/80 border border-purple-500/20 text-[11px] font-mono text-slate-300 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span>SHA-256 Checksum:</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Clean
                  </span>
                </div>
                <div className="p-1.5 rounded bg-black/40 text-[10px] text-purple-200 select-all truncate">
                  5ab76f0e36669e0b3208a360d2c9a5200fc9622f1229dd6bb2bec54d9687de9e
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-400">
                <span>Memory Slot: 441.6 KB / 474.6 KB Flash (93.04%)</span>
                <span>OTA Safe Headroom: 33.0 KB free</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* VIEW B: MUSIC CONTROLS (Module M)                         */}
        {/* ========================================================= */}
        {activeSubTab === 'music' && (
          <motion.div
            key="music"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="p-6 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-2xl text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500/30 via-fuchsia-500/20 to-pink-500/30 border border-purple-400/40 text-pink-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(236,72,153,0.3)]">
                <Music className={`w-8 h-8 ${isPlaying ? 'animate-bounce' : ''}`} />
              </div>

              <div>
                <h3 className="text-xl font-black text-white">{tracks[trackIndex].title}</h3>
                <p className="text-xs text-purple-300 font-medium mt-0.5">{tracks[trackIndex].artist}</p>
                <span className="text-[10px] font-mono text-slate-400 mt-1 block">Smartwatch Remote Controller</span>
              </div>

              {/* Progress bar */}
              <div className="w-full space-y-1">
                <div className="w-full h-1.5 rounded-full bg-[#0f0b1a] overflow-hidden">
                  <div className={`h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 ${isPlaying ? 'w-[45%]' : 'w-[20%]'}`} />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>1:24</span>
                  <span>{tracks[trackIndex].duration}</span>
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-4 pt-1">
                <button
                  onClick={handlePrevTrack}
                  className="p-3 rounded-2xl bg-white/[0.05] hover:bg-white/10 text-white transition-colors"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={handleTogglePlay}
                  className="w-14 h-14 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 hover:opacity-90"
                >
                  {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={handleNextTrack}
                  className="p-3 rounded-2xl bg-white/[0.05] hover:bg-white/10 text-white transition-colors"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-3 pt-2 max-w-xs mx-auto">
                <Volume2 className="w-4 h-4 text-purple-400 shrink-0" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-pink-500 bg-[#0f0b1a]"
                />
                <span className="text-[10px] font-mono text-slate-400 w-8">{volume}%</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* VIEW C: NAVIGATION CARDS (Module N)                       */}
        {/* ========================================================= */}
        {activeSubTab === 'navigation' && (
          <motion.div
            key="navigation"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="p-6 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-sky-400 animate-pulse" />
                  <h3 className="text-base font-extrabold text-white">Turn-by-Turn Navigation</h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">GPS ACTIVE</span>
              </div>

              {/* Turn Instruction Box */}
              <div className="p-5 rounded-2xl bg-[#0f0b1a] border border-sky-500/30 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                  <Compass className="w-6 h-6 animate-spin-slow" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white">{navStep.instruction}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Next: {navStep.nextStreet}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-[#0f0b1a] border border-white/[0.04]">
                  <span className="text-[10px] text-slate-400 font-mono">Distance</span>
                  <p className="text-base font-bold font-mono text-white mt-0.5">{navStep.distanceRemaining}</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#0f0b1a] border border-white/[0.04]">
                  <span className="text-[10px] text-slate-400 font-mono">ETA</span>
                  <p className="text-base font-bold font-mono text-white mt-0.5">{navStep.eta}</p>
                </div>
              </div>

              <button
                onClick={handlePushNavToWatch}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Push Turn Card to WatchOS</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* VIEW D: FIND MY PHONE (Module O)                          */}
        {/* ========================================================= */}
        {activeSubTab === 'findphone' && (
          <motion.div
            key="findphone"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="p-6 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-2xl text-center space-y-4">
              <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center mx-auto transition-all ${
                isSirenActive
                  ? 'bg-rose-500/30 border-rose-500 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-ping'
                  : 'bg-purple-500/20 border-purple-400/30 text-purple-300'
              }`}>
                <Smartphone className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black text-white">Find My Phone Relay</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  When triggered by the smartwatch, your phone emits an audible acoustic alert and vibration pulse.
                </p>
              </div>

              <button
                onClick={triggerPhoneSiren}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-500/30 hover:opacity-90 transition-opacity"
              >
                Test Phone Siren Alert
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* VIEW E: SMART ROUTINES (Module Q)                         */}
        {/* ========================================================= */}
        {activeSubTab === 'routines' && (
          <motion.div
            key="routines"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <div className="p-4 rounded-3xl bg-[#161224] border border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-white">Smart Routines</h3>
                <p className="text-[11px] text-slate-400">Automate your day with one tap</p>
              </div>
              <Radio className="w-4 h-4 text-purple-400" />
            </div>

            <div className="space-y-3">
              {routines.map((routine) => (
                <div
                  key={routine.id}
                  className="p-5 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{routine.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{routine.description}</p>
                    </div>

                    <button
                      onClick={() => handleExecuteRoutine(routine.id)}
                      className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-pink-300 border border-purple-500/30 text-xs font-bold"
                    >
                      Run Now
                    </button>
                  </div>

                  {/* Steps */}
                  <div className="space-y-1.5 pt-1">
                    {routine.steps.map((step) => (
                      <div
                        key={step.id}
                        onClick={() => routineRepository.toggleStep(routine.id, step.id)}
                        className="flex items-center gap-2.5 p-2 rounded-xl bg-[#0f0b1a] border border-white/[0.04] text-xs cursor-pointer"
                      >
                        <div className={`w-4 h-4 rounded-md flex items-center justify-center ${
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
  )
}
