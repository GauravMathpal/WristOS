import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Sparkles, 
  Watch, 
  Heart, 
  Activity, 
  Timer, 
  Brain, 
  Sliders, 
  ArrowRight, 
  ChevronRight, 
  ChevronLeft,
  Bluetooth, 
  Zap, 
  CheckCircle2, 
  Droplets,
  Calendar,
  Lock,
  Play,
  Pause,
  Flame,
  SkipForward,
  SkipBack,
  Navigation,
  Cpu,
  Volume2,
  Clock,
  Radio,
  Search,
  Smartphone,
  Download,
  Layers,
  Wifi,
  User,
  LogOut,
  Menu,
  X,
  Presentation
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import { DualBrandHeader } from './BrandLogos'

export function LandingPage() {
  const { setViewMode, setActiveTab, currentUser, watch, connectWatch, logoutUser } = useAppStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isConnected = watch.connectionState === 'connected'

  const handleOpenCompanion = (tab: any = 'dashboard') => {
    if (currentUser) {
      setViewMode('app')
      setActiveTab(tab)
    } else {
      setViewMode('login')
    }
  }

  // ============================================================
  // 10 Native Firmware Screens (Built with LVGL 7 & FreeRTOS)
  // ============================================================
  const firmwareScreens = [
    {
      id: 'clock',
      title: 'Minimal Pro WatchFace',
      category: 'Watch Face',
      desc: 'Geometric bold typography, real-time clock, signature violet silk wave ribbon, live step count, and dynamic heart rate.',
      image: '/screens/screen_clock.png',
      badge: 'Signature Face'
    },
    {
      id: 'health',
      title: 'Biometrics & ECG Wave',
      category: 'Health',
      desc: 'HRS3300 optical PPG heart-rate sampling, live pulse rate, and dynamic electrocardiogram waveform visualizer.',
      image: '/screens/screen_health.png',
      badge: 'HRS3300 PPG'
    },
    {
      id: 'activity',
      title: '7-Day Activity Chart',
      category: 'Activity',
      desc: 'BMA421 pedometer step cadence with weekly vertical bar analytics across Mon–Sun and daily 10k goal indicators.',
      image: '/screens/screen_activity.png',
      badge: 'BMA421 Motion'
    },
    {
      id: 'focus',
      title: 'Zen Pomodoro Dial',
      category: 'Productivity',
      desc: '25-minute circular countdown arc with silent haptic vibration start and completion alerts on the wrist.',
      image: '/screens/screen_focus.png',
      badge: 'Tactile Cues'
    },
    {
      id: 'tasks',
      title: 'Daily Priority Tasks',
      category: 'Productivity',
      desc: 'Real-time task synchronization from smartphone with URGENT, HIGH, and NORMAL priority tags and check toggling.',
      image: '/screens/screen_tasks.png',
      badge: 'BLE GATT Sync'
    },
    {
      id: 'memory',
      title: 'Knowledge Vault',
      category: 'Intelligence',
      desc: 'Micro-memory vault organizing personal notes by #HEALTH, #WORK, and #ROUTINE directly accessible on your wrist.',
      image: '/screens/screen_memory.png',
      badge: 'Private Vault'
    },
    {
      id: 'assistant',
      title: 'AI Voice Assistant Trigger',
      category: 'Intelligence',
      desc: 'One-tap button to trigger smartphone microphone over Bluetooth, initiate Gemini AI voice capture, and view briefing.',
      image: '/screens/screen_assistant.png',
      badge: 'Gemini Voice'
    },
    {
      id: 'music',
      title: 'Music Remote Controller',
      category: 'Remote Control',
      desc: 'Smartphone media remote with track title, artist display, progress bar, play/pause/skip, and volume swipe gestures.',
      image: '/screens/screen_music.png',
      badge: 'AVRCP Remote'
    },
    {
      id: 'weather',
      title: 'Atmospheric Weather',
      category: 'Lifestyle',
      desc: 'Live temperature, high/low range, condition description, and weather symbols updated via companion app.',
      image: '/screens/screen_weather.png',
      badge: 'Open-Meteo'
    },
    {
      id: 'quicksettings',
      title: 'Quick Settings 2×2',
      category: 'System',
      desc: 'Fast toggles for display brightness, flashlight, vibration DND, and full hardware system settings.',
      image: '/screens/screen_quicksettings.png',
      badge: 'Instant Toggles'
    }
  ]

  const [activeScreenIndex, setActiveScreenIndex] = useState(0)

  // ============================================================
  // Interactive Demos State (Find Phone, Music, Tasks, Pomodoro)
  // ============================================================

  // Siren demo
  const [isSirenActive, setIsSirenActive] = useState(false)
  const playSiren = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.7)

      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.7)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.7)
      setIsSirenActive(true)
      setTimeout(() => setIsSirenActive(false), 800)
    } catch {
      setIsSirenActive(true)
      setTimeout(() => setIsSirenActive(false), 800)
    }
  }

  // Music demo
  const tracks = [
    { title: 'Solaris Odyssey', artist: 'Neon Pulse • Synthwave' },
    { title: 'Midnight Stride', artist: 'Quantum Echo • Chillhop' },
    { title: 'Deep Work Flow', artist: 'Neural Ambient • Focus 432Hz' }
  ]
  const [trackIndex, setTrackIndex] = useState(0)
  const [isPlayingMusic, setIsPlayingMusic] = useState(false)

  // Hydration demo
  const [waterLogged, setWaterLogged] = useState(1750)
  const waterTarget = 2500
  const waterPercent = Math.min(100, Math.round((waterLogged / waterTarget) * 100))

  // Task checklist demo
  const [interactiveTasks, setInteractiveTasks] = useState([
    { id: 't1', title: 'Machine Learning Lab Presentation', due: 'Today, 4:00 PM', priority: 'URGENT', done: false },
    { id: 't2', title: 'Cardio Workout (10,000 Step Milestone)', due: 'Today, 6:30 PM', priority: 'HIGH', done: true },
    { id: 't3', title: 'Verify WristOS BLE GATT Telemetry Schema', due: 'Tomorrow, 10:00 AM', priority: 'NORMAL', done: false }
  ])
  const toggleTask = (id: string) => {
    setInteractiveTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  // Pomodoro demo
  const [pomodoroRunning, setPomodoroRunning] = useState(false)
  const [pomodoroSeconds, setPomodoroSeconds] = useState(25 * 60)
  const [activePreset, setActivePreset] = useState('25 min')

  useEffect(() => {
    if (!pomodoroRunning) return
    const interval = setInterval(() => {
      setPomodoroSeconds(prev => (prev > 0 ? prev - 1 : 25 * 60))
    }, 1000)
    return () => clearInterval(interval)
  }, [pomodoroRunning])

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Simulated Voice Command demo
  const [voiceQueryIdx, setVoiceQueryIdx] = useState(0)
  const voiceQueries = [
    {
      user: "Remember that our project presentation is this Friday at 4 PM.",
      ai: "Understood! Saved to your Knowledge Vault under #Work, and created an urgent task with haptic reminder scheduled for Friday 4:00 PM."
    },
    {
      user: "Give me my morning briefing and current weather.",
      ai: "Good morning! 24°C Partly Cloudy today. You have 3 priority tasks, 1 focus session scheduled, and 7,842 steps logged so far."
    },
    {
      user: "Start a 25-minute Pomodoro focus session on my watch.",
      ai: "Focus session initialized! WatchOS timer synchronized to 25:00 with tactile completion alerts."
    }
  ]

  // Simulated Watch Notification Banner
  const [showSimulatedWatchToast, setShowSimulatedWatchToast] = useState(false)
  const triggerWatchNotification = () => {
    setShowSimulatedWatchToast(true)
    setTimeout(() => setShowSimulatedWatchToast(false), 3200)
  }

  const currentScreen = firmwareScreens[activeScreenIndex]

  // Sticky Navigation Items for the 8 Modules
  const moduleNavItems = [
    { id: 'mod-assistant', title: 'AI Assistant', icon: Brain },
    { id: 'mod-dashboard', title: 'Dashboard', icon: Activity },
    { id: 'mod-memory', title: 'Memory Vault', icon: Lock },
    { id: 'mod-tasks', title: 'Tasks & Cal', icon: Calendar },
    { id: 'mod-health', title: 'Health Hub', icon: Heart },
    { id: 'mod-focus', title: 'Deep Focus', icon: Timer },
    { id: 'mod-wellness', title: 'Wellness', icon: Droplets },
    { id: 'mod-remote', title: 'Smart Remote', icon: Sliders }
  ]

  const scrollToModule = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-[#07060c] text-[#f8fafc] font-sans antialiased selection:bg-purple-500/30 selection:text-purple-200 relative overflow-x-hidden">

      {/* BACKGROUND COSMIC NEBULA GLOWS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div 
          className="absolute -top-[15%] left-[20%] w-[850px] h-[850px] rounded-full opacity-25 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(167, 139, 250, 0.35) 0%, rgba(99, 102, 241, 0.12) 50%, transparent 70%)' }}
        />
        <div 
          className="absolute top-[35%] -right-[15%] w-[850px] h-[850px] rounded-full opacity-20 blur-[150px]"
          style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, rgba(168, 85, 247, 0.1) 50%, transparent 70%)' }}
        />
        <div 
          className="absolute top-[70%] -left-[10%] w-[750px] h-[750px] rounded-full opacity-18 blur-[130px]"
          style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 60%)' }}
        />
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* ============================================================ */}
      {/* 1. FIXED TOP HEADER NAVIGATION                               */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#07060c]/90 border-b border-purple-500/15 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 gap-2">
          
          <DualBrandHeader version="v1.16" onClick={() => setViewMode('landing')} />

          {/* Desktop Navigation Links (Shown on XL screens >= 1280px) */}
          <nav className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-semibold text-slate-300 backdrop-blur-md shrink-0">
            <a href="#hero" className="px-2.5 py-1 rounded-lg hover:text-white hover:bg-white/[0.06] transition-all">Overview</a>
            <a href="#firmware" className="px-2.5 py-1 rounded-lg hover:text-white hover:bg-white/[0.06] transition-all">Watch OS</a>
            <a href="#modules" className="px-2.5 py-1 rounded-lg hover:text-white hover:bg-white/[0.06] transition-all">App Modules</a>
            <a href="#architecture" className="px-2.5 py-1 rounded-lg hover:text-white hover:bg-white/[0.06] transition-all">Architecture</a>
            <a href="#specs" className="px-2.5 py-1 rounded-lg hover:text-white hover:bg-white/[0.06] transition-all">Specs</a>
            <a href="#downloads" className="px-2.5 py-1 rounded-lg hover:text-white hover:bg-white/[0.06] transition-all">Downloads</a>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* BLE Pair Shortcut Button */}
            <button
              onClick={() => isConnected ? {} : connectWatch()}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-semibold transition-all shrink-0 ${
                isConnected
                  ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300 shadow-md shadow-emerald-900/30'
                  : 'border-purple-500/30 bg-purple-950/30 text-purple-300 hover:bg-purple-900/40 hover:text-white'
              }`}
            >
              <Bluetooth className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400' : 'text-purple-400'}`} />
              <span>{isConnected ? 'Watch Ready' : 'Pair BLE'}</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={() => {
                    setViewMode('app')
                    setActiveTab('profile')
                  }}
                  className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-purple-500/30 bg-[#140e2b] text-xs font-medium text-purple-200 hover:border-purple-400 hover:text-white transition-all shrink-0"
                  title="Your Personal Profile"
                >
                  <div className={`w-4 h-4 rounded-full bg-gradient-to-tr ${currentUser.avatarColor}`} />
                  <span className="font-mono">{currentUser.name.split(' ')[0]}</span>
                </button>

                <button
                  onClick={() => {
                    setViewMode('app')
                    setActiveTab('dashboard')
                  }}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all shrink-0"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span className="hidden xs:inline">Dashboard</span>
                  <span className="xs:hidden">App</span>
                </button>

                <button
                  onClick={logoutUser}
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 hover:bg-rose-900/40 text-xs font-semibold transition-all shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-3 h-3" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={() => setViewMode('login')}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl border border-purple-500/30 bg-[#140e2b] text-xs font-bold text-purple-200 hover:border-purple-400 hover:text-white transition-all shadow-md shrink-0"
                >
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => setViewMode('login')}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all shrink-0"
                >
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span className="hidden xs:inline">Get Started</span>
                  <span className="xs:hidden">Start</span>
                </button>
              </div>
            )}

            {/* Mobile / Tablet Hamburger Toggle Button (Shown below XL screens) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(prev => !prev)}
              className="xl:hidden p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white transition-colors shrink-0"
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
            >
              {mobileMenuOpen ? <X className="w-4 h-4 text-pink-400" /> : <Menu className="w-4 h-4 text-purple-300" />}
            </button>
          </div>
        </div>

        {/* Mobile / Tablet Navigation Dropdown Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="xl:hidden overflow-hidden border-t border-purple-500/15 bg-[#07060c]/98 backdrop-blur-3xl px-4 py-4 space-y-3 shadow-2xl"
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <a 
                  href="#hero" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-purple-500/15 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>Overview</span>
                </a>
                <a 
                  href="#firmware" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-purple-500/15 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Watch className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>Watch OS (10)</span>
                </a>
                <a 
                  href="#modules" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-purple-500/15 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>8 App Modules</span>
                </a>
                <a 
                  href="#architecture" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-purple-500/15 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Architecture</span>
                </a>
                <a 
                  href="#specs" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-purple-500/15 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Hardware Specs</span>
                </a>
                <a 
                  href="#downloads" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] hover:bg-purple-500/15 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Download className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>Downloads</span>
                </a>
              </div>

              {/* Mobile BLE Pair and Account Actions */}
              <div className="pt-2 border-t border-white/[0.08] flex flex-col gap-2">
                <button
                  onClick={() => {
                    if (!isConnected) connectWatch()
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                    isConnected
                      ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
                      : 'border-purple-500/30 bg-purple-950/30 text-purple-300 hover:text-white'
                  }`}
                >
                  <Bluetooth className={`w-4 h-4 ${isConnected ? 'text-emerald-400' : 'text-purple-400'}`} />
                  <span>{isConnected ? 'Watch Connected (Ready)' : 'Pair Smartwatch BLE'}</span>
                </button>

                {currentUser ? (
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setViewMode('app')
                        setActiveTab('profile')
                        setMobileMenuOpen(false)
                      }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-purple-500/30 bg-[#140e2b] text-xs font-semibold text-purple-200"
                    >
                      <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${currentUser.avatarColor}`} />
                      <span>{currentUser.name}</span>
                    </button>
                    <button
                      onClick={() => {
                        logoutUser()
                        setMobileMenuOpen(false)
                      }}
                      className="py-2 px-3 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs font-semibold"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setViewMode('login')
                      setMobileMenuOpen(false)
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-purple-500/30 bg-[#140e2b] text-xs font-bold text-purple-200 text-center"
                  >
                    Sign In to Portal
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ============================================================ */}
      {/* 2. HERO SECTION                                              */}
      {/* ============================================================ */}
      <section id="hero" className="relative pt-12 sm:pt-20 pb-12 sm:pb-16 px-3.5 sm:px-8 max-w-6xl mx-auto text-center z-10 overflow-hidden">
        <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
          
          <div className="inline-flex max-w-full items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/40 backdrop-blur-xl text-purple-300 text-[10px] sm:text-xs font-mono font-semibold shadow-lg shadow-purple-950/40">
            <Sparkles className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span className="truncate">OPEN-SOURCE WEARABLE OS & AMBIENT INTELLIGENCE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] shrink-0" />
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] break-words">
            Your Personal Intelligence,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-300 drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              On Your Wrist.
            </span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed break-words px-1 sm:px-0">
            A complete wearable intelligence ecosystem uniting <strong className="text-white font-semibold">FreeRTOS 10 & LVGL 7 bare-metal C++17 firmware</strong> on WatchOS hardware with an <strong className="text-purple-300 font-semibold">8-module React 19, Dexie v4, & Gemini AI</strong> companion smartphone application.
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-3 pt-2 sm:pt-3 w-full">
            <button
              onClick={() => handleOpenCompanion('dashboard')}
              className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 sm:px-7 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>{currentUser ? 'Open My Dashboard' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (currentUser) {
                  isConnected ? setViewMode('app') : connectWatch()
                } else {
                  setViewMode('login')
                }
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl border border-purple-500/40 bg-[#16102c]/80 hover:bg-purple-900/40 text-white font-bold text-sm transition-all hover:scale-105 shadow-md shadow-purple-950/40"
            >
              <Bluetooth className="w-4 h-4 text-cyan-400" />
              <span>{isConnected ? 'View Connected Watch' : 'Pair Watch via Web Bluetooth'}</span>
            </button>

            <a
              href="#downloads"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl border border-white/20 bg-white/5 hover:bg-white/10 text-slate-200 font-bold text-sm transition-all"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Downloads & Binaries</span>
            </a>
          </div>

          {/* Telemetry Feature Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-4 sm:pt-6 text-[11px] sm:text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 10 Native LVGL 7 Screens</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> 8 Companion App Modules</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Multimodal Gemini AI Pipeline</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-pink-400" /> 100% Offline Dexie v4 Storage</span>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. SECTION A: THE FIRMWARE OS — 10 NATIVE SCREENS SHOWCASE   */}
      {/* ============================================================ */}
      <section id="firmware" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto relative z-10 border-t border-purple-500/20">
        
        <div className="text-center space-y-3 mb-10 max-w-3xl mx-auto">
          <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest">Bare-Metal C++17 Firmware</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">The 10 Smartwatch OS Screens</h2>
          <p className="text-sm sm:text-base text-slate-300">
            Running directly on Nordic nRF52832 (64 MHz ARM Cortex-M4F) with FreeRTOS 10 and LVGL 7. Click any screen below to inspect its features on the physical watch chassis.
          </p>
        </div>

        {/* Dual-Panel Showcase: Screen Chips on Left, Physical Watch on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto">
          
          {/* Left Column: Screen Selector Chips & Information (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {firmwareScreens.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setActiveScreenIndex(idx)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    activeScreenIndex === idx
                      ? 'bg-gradient-to-r from-purple-900/60 to-pink-900/50 border-purple-400 text-white shadow-lg shadow-purple-500/25 scale-[1.02]'
                      : 'bg-[#120d24]/60 border-purple-500/20 text-slate-300 hover:border-purple-500/40 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] font-mono font-bold text-purple-400 block uppercase">{s.category}</span>
                  <span className="text-xs font-bold block truncate mt-0.5">{s.title}</span>
                </button>
              ))}
            </div>

            {/* Selected Screen Inspector Card */}
            <div className="p-6 rounded-3xl bg-[#140e29]/90 border border-purple-500/30 backdrop-blur-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold text-pink-400 uppercase tracking-widest">Screen {activeScreenIndex + 1} of {firmwareScreens.length}</span>
                  <h3 className="text-2xl font-black text-white mt-0.5">{currentScreen.title}</h3>
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono text-xs font-bold">
                  {currentScreen.badge}
                </span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {currentScreen.desc}
              </p>

              <div className="flex items-center justify-between pt-2 text-xs font-mono text-slate-400 border-t border-purple-500/15">
                <span>Display: 240×240 IPS Color</span>
                <span>Driver: ST7789 Direct SPI</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveScreenIndex((prev) => (prev - 1 + firmwareScreens.length) % firmwareScreens.length)}
                    className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-colors"
                    title="Previous Screen"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setActiveScreenIndex((prev) => (prev + 1) % firmwareScreens.length)}
                    className="p-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-colors"
                    title="Next Screen"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Physical Watch Chassis with Live Rendered Screenshot (5 cols) */}
          <div className="lg:col-span-5 flex items-center justify-center">
            
            <div className="flex flex-col items-center">
              
              {/* Top Strap */}
              <div className="w-32 h-16 bg-gradient-to-b from-[#161421] to-[#252233] rounded-t-3xl border-t-2 border-x-2 border-purple-900/30 shadow-2xl flex flex-col items-center justify-end pb-2">
                <div className="w-16 h-1 bg-black/40 rounded-full mb-1" />
                <div className="w-20 h-1 bg-black/30 rounded-full" />
              </div>

              {/* Physical Watch Case Chassis */}
              <div className="relative w-[280px] h-[280px] bg-gradient-to-b from-[#2a2638] via-[#1a1726] to-[#120f1c] rounded-[48px] p-4 shadow-[0_25px_60px_-15px_rgba(168,85,247,0.35)] border-2 border-purple-500/30">
                
                {/* Physical Side Push-Button */}
                <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-12 bg-gradient-to-r from-[#201d2c] to-[#3a354a] rounded-r-lg border border-purple-500/30 shadow-lg" />

                <div className="w-full h-full bg-black rounded-[40px] p-2.5 shadow-inner border border-purple-900/40 relative overflow-hidden flex flex-col items-center justify-center">
                  
                  <div className="w-[236px] h-[236px] bg-black rounded-[28px] overflow-hidden relative shadow-2xl flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={currentScreen.id}
                        src={currentScreen.image}
                        alt={currentScreen.title}
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.04 }}
                        transition={{ duration: 0.2 }}
                        className="w-full h-full object-contain pixelated select-none"
                      />
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Bottom Strap */}
              <div className="w-32 h-20 bg-gradient-to-t from-[#161421] to-[#252233] rounded-b-3xl border-b-2 border-x-2 border-purple-900/30 shadow-2xl flex flex-col items-center pt-2">
                <div className="w-20 h-1 bg-black/30 rounded-full mb-1" />
                <div className="w-16 h-1 bg-black/40 rounded-full" />
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* ============================================================ */}
      {/* 4. SECTION B: THE 8 COMPANION APP MODULES                   */}
      {/* ============================================================ */}
      <section id="modules" className="py-20 px-4 sm:px-8 max-w-6xl mx-auto relative z-10 border-t border-purple-500/20">
        
        <div className="text-center space-y-3 mb-10 max-w-3xl mx-auto">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">Ambient Smartphone Companion</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">The 8 Companion App Modules</h2>
          <p className="text-sm sm:text-base text-slate-300">
            Explore all 8 companion intelligence modules below, or use the quick-jump bar to inspect any subsystem.
          </p>
        </div>

        {/* STICKY QUICK JUMP PILL BAR */}
        <div className="sticky top-16 z-40 py-2.5 w-full backdrop-blur-2xl bg-[#07060c]/90 border-y border-purple-500/20 mb-8 sm:mb-12 shadow-2xl">
          <div className="max-w-6xl mx-auto flex items-center justify-start sm:justify-center gap-2 overflow-x-auto scrollbar-none py-1 px-2 sm:px-4 text-xs">
            {moduleNavItems.map((m) => (
              <button
                key={m.id}
                onClick={() => scrollToModule(m.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-purple-500/25 bg-[#140e2b]/80 hover:bg-purple-900/40 hover:border-purple-400 text-slate-300 hover:text-white transition-all shrink-0 font-medium"
              >
                <m.icon className="w-3.5 h-3.5 text-purple-400" />
                <span>{m.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* VERTICAL STREAM: ALL 8 MODULES DISPLAYED SEQUENTIALLY */}
        <div className="space-y-16">

          {/* ========================================== */}
          {/* MODULE 1: PERSONAL AI ASSISTANT            */}
          {/* ========================================== */}
          <div
            id="mod-assistant"
            className="p-8 sm:p-10 rounded-[36px] bg-gradient-to-br from-[#1b1238]/90 via-[#130d29]/80 to-[#0c081e]/95 border-2 border-purple-500/30 shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-pink-500 to-purple-600 p-[1.5px] shadow-lg shadow-pink-500/30">
                  <div className="w-full h-full bg-[#0d0918] rounded-[14px] flex items-center justify-center">
                    <Brain className="w-6 h-6 text-pink-400 animate-pulse" />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest">Module 01 • Multimodal Intelligence</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-white">Personal AI Assistant</h3>
                  <p className="text-xs text-purple-300 font-medium">Google Gemini context understanding with Web Speech API phone microphone pipeline</p>
                </div>
              </div>

              <button
                onClick={() => handleOpenCompanion('assistant')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>{currentUser ? 'Open Assistant Screen' : 'Sign In to Access'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Voice Waveform Visualizer Demonstration */}
            <div className="p-5 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 space-y-4 mb-6 shadow-inner">
              <div className="flex items-center justify-between text-xs font-mono text-purple-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Live Voice Pipeline Simulation
                </span>
                <button
                  onClick={() => setVoiceQueryIdx((prev) => (prev + 1) % voiceQueries.length)}
                  className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30 transition-all text-[11px]"
                >
                  ⚡ Next Sample Query
                </button>
              </div>

              {/* Animated 20-bar Audio Spectrum */}
              <div className="h-10 flex items-center justify-center gap-1 px-4 py-2 bg-black/40 rounded-xl border border-purple-900/30">
                {[12, 28, 16, 36, 42, 20, 14, 38, 48, 24, 18, 40, 26, 14, 34, 46, 22, 16, 30, 12].map((height, i) => (
                  <div
                    key={i}
                    style={{ height: `${height}px` }}
                    className="w-1.5 rounded-full bg-gradient-to-t from-purple-500 via-pink-400 to-cyan-400"
                  />
                ))}
              </div>

              {/* Dialogue Bubble */}
              <div className="space-y-2">
                <div className="p-3 rounded-xl bg-purple-900/20 border border-purple-500/30 text-xs text-white">
                  <strong className="text-pink-300">User (Voice Input):</strong> "{voiceQueries[voiceQueryIdx].user}"
                </div>
                <div className="p-3 rounded-xl bg-[#17122e] border border-cyan-500/30 text-xs text-cyan-200">
                  <strong className="text-cyan-400">WristOS AI:</strong> "{voiceQueries[voiceQueryIdx].ai}"
                </div>
              </div>
            </div>

            {/* Feature Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Voice input pipeline utilizing Web Speech API directly through the phone microphone</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Automatic task extraction, calendar event scheduling, and semantic memory detection</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">One-tap physical watch trigger forwarding voice capture requests over BLE GATT</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Multimodal briefings combining live weather, step count, and urgent priority tasks</span>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* MODULE 2: CENTRAL HOME DASHBOARD           */}
          {/* ========================================== */}
          <div
            id="mod-dashboard"
            className="p-8 sm:p-10 rounded-[36px] bg-gradient-to-br from-[#1b1238]/90 via-[#130d29]/80 to-[#0c081e]/95 border-2 border-purple-500/30 shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 p-[1.5px] shadow-lg shadow-purple-500/30">
                  <div className="w-full h-full bg-[#0d0918] rounded-[14px] flex items-center justify-center">
                    <Activity className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest">Module 02 • Core Nexus</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-white">Central Home Dashboard</h3>
                  <p className="text-xs text-purple-300 font-medium">Real-time biometrics, dynamic step arc, weather integration, and quick action bar</p>
                </div>
              </div>

              <button
                onClick={() => handleOpenCompanion('dashboard')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>{currentUser ? 'Open Home Screen' : 'Sign In to Access'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dashboard Telemetry Cards */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
              
              {/* Step Gauge Card (7 cols) */}
              <div className="md:col-span-7 p-5 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-purple-400 uppercase font-bold">Daily Cadence Milestone</span>
                  <p className="text-2xl font-black text-white mt-0.5">7,842 <span className="text-xs text-slate-400 font-normal">/ 10,000 steps</span></p>
                  <p className="text-xs text-slate-400 mt-1">5.4 km traveled • 412 kcal burned</p>
                </div>
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#251c3d" strokeWidth="3" />
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="15" 
                      fill="none" 
                      stroke="#a855f7" 
                      strokeWidth="3" 
                      strokeDasharray="94.2" 
                      strokeDashoffset="20.3"
                      strokeLinecap="round" 
                    />
                  </svg>
                  <span className="absolute text-[11px] font-mono font-bold text-white">78%</span>
                </div>
              </div>

              {/* Weather Capsule (5 cols) */}
              <div className="md:col-span-5 p-5 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Open-Meteo Weather</span>
                  <p className="text-2xl font-black text-white mt-0.5">24°C <span className="text-xs text-slate-400 font-normal">Partly Cloudy</span></p>
                  <p className="text-xs text-slate-400 mt-1">High 27°C • Low 18°C • Rain 10%</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 text-xl">
                  ⛅
                </div>
              </div>

            </div>

            {/* Quick Actions Showcase Pill Bar */}
            <div className="p-4 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Quick Actions Command Bar</span>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <Clock className="w-3 h-3 text-purple-400" />
                  <span>Telemetry Timestamp: 10:24 AM</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Ask AI', 'Add Task', 'Set Reminder', 'Save Memory', 'Start Focus', 'View Health'].map((act, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-200 text-xs font-bold border border-purple-500/30">
                    ⚡ {act}
                  </span>
                ))}
              </div>
            </div>

            {/* Feature Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Semicircular step arc gauge displaying 7,842 / 10,000 progress with real-time sync</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Live weather capsule via Open-Meteo with 15-minute caching and rain notification push</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Daily habit consistency tracker strip, hydration progress bar (+250ml / +500ml)</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Timetable agenda feed highlighting next upcoming class, meeting, or assignment deadline</span>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* MODULE 3: PERSONAL MEMORY VAULT            */}
          {/* ========================================== */}
          <div
            id="mod-memory"
            className="p-8 sm:p-10 rounded-[36px] bg-gradient-to-br from-[#1b1238]/90 via-[#130d29]/80 to-[#0c081e]/95 border-2 border-purple-500/30 shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-purple-600 p-[1.5px] shadow-lg shadow-amber-500/30">
                  <div className="w-full h-full bg-[#0d0918] rounded-[14px] flex items-center justify-center">
                    <Lock className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest">Module 03 • Semantic Storage</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-white">Personal Memory Vault</h3>
                  <p className="text-xs text-purple-300 font-medium">Grounded question answering, category tagging, and WatchOS alert dispatch</p>
                </div>
              </div>

              <button
                onClick={() => handleOpenCompanion('memory')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>{currentUser ? 'Open Memory Vault' : 'Sign In to Access'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Simulated Watch Alert Trigger */}
            <div className="p-4 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Hardware Alert Dispatch:</span>
                <p className="text-xs text-slate-300">Test sending an offline vault note to the WatchOS smartwatch over BLE ANS:</p>
              </div>
              <button
                onClick={triggerWatchNotification}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Watch className="w-3.5 h-3.5" />
                <span>Send Note to Watch Alert</span>
              </button>
            </div>

            {/* Simulated Watch Notification Banner */}
            <AnimatePresence>
              {showSimulatedWatchToast && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-900/80 to-amber-900/60 border border-amber-400/50 flex items-center gap-3 text-xs text-white shadow-xl"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-500/30 border border-amber-400 flex items-center justify-center shrink-0">
                    <Watch className="w-4 h-4 text-amber-300 animate-bounce" />
                  </div>
                  <div>
                    <strong className="text-amber-300 font-bold block">WatchOS Haptic Notification Dispatched!</strong>
                    <span>BLE Alert Service (UUID 0x1811): "Presentation in Auditorium Hall B at 4:00 PM."</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Grounded Semantic Search Preview Box */}
            <div className="p-3.5 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 mb-4 flex items-center gap-2.5 text-xs text-slate-300">
              <Search className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="flex-1 font-mono text-[11px] text-purple-200">
                <span className="text-slate-400">Semantic Query: </span>
                <span>"Where did I save the project dataset credentials?"</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Grounded Result Found
              </span>
            </div>

            {/* 3 Seeded Memory Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {[
                { title: 'Project Dataset Credentials', tag: '#WORK', date: '2 days ago', body: 'Local storage cluster node 172.16.0.4. Auth token cached in secure enclave.' },
                { title: 'Cardio Training Protocol', tag: '#HEALTH', date: 'Yesterday', body: 'Target 70-80% HR max zone (135-145 BPM) for 35 minutes following morning walk.' },
                { title: 'Academic Schedule & Room B', tag: '#ROUTINE', date: 'Today, 9 AM', body: 'Presentation rehearsal scheduled in Auditorium Hall B at 4:00 PM.' }
              ].map((card, i) => (
                <div key={i} className="p-4 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-amber-400">{card.tag}</span>
                    <span className="text-[10px] font-mono text-slate-500">{card.date}</span>
                  </div>
                  <h5 className="text-xs font-bold text-white">{card.title}</h5>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>

            {/* Feature Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Full grounding via Gemini AI: queries are answered strictly from your verified memory notes</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">One-tap haptic notification push dispatching critical notes directly to the WatchOS screen</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Category pills (#WORK, #HEALTH, #ROUTINE) with real-time substring and tag search</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Zero cloud storage leaks: all notes are saved locally in Dexie IndexedDB table</span>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* MODULE 4: TASKS & SMART CALENDAR           */}
          {/* ========================================== */}
          <div
            id="mod-tasks"
            className="p-8 sm:p-10 rounded-[36px] bg-gradient-to-br from-[#1b1238]/90 via-[#130d29]/80 to-[#0c081e]/95 border-2 border-purple-500/30 shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-purple-600 p-[1.5px] shadow-lg shadow-emerald-500/30">
                  <div className="w-full h-full bg-[#0d0918] rounded-[14px] flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest">Module 04 • Prioritized Execution</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-white">Tasks & Smart Calendar</h3>
                  <p className="text-xs text-purple-300 font-medium">Interactive task checklist, priority tagging, and WatchOS BLE synchronization</p>
                </div>
              </div>

              <button
                onClick={() => handleOpenCompanion('tasks')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>{currentUser ? 'Open Tasks Screen' : 'Sign In to Access'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Live Task Checklist Box */}
            <div className="p-5 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 mb-6 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-1">
                <span>Interactive Checklist (Click any checkbox):</span>
                <span>Synced with WatchOS GATT</span>
              </div>

              {interactiveTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => toggleTask(t.id)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    t.done 
                      ? 'bg-purple-950/20 border-purple-900/40 opacity-60' 
                      : 'bg-[#140e29] border-purple-500/30 hover:border-purple-400'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                      t.done ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-purple-400/60'
                    }`}>
                      {t.done && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className={`text-xs font-bold text-white ${t.done ? 'line-through text-slate-400' : ''}`}>
                        {t.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{t.due}</p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    t.priority === 'URGENT' 
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                      : t.priority === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-700/30 text-slate-300 border border-slate-600/40'
                  }`}>
                    {t.priority}
                  </span>
                </div>
              ))}
            </div>

            {/* Feature Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Color-coded priority flags (URGENT, HIGH, NORMAL) synchronized over BLE</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Integrated academic calendar view with filterable weekly lecture and meeting timelines</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">WatchOS haptic reminder push on task due time with interactive completion toggles</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Daily agenda progress bar showing active vs completed task ratios</span>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* MODULE 5: HEALTH & BIOMETRICS HUB          */}
          {/* ========================================== */}
          <div
            id="mod-health"
            className="p-8 sm:p-10 rounded-[36px] bg-gradient-to-br from-[#1b1238]/90 via-[#130d29]/80 to-[#0c081e]/95 border-2 border-purple-500/30 shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-pink-600 p-[1.5px] shadow-lg shadow-rose-500/30">
                  <div className="w-full h-full bg-[#0d0918] rounded-[14px] flex items-center justify-center">
                    <Heart className="w-6 h-6 text-rose-400 animate-pulse" />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest">Module 05 • Cardiovascular & Cadence</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-white">Health & Biometrics Hub</h3>
                  <p className="text-xs text-purple-300 font-medium">4 metabolic heart-rate training zones, step analytics, and monthly statistics</p>
                </div>
              </div>

              <button
                onClick={() => handleOpenCompanion('health')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>{currentUser ? 'Open Health Screen' : 'Sign In to Access'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Live Pulsating ECG Wave & Heart-Rate Telemetry Box */}
            <div className="p-5 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500 animate-pulse" />
                  <span className="text-2xl font-black text-white">74 <span className="text-xs font-normal text-slate-400 font-mono">BPM Resting</span></span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  HRS3300 Optical Sensor Active
                </span>
              </div>

              {/* ECG Waveform Canvas SVG */}
              <div className="h-16 w-full bg-black/50 rounded-xl border border-rose-950/40 relative overflow-hidden flex items-center">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 60">
                  <path
                    d="M 0 30 L 40 30 L 50 15 L 55 45 L 65 5 L 75 40 L 80 30 L 140 30 L 150 15 L 155 45 L 165 5 L 175 40 L 180 30 L 240 30 L 250 15 L 255 45 L 265 5 L 275 40 L 280 30 L 340 30 L 350 15 L 355 45 L 365 5 L 375 40 L 380 30 L 440 30 L 450 15 L 455 45 L 465 5 L 475 40 L 480 30 L 500 30"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* 4 Cardio Training Zones */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {[
                { zone: 'Rest Zone', range: '< 60 bpm', color: 'text-slate-300 bg-slate-900/40 border-slate-700' },
                { zone: 'Fat Burn', range: '60 - 110 bpm', color: 'text-emerald-300 bg-emerald-950/40 border-emerald-500/40' },
                { zone: 'Aerobic', range: '110 - 145 bpm', color: 'text-cyan-300 bg-cyan-950/40 border-cyan-500/40' },
                { zone: 'Peak Zone', range: '> 145 bpm', color: 'text-rose-300 bg-rose-950/40 border-rose-500/40' }
              ].map((z, i) => (
                <div key={i} className={`p-3 rounded-2xl border ${z.color} text-center`}>
                  <span className="text-[10px] font-mono block uppercase font-bold">{z.zone}</span>
                  <span className="text-xs font-extrabold">{z.range}</span>
                </div>
              ))}
            </div>

            {/* Feature Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Custom daily step goal selector: 6,000, 8,000, 10,000, and 12,000 steps</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">30-day monthly performance aggregations, distance estimation, and active calories</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Real HRS3300 optical heart rate sensor data distinguished from simulation mode</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Prominent non-clinical wellness disclaimer banner ensuring medical compliance</span>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* MODULE 6: DEEP FOCUS & POMODORO            */}
          {/* ========================================== */}
          <div
            id="mod-focus"
            className="p-8 sm:p-10 rounded-[36px] bg-gradient-to-br from-[#1b1238]/90 via-[#130d29]/80 to-[#0c081e]/95 border-2 border-purple-500/30 shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-[1.5px] shadow-lg shadow-cyan-500/30">
                  <div className="w-full h-full bg-[#0d0918] rounded-[14px] flex items-center justify-center">
                    <Timer className="w-6 h-6 text-cyan-400" />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest">Module 06 • Deep Work Productivity</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-white">Deep Focus & Pomodoro</h3>
                  <p className="text-xs text-purple-300 font-medium">Circular Pomodoro countdown, lap stopwatch, and BLE timer synchronization</p>
                </div>
              </div>

              <button
                onClick={() => handleOpenCompanion('focus')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>{currentUser ? 'Open Focus Screen' : 'Sign In to Access'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Pomodoro Clock & Presets */}
            <div className="p-5 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 mb-6 flex flex-wrap items-center justify-between gap-6">
              
              <div className="flex items-center gap-5">
                {/* Circular Mini Dial */}
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#251c3d" strokeWidth="3" />
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="15" 
                      fill="none" 
                      stroke="#38bdf8" 
                      strokeWidth="3" 
                      strokeDasharray="94.2" 
                      strokeDashoffset={(94.2 * (pomodoroSeconds / (25 * 60))).toFixed(1)}
                      strokeLinecap="round" 
                    />
                  </svg>
                  <span className="absolute text-xs font-mono font-black text-white">{formatTimer(pomodoroSeconds)}</span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Zen Work Cycle</span>
                  <h4 className="text-xl font-black text-white">{activePreset} Focus Sprint</h4>
                  <p className="text-xs text-slate-400">Silent tactile vibration alert on watch on completion</p>
                </div>
              </div>

              {/* Action Controls & Presets */}
              <div className="flex flex-wrap items-center gap-2">
                {['15 min', '25 min', '45 min', '60 min'].map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setActivePreset(p)
                      setPomodoroSeconds(parseInt(p) * 60)
                      setPomodoroRunning(false)
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      activePreset === p
                        ? 'bg-cyan-500 text-black font-extrabold shadow-md shadow-cyan-500/30'
                        : 'bg-purple-950/40 text-purple-200 border border-purple-500/25 hover:border-purple-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPomodoroRunning(!pomodoroRunning)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    pomodoroRunning
                      ? 'bg-rose-500 text-white'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-extrabold shadow-lg shadow-cyan-500/25'
                  }`}
                >
                  {pomodoroRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-black" />}
                  <span>{pomodoroRunning ? 'Pause' : 'Start Focus'}</span>
                </button>
              </div>

            </div>

            {/* Feature Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">25-minute Pomodoro sprints synchronized directly to the WatchOS focus app dial</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Millisecond-accurate lap stopwatch recording intermediate splits and fastest lap</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Customizable interval presets (15, 25, 45, 60 min) with short & long break cycles</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Silent tactile wrist alert fires without any audible phone ring or room disruption</span>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* MODULE 7: WELLNESS & HABIT ENGINE          */}
          {/* ========================================== */}
          <div
            id="mod-wellness"
            className="p-8 sm:p-10 rounded-[36px] bg-gradient-to-br from-[#1b1238]/90 via-[#130d29]/80 to-[#0c081e]/95 border-2 border-purple-500/30 shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 p-[1.5px] shadow-lg shadow-sky-500/30">
                  <div className="w-full h-full bg-[#0d0918] rounded-[14px] flex items-center justify-center">
                    <Droplets className="w-6 h-6 text-sky-400" />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest">Module 07 • Lifestyle & Recovery</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-white">Wellness & Habit Engine</h3>
                  <p className="text-xs text-purple-300 font-medium">Hydration logger, sleep stage analysis, medication compliance, and streak engine</p>
                </div>
              </div>

              <button
                onClick={() => handleOpenCompanion('health')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>{currentUser ? 'Open Wellness Screen' : 'Sign In to Access'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Hydration Tracker Box */}
            <div className="p-5 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 mb-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Interactive Hydration Logger</span>
                  <h4 className="text-xl font-black text-white mt-0.5">{waterLogged} / {waterTarget} ml <span className="text-xs font-normal text-slate-400">({waterPercent}%)</span></h4>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWaterLogged(prev => Math.min(3500, prev + 250))}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-transform hover:scale-105 flex items-center gap-1.5"
                  >
                    <Droplets className="w-3.5 h-3.5" />
                    <span>+250 ml Water</span>
                  </button>
                  <button
                    onClick={() => setWaterLogged(1750)}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-950/40 text-slate-400 hover:text-white text-xs border border-purple-500/20"
                    title="Reset"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-purple-900/30">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-300"
                  style={{ width: `${waterPercent}%` }}
                />
              </div>

              {/* Habit Streak Tag */}
              <div className="flex items-center gap-2 pt-1 text-xs font-mono">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>Habit Consistency: 🔥 6-Day Streak</span>
                </span>
                <span className="text-slate-400">Medications: 2/2 Taken Today</span>
              </div>
            </div>

            {/* Feature Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Daily habit consistency tracking with flame streak counters (🔥 6-day streak)</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">User-defined water target with one-click intake logging and hydration history</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Medication scheduler with dosage info and Taken / Skipped status checklist</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">All health, hydration, and medication records saved 100% locally with zero cloud sharing</span>
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* MODULE 8: SMART REMOTE & ROUTINES          */}
          {/* ========================================== */}
          <div
            id="mod-remote"
            className="p-8 sm:p-10 rounded-[36px] bg-gradient-to-br from-[#1b1238]/90 via-[#130d29]/80 to-[#0c081e]/95 border-2 border-purple-500/30 shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-[1.5px] shadow-lg shadow-indigo-500/30">
                  <div className="w-full h-full bg-[#0d0918] rounded-[14px] flex items-center justify-center">
                    <Sliders className="w-6 h-6 text-indigo-400" />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest">Module 08 • Ecosystem Hardware Bridge</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-white">Smart Remote & Routines</h3>
                  <p className="text-xs text-purple-300 font-medium">Music remote, turn-by-turn navigation, Find My Phone siren, and smart routines</p>
                </div>
              </div>

              <button
                onClick={() => handleOpenCompanion('devices')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>{currentUser ? 'Open Devices Screen' : 'Sign In to Access'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Music Player Controller & Find My Phone Siren */}
            <div className="p-5 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 mb-6 space-y-4">
              
              {/* Music Player Row */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-purple-950/20 border border-purple-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center">
                    <Volume2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-white">{tracks[trackIndex].title}</h5>
                    <p className="text-xs text-purple-300 font-mono">{tracks[trackIndex].artist}</p>
                  </div>
                </div>

                {/* Frequency Bars */}
                <div className="h-6 flex items-center gap-1">
                  {[10, 22, 16, 26, 14, 20, 28, 12].map((h, i) => (
                    <div
                      key={i}
                      style={{ height: isPlayingMusic ? `${h}px` : '4px' }}
                      className="w-1 rounded-full bg-cyan-400 transition-all duration-200"
                    />
                  ))}
                </div>

                {/* Playback Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTrackIndex(prev => (prev - 1 + tracks.length) % tracks.length)}
                    className="p-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-colors"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsPlayingMusic(!isPlayingMusic)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30"
                  >
                    {isPlayingMusic ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                    <span>{isPlayingMusic ? 'Pause' : 'Play'}</span>
                  </button>

                  <button
                    onClick={() => setTrackIndex(prev => (prev + 1) % tracks.length)}
                    className="p-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Turn-by-Turn Navigation Card */}
              <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/25 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                    <Navigation className="w-4 h-4 text-cyan-300 -rotate-45" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Next Turn: Turn Right onto Tech Parkway in 250m</span>
                    <span className="text-[10px] text-cyan-300 font-mono">Distance to destination: 1.4 km • ETA: 6 mins</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hidden sm:inline-block">
                  GPS Active
                </span>
              </div>

              {/* Find My Phone Acoustic Siren Row */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div>
                  <span className="text-[10px] font-mono text-pink-400 uppercase font-bold">Find My Phone Safety Trigger:</span>
                  <p className="text-xs text-slate-300">Watch sends remote trigger to phone sounding a dual-tone acoustic siren:</p>
                </div>
                
                <button
                  onClick={playSiren}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                    isSirenActive
                      ? 'bg-rose-500/40 border-rose-400 text-rose-200 animate-pulse'
                      : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border-purple-500/40'
                  }`}
                >
                  <Radio className={`w-3.5 h-3.5 ${isSirenActive ? 'animate-spin' : ''}`} />
                  <span>{isSirenActive ? 'Siren Sounding (880Hz)!' : 'Sound Acoustic Siren'}</span>
                </button>
              </div>

            </div>

            {/* Feature Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Music controller with real-time volume slider, track title, and playback navigation</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Turn-by-turn navigation preview cards with next turn instruction, distance, and ETA</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Find My Phone watch trigger sounding an acoustic dual-frequency siren via Web Audio API</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Smart Routines runner (Morning Briefing, Class Schedule, Evening Review automation)</span>
              </div>
            </div>
          </div>

        </div>

      </section>

      {/* ============================================================ */}
      {/* 5. SECTION C: 3-TIER SYSTEM ARCHITECTURE                     */}
      {/* ============================================================ */}
      <section id="architecture" className="py-20 px-4 sm:px-8 max-w-6xl mx-auto relative z-10 border-t border-purple-500/20">
        
        <div className="text-center space-y-3 mb-14">
          <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">Engineering Architecture</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">How WristOS Connects & Syncs</h2>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">
            A cohesive three-tier stack linking low-power silicon bare metal to high-level multimodal intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="p-7 rounded-3xl bg-[#120c24] border border-purple-500/25 space-y-4 hover:border-purple-400/40 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Watch className="w-5 h-5 text-purple-300" />
            </div>
            <h4 className="text-xl font-bold text-white">1. Smartwatch Tier</h4>
            <ul className="text-xs text-slate-300 space-y-2 font-mono">
              <li>• Nordic nRF52832 (64 MHz Cortex-M4F)</li>
              <li>• FreeRTOS 10.0 Preemptive Kernel</li>
              <li>• LittlevGL 7 Double-Buffered 240×240</li>
              <li>• HRS3300 Optical PPG Sensor</li>
              <li>• BMA421 Triaxial Accelerometer</li>
              <li>• CST816S Capacitive Touchscreen</li>
            </ul>
          </div>

          <div className="p-7 rounded-3xl bg-[#120c24] border border-purple-500/25 space-y-4 hover:border-cyan-400/40 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Bluetooth className="w-5 h-5 text-cyan-300" />
            </div>
            <h4 className="text-xl font-bold text-white">2. BLE GATT Protocol</h4>
            <ul className="text-xs text-slate-300 space-y-2 font-mono">
              <li>• Standard CTS (Current Time Sync 0x1805)</li>
              <li>• BAS (Battery Level Telemetry 0x180F)</li>
              <li>• HRS & Motion Step notifications (0x180D)</li>
              <li>• ANS (Haptic notification forward 0x1811)</li>
              <li>• Remote AI voice trigger event service</li>
              <li>• Wireless OTA DFU update service</li>
            </ul>
          </div>

          <div className="p-7 rounded-3xl bg-[#120c24] border border-purple-500/25 space-y-4 hover:border-pink-400/40 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-pink-300" />
            </div>
            <h4 className="text-xl font-bold text-white">3. Companion & AI Tier</h4>
            <ul className="text-xs text-slate-300 space-y-2 font-mono">
              <li>• React 19 + TypeScript + Tailwind CSS</li>
              <li>• Dexie v4 (9 local IndexedDB tables)</li>
              <li>• Google Gemini Multimodal AI engine</li>
              <li>• Web Audio acoustic siren synthesizer</li>
              <li>• Open-Meteo live atmospheric provider</li>
              <li>• Native Android Kotlin App (Jetpack Compose)</li>
            </ul>
          </div>

        </div>

      </section>

      {/* ============================================================ */}
      {/* 6. SECTION D: SYSTEM TECHNICAL SPECIFICATIONS                */}
      {/* ============================================================ */}
      <section id="specs" className="py-20 px-4 sm:px-8 max-w-6xl mx-auto relative z-10 border-t border-purple-500/20">
        <div className="text-center space-y-3 mb-14">
          <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest">Hardware & Software Specifications</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">Technical Deep Dive</h2>
          <p className="text-sm text-slate-300 max-w-2xl mx-auto">
            Comprehensive hardware parameters and software architecture powering the WristOS ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: Silicon & Processing */}
          <div className="p-6 rounded-3xl bg-[#120c24] border border-purple-500/20 space-y-3">
            <div className="flex items-center gap-3">
              <Cpu className="w-5 h-5 text-purple-400" />
              <h4 className="text-base font-bold text-white">Processor & Memory</h4>
            </div>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-purple-500/10">
                <span className="text-slate-400">Microcontroller</span>
                <span className="text-white font-bold">Nordic nRF52832 (ARM Cortex-M4F)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-500/10">
                <span className="text-slate-400">Clock Speed</span>
                <span className="text-white font-bold">64 MHz Hardware FPU</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-500/10">
                <span className="text-slate-400">Internal SRAM</span>
                <span className="text-white font-bold">64 KB Low-Power RAM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-500/10">
                <span className="text-slate-400">On-Chip Flash</span>
                <span className="text-white font-bold">512 KB Internal Flash</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">External Flash</span>
                <span className="text-white font-bold">4 MB SPI NOR Flash (LittleFS)</span>
              </div>
            </div>
          </div>

          {/* Card 2: Display & Interaction */}
          <div className="p-6 rounded-3xl bg-[#120c24] border border-purple-500/20 space-y-3">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-cyan-400" />
              <h4 className="text-base font-bold text-white">Display & Touch</h4>
            </div>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-purple-500/10">
                <span className="text-slate-400">Panel Type</span>
                <span className="text-white font-bold">1.3-inch IPS LCD (ST7789)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-500/10">
                <span className="text-slate-400">Resolution</span>
                <span className="text-white font-bold">240 × 240 pixels (261 ppi)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-500/10">
                <span className="text-slate-400">Touch Controller</span>
                <span className="text-white font-bold">Hynitron CST816S Capacitive</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-500/10">
                <span className="text-slate-400">Graphics Library</span>
                <span className="text-white font-bold">LittlevGL (LVGL) v7.11.0</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Frame Rendering</span>
                <span className="text-white font-bold">Double-Buffered DMA SPI</span>
              </div>
            </div>
          </div>

          {/* Card 3: Biometrics & Sensors */}
          <div className="p-6 rounded-3xl bg-[#120c24] border border-purple-500/20 space-y-3">
            <div className="flex items-center gap-3">
              <Heart className="w-5 h-5 text-rose-400" />
              <h4 className="text-base font-bold text-white">Sensors & Haptics</h4>
            </div>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-purple-500/10">
                <span className="text-slate-400">Heart Rate Sensor</span>
                <span className="text-white font-bold">HRS3300 Optical PPG Sensor</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-500/10">
                <span className="text-slate-400">Motion & Steps</span>
                <span className="text-white font-bold">Bosch BMA421 Triaxial Accelerometer</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-500/10">
                <span className="text-slate-400">Haptic Feedback</span>
                <span className="text-white font-bold">Eccentric Rotating Mass (ERM) Motor</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-500/10">
                <span className="text-slate-400">Battery Monitoring</span>
                <span className="text-white font-bold">Hardware Voltage Divider ADC</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Charging Detect</span>
                <span className="text-white font-bold">Active-Low Charge State GPIO Pin</span>
              </div>
            </div>
          </div>

          {/* Card 4: Connectivity & Software Stack */}
          <div className="p-6 rounded-3xl bg-[#120c24] border border-purple-500/20 space-y-3">
            <div className="flex items-center gap-3">
              <Wifi className="w-5 h-5 text-emerald-400" />
              <h4 className="text-base font-bold text-white">Connectivity & OS</h4>
            </div>
            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-purple-500/10">
                <span className="text-slate-400">Bluetooth</span>
                <span className="text-white font-bold">Bluetooth 5.0 Low Energy (NimBLE)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-500/10">
                <span className="text-slate-400">Real-Time Kernel</span>
                <span className="text-white font-bold">FreeRTOS 10.0.0 Preemptive</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-500/10">
                <span className="text-slate-400">Firmware Language</span>
                <span className="text-white font-bold">C++17 (Modern OOP Architecture)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-purple-500/10">
                <span className="text-slate-400">Companion App</span>
                <span className="text-white font-bold">React 19 + TypeScript + Dexie v4</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Mobile App</span>
                <span className="text-white font-bold">Android 14 Kotlin (Jetpack Compose)</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 7. PRODUCTION DOWNLOADS & LAUNCH GRID                         */}
      {/* ============================================================ */}
      <section id="downloads" className="py-20 px-4 sm:px-8 max-w-6xl mx-auto relative z-10 border-t border-purple-500/20">
        
        <div className="text-center space-y-3 mb-14">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Instant 1-Click Access</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Production Binaries & Launch
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Ready to deploy immediately. Launch the companion app directly in your browser, install the native Android APK, or flash your physical smartwatch.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Card 1: Web Companion App */}
          <div className="p-7 rounded-3xl bg-gradient-to-b from-[#1b1238] to-[#110c22] border-2 border-purple-500/30 flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 border border-purple-500/30">
                <Zap className="w-6 h-6 fill-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Web Companion App</h3>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Instant browser application connecting directly to your watch via Web Bluetooth GATT. No setup or installation required.
              </p>
            </div>
            <button
              onClick={() => handleOpenCompanion('dashboard')}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white font-bold text-xs shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>{currentUser ? 'Open Companion App' : 'Sign In to Companion'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Card 2: Android Native APK */}
          <div className="p-7 rounded-3xl bg-gradient-to-b from-[#15122e] to-[#0c0d1e] border-2 border-cyan-500/30 flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/30">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Android App v1.0</h3>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Native Kotlin application with Jetpack Compose, background BLE sync service, and Gemini voice capture.
              </p>
            </div>
            <a
              href="/WristOS-Mobile-App-v1.0.apk"
              download="WristOS-Mobile-App-v1.0.apk"
              className="w-full py-3.5 rounded-2xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-bold text-xs transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-cyan-300" />
              <span>Download APK (20 MB)</span>
            </a>
          </div>

          {/* Card 3: Watch Firmware DFU */}
          <div className="p-7 rounded-3xl bg-gradient-to-b from-[#111c1d] to-[#081214] border-2 border-emerald-500/30 flex flex-col justify-between shadow-xl">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30">
                <Watch className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Watch Firmware v1.16</h3>
              <p className="text-xs text-slate-300 mb-6 leading-relaxed">
                Signed FreeRTOS + LVGL 7 OTA DFU package with charging UI, haptics, and zero-offset display fix. Flash via Gadgetbridge.
              </p>
            </div>
            <a
              href="/WristOS-Firmware-1.16.0-DFU.zip"
              download="WristOS-Firmware-1.16.0-DFU.zip"
              className="w-full py-3.5 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold text-xs transition-all hover:scale-105 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>Download DFU (420 KB)</span>
            </a>
          </div>

        </div>

        {/* Interactive Project Presentation Sub-URL Banner */}
        <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#1a1135] via-[#120d26] to-[#0c1428] border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 text-violet-300 flex items-center justify-center border border-violet-400/35 shrink-0">
              <Presentation className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-violet-300">
                Design Thinking Lab • Interactive Keynote
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                WristOS Project Presentation
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                Explore the 12-slide interactive project deck featuring research insights, live Watch OS previews, Gemini AI flows, and architecture.
              </p>
            </div>
          </div>

          <a
            href="/presentation/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-violet-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Presentation className="w-4 h-4" />
            <span>Open Presentation</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 8. FOOTER                                                    */}
      {/* ============================================================ */}
      <footer className="border-t border-purple-500/15 py-12 px-6 sm:px-10 max-w-7xl mx-auto relative z-10 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-6">
        
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 p-[1px] flex items-center justify-center">
            <div className="w-full h-full bg-[#0d0918] rounded-[11px] flex items-center justify-center font-bold text-xs text-white font-mono">
              W
            </div>
          </div>
          <div>
            <p className="font-bold text-white">WristOS Ecosystem v1.16</p>
            <p className="text-[11px] text-slate-500">FreeRTOS Bare Metal & Ambient Intelligence</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> InfiniTime 1.16 Ready
          </span>
          <a href="/presentation/" className="text-violet-300 hover:text-white transition-colors font-semibold">
            Presentation
          </a>
          <a href="https://github.com/GauravMathpal/WristOS" target="_blank" rel="noreferrer" className="hover:text-purple-300 transition-colors">
            GitHub Source
          </a>
          <button 
            onClick={() => setViewMode('login')}
            className="hover:text-purple-300 transition-colors"
          >
            Sign In / Profiles
          </button>
        </div>

      </footer>

    </div>
  )
}
