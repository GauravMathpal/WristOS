import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Bluetooth, 
  Mail, 
  Zap, 
  ArrowLeft, 
  CheckCircle2, 
  Lock, 
  RefreshCw,
  ArrowRight
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'

export function LoginScreen() {
  const { 
    setViewMode, 
    setActiveTab, 
    watch, 
    connectWatch, 
    isSimulated, 
    toggleSimulation 
  } = useAppStore()

  const [authTab, setAuthTab] = useState<'pair' | 'email' | 'guest'>('pair')
  const [email, setEmail] = useState('')
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [isScanning, setIsScanning] = useState(false)

  const isConnected = watch.connectionState === 'connected'

  // Handle Watch Pairing scan trigger
  const handlePairWatch = async () => {
    setIsScanning(true)
    try {
      await connectWatch()
    } catch (err) {
      console.warn("BLE pairing cancelled or error:", err)
    } finally {
      setIsScanning(false)
    }
  }

  // Handle simulated email login
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsSubmittingEmail(true)
    setTimeout(() => {
      setIsSubmittingEmail(false)
      setEmailSent(true)
      setTimeout(() => {
        setViewMode('app')
        setActiveTab('dashboard')
      }, 1000)
    }, 800)
  }

  // Enter as Guest
  const handleEnterGuest = () => {
    toggleSimulation(true)
    setViewMode('app')
    setActiveTab('dashboard')
  }

  return (
    <div className="min-h-screen bg-[#08070b] text-[#f8fafc] font-sans antialiased selection:bg-white/20 selection:text-white relative flex flex-col justify-between p-4 sm:p-8 overflow-hidden">

      {/* Subtle Studio Ambient Highlight */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute -top-[10%] left-[25%] w-[600px] h-[600px] rounded-full pointer-events-none opacity-15 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)' }}
        />
      </div>

      {/* Top Header Bar */}
      <header className="relative z-10 max-w-4xl w-full mx-auto flex items-center justify-between">
        <button
          onClick={() => setViewMode('landing')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
          <span>Back to Homepage</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/[0.08] border border-white/15 flex items-center justify-center">
            <span className="font-mono font-bold text-xs text-white">W</span>
          </div>
          <span className="font-bold text-sm text-white">WristOS Watch</span>
        </div>
      </header>

      {/* Central Luxury Auth Card */}
      <main className="relative z-10 max-w-md w-full mx-auto my-auto py-8">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl border border-white/10 bg-[#0e0d15]/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-6"
        >

          {/* Heading */}
          <div className="text-center space-y-1.5">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Hardware Connectivity</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Connect Your Watch</h1>
            <p className="text-xs text-slate-400">Pair your WatchOS smartwatch or explore the companion dashboard.</p>
          </div>

          {/* Tab Switcher: Pair Watch | Magic Link | Guest Demo */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-white/[0.04] rounded-2xl border border-white/10 text-xs font-medium">
            <button
              onClick={() => setAuthTab('pair')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
                authTab === 'pair'
                  ? 'bg-white text-black font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bluetooth className="w-3.5 h-3.5" />
              <span>Pair Watch</span>
            </button>

            <button
              onClick={() => setAuthTab('email')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
                authTab === 'email'
                  ? 'bg-white text-black font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email</span>
            </button>

            <button
              onClick={() => setAuthTab('guest')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all ${
                authTab === 'guest'
                  ? 'bg-white text-black font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>1-Click Demo</span>
            </button>
          </div>

          {/* TAB CONTENT */}
          <AnimatePresence mode="wait">

            {/* TAB 1: PAIR WATCH NOW */}
            {authTab === 'pair' && (
              <motion.div
                key="tab-pair"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 pt-2"
              >
                
                {/* Concentric Bluetooth Radar Visualizer */}
                <div className="relative flex flex-col items-center justify-center py-6">
                  {/* Subtle Expanding Radar Ripples */}
                  <div className={`absolute w-40 h-40 rounded-full border border-white/10 ${isScanning ? 'animate-ping' : ''}`} style={{ animationDuration: '3s' }} />
                  <div className={`absolute w-28 h-28 rounded-full border border-white/15 ${isScanning ? 'animate-pulse' : ''}`} />
                  
                  {/* Center Watch Icon */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center relative shadow-lg transition-all ${
                    isConnected 
                      ? 'bg-emerald-500 text-black' 
                      : 'bg-white/[0.08] border border-white/20 text-white'
                  }`}>
                    {isConnected ? (
                      <CheckCircle2 className="w-8 h-8 text-black" />
                    ) : (
                      <Bluetooth className={`w-8 h-8 text-white ${isScanning ? 'animate-pulse' : ''}`} />
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="mt-4 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    <span className="text-xs font-mono font-medium text-slate-300">
                      {isConnected 
                        ? `${watch.deviceName || 'WatchOS'} Connected` 
                        : isScanning 
                          ? 'Scanning for WatchOS BLE...' 
                          : 'WatchOS Standby'}
                    </span>
                  </div>
                </div>

                {/* Connected Telemetry Strip (if connected) */}
                {isConnected && (
                  <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Device Name:</span>
                      <span className="text-white font-bold">{watch.deviceName}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Battery Level:</span>
                      <span className="text-emerald-400 font-bold">{watch.batteryLevel > 0 ? `${watch.batteryLevel}%` : '94%'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Current Heart Rate:</span>
                      <span className="text-rose-400 font-bold">{watch.heartRate > 0 ? `${watch.heartRate} bpm` : '78 bpm'}</span>
                    </div>
                  </div>
                )}

                {/* Primary Action Button */}
                <div className="space-y-3">
                  {!isConnected ? (
                    <button
                      onClick={handlePairWatch}
                      disabled={isScanning}
                      className="w-full py-3.5 px-4 rounded-2xl bg-white text-black font-extrabold text-xs sm:text-sm shadow-lg hover:bg-slate-200 active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-black" />
                          <span>Scanning for WatchOS...</span>
                        </>
                      ) : (
                        <>
                          <Bluetooth className="w-4 h-4 text-black" />
                          <span>Pair WatchOS Now</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setViewMode('app')
                        setActiveTab('dashboard')
                      }}
                      className="w-full py-3.5 px-4 rounded-2xl bg-emerald-400 text-black font-extrabold text-xs sm:text-sm shadow-lg hover:bg-emerald-300 active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      <span>Enter Companion App with Paired Watch</span>
                      <ArrowRight className="w-4 h-4 text-black" />
                    </button>
                  )}

                  {/* Virtual Watch Mode Toggle Switch */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs">
                    <div>
                      <p className="font-semibold text-white">Virtual Simulator Watch</p>
                      <p className="text-[10px] text-slate-400">Enable when physical hardware is not nearby</p>
                    </div>
                    <button
                      onClick={() => toggleSimulation()}
                      className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                        isSimulated ? 'bg-white' : 'bg-slate-700'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full transition-transform ${
                        isSimulated ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white'
                      }`} />
                    </button>
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB 2: MAGIC LINK / EMAIL */}
            {authTab === 'email' && (
              <motion.div
                key="tab-email"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 pt-2"
              >
                {emailSent ? (
                  <div className="p-6 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-white mx-auto" />
                    <h3 className="text-sm font-bold text-white">Welcome!</h3>
                    <p className="text-xs text-slate-400">Entering your WristOS companion vault now...</p>
                  </div>
                ) : (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="space-y-1.5 text-left">
                      <label className="text-xs font-medium text-slate-300">Your Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="user@example.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-colors"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingEmail}
                      className="w-full py-3 px-4 rounded-xl bg-white text-black font-bold text-xs shadow hover:bg-slate-200 active:scale-98 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmittingEmail ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="w-3.5 h-3.5 text-black" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {/* TAB 3: 1-CLICK INSTANT DEMO / GUEST MODE */}
            {authTab === 'guest' && (
              <motion.div
                key="tab-guest"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 pt-2"
              >
                <div className="p-4 rounded-2xl bg-white/[0.04] border border-white/10 space-y-2 text-left">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Instant Guest Access</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Explore the full companion dashboard with pre-configured health metrics, task manager, focus timer, and virtual WatchOS telemetry.
                  </p>
                </div>

                <button
                  onClick={handleEnterGuest}
                  className="w-full py-3.5 px-4 rounded-2xl bg-white text-black font-extrabold text-xs sm:text-sm shadow hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Launch Guest Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Privacy & Zero Surveillance Guarantee */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>100% Offline Privacy • On-Device Storage</span>
          </div>

        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center text-[11px] text-slate-500 font-mono">
        WristOS Watch • Engineered for WatchOS Hardware
      </footer>

    </div>
  )
}
