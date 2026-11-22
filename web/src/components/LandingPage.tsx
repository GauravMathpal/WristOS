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
  Bluetooth, 
  Zap, 
  CheckCircle2, 
  Droplets,
  Calendar,
  Lock,
  Play,
  Pause,
  Bell,
  Flame,
  SkipForward,
  SkipBack,
  Navigation,
  Check,
  Cpu,
  Volume2,
  Clock,
  Radio,
  Search,
  CheckSquare,
  Smartphone,
  User
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'

export function LandingPage() {
  const { setViewMode, setActiveTab, currentUser } = useAppStore()

  // 10 Native Firmware Screens (Built with LVGL 7 & FreeRTOS on WatchOS)
  const firmwareScreens = [
    {
      id: 'clock',
      title: 'Minimal Pro WatchFace',
      category: 'Watch Face',
      desc: 'Geometric sans-serif typography, live 10:24 clock, 17-point violet wave ribbon, step count, and real-time heart rate.',
      image: '/screens/screen_clock.png',
      badge: 'Signature Face'
    },
    {
      id: 'health',
      title: 'Biometrics & ECG Wave',
      category: 'Health',
      desc: 'Direct HRS3300 optical PPG heart-rate sampling, live pulse rate, and dynamic electrocardiogram waveform display.',
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
      desc: 'Live temperature, high/low range, condition description, and FontAwesome icons updated via companion app.',
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

  // Interactive firmware screen index & Auto-Tour state
  const [activeScreenIndex, setActiveScreenIndex] = useState(0)
  const [isAutoTour, setIsAutoTour] = useState(false)

  // Auto-Tour effect: advances through the 10 watch screens automatically
  useEffect(() => {
    if (!isAutoTour) return
    const timer = setInterval(() => {
      setActiveScreenIndex((prev) => (prev + 1) % firmwareScreens.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [isAutoTour, firmwareScreens.length])

  // Interactive Find My Phone Siren via Web Audio API
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

  // Interactive Music Player Demo State
  const tracks = [
    { title: 'Solaris Odyssey', artist: 'Neon Pulse • Synthwave' },
    { title: 'Midnight Stride', artist: 'Quantum Echo • Chillhop' },
    { title: 'Deep Work Flow', artist: 'Neural Ambient • Focus 432Hz' }
  ]
  const [trackIndex, setTrackIndex] = useState(0)
  const [isPlayingMusic, setIsPlayingMusic] = useState(false)

  // Interactive Hydration Logger State
  const [waterLogged, setWaterLogged] = useState(1750)
  const waterTarget = 2500
  const waterPercent = Math.min(100, Math.round((waterLogged / waterTarget) * 100))

  // Interactive Task List State for Module 4 Demo
  const [interactiveTasks, setInteractiveTasks] = useState([
    { id: 't1', title: 'Submit Machine Learning Lab Presentation', due: 'Today, 4:00 PM', priority: 'URGENT', done: false },
    { id: 't2', title: 'Cardio Workout (10,000 Step Milestone)', due: 'Today, 6:30 PM', priority: 'HIGH', done: true },
    { id: 't3', title: 'Verify WristOS WatchOS GATT BLE Schema', due: 'Tomorrow, 10:00 AM', priority: 'NORMAL', done: false }
  ])

  const toggleTask = (id: string) => {
    setInteractiveTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  // Interactive Pomodoro Timer State for Module 6 Demo
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

  // Interactive Simulated Voice Command for Module 1 Demo
  const [voiceQueryIdx, setVoiceQueryIdx] = useState(0)
  const voiceQueries = [
    {
      user: "Remember that our machine learning presentation is this Friday at 4 PM.",
      ai: "Understood! Saved to your Knowledge Vault under #Study, and created an urgent task with haptic reminder scheduled for Friday 4:00 PM."
    },
    {
      user: "Give me my morning briefing and current weather.",
      ai: "Good morning! 24°C Partly Cloudy today. You have 3 priority tasks, 1 focus goal scheduled, and 7,842 steps logged so far."
    },
    {
      user: "Start a 25-minute Pomodoro focus session on my watch.",
      ai: "Focus session initialized! WatchOS timer synchronized to 25:00 with tactile completion alerts."
    }
  ]

  // Simulated Watch Notification Banner for Module 3 Demo
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

      {/* ============================================================ */}
      {/* 1. ATMOSPHERIC COSMIC NEBULA SHADERS & PARTICLES             */}
      {/* ============================================================ */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div 
          animate={{
            x: [0, 25, 0],
            y: [0, -20, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
          className="absolute -top-[15%] left-[20%] w-[850px] h-[850px] rounded-full opacity-25 blur-[140px]"
          style={{ background: 'radial-gradient(circle, rgba(167, 139, 250, 0.35) 0%, rgba(99, 102, 241, 0.12) 50%, transparent 70%)' }}
        />
        <motion.div 
          animate={{
            x: [0, -30, 0],
            y: [0, 25, 0],
            scale: [1, 1.08, 1]
          }}
          transition={{ repeat: Infinity, duration: 22, ease: "easeInOut" }}
          className="absolute top-[35%] -right-[15%] w-[850px] h-[850px] rounded-full opacity-20 blur-[150px]"
          style={{ background: 'radial-gradient(circle, rgba(236, 72, 153, 0.25) 0%, rgba(168, 85, 247, 0.1) 50%, transparent 70%)' }}
        />
        <motion.div 
          animate={{
            x: [0, 20, 0],
            y: [0, 15, 0]
          }}
          transition={{ repeat: Infinity, duration: 25, ease: "easeInOut" }}
          className="absolute top-[70%] -left-[10%] w-[750px] h-[750px] rounded-full opacity-18 blur-[130px]"
          style={{ background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 60%)' }}
        />
        {/* Subtle Engineering Grid Backdrop */}
        <div 
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* ============================================================ */}
      {/* 2. FIXED TOP HEADER NAVIGATION                               */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#07060c]/85 border-b border-purple-500/15 px-6 sm:px-10 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          
          <div 
            onClick={() => setViewMode('landing')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 p-[1.5px] shadow-md shadow-purple-500/30 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#0d0918] rounded-[10px] flex items-center justify-center">
                <span className="font-extrabold text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 font-mono">W</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-purple-300 transition-colors">WristOS</span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">Presentation Edition</span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block font-medium">Smartwatch OS & Companion Intelligence</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-300">
            <a href="#hero" className="hover:text-white transition-colors">Overview</a>
            <a href="#firmware" className="hover:text-white transition-colors">Watch OS (10 Screens)</a>
            <a href="#modules" className="hover:text-white transition-colors">8 App Modules</a>
            <a href="#architecture" className="hover:text-white transition-colors">System Architecture</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setViewMode('login')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-purple-500/35 bg-[#16112c]/80 hover:bg-purple-900/40 text-xs font-bold text-white transition-all hover:scale-105 shadow-md shadow-purple-950/40"
            >
              <User className="w-3.5 h-3.5 text-pink-400" />
              <span>Log In / Profiles</span>
            </button>

            <button
              onClick={() => {
                setViewMode('app')
                setActiveTab('profile')
              }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <span>Launch App ({currentUser?.name?.split(' ')[0] || 'User'})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* ============================================================ */}
      {/* 3. HERO OVERVIEW SECTION                                     */}
      {/* ============================================================ */}
      <section id="hero" className="relative z-10 pt-16 sm:pt-24 pb-16 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="text-center space-y-5 max-w-4xl mx-auto">
          
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-purple-500/30 bg-purple-950/40 backdrop-blur-xl text-purple-300 text-xs font-mono font-semibold shadow-lg shadow-purple-950/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>FULL PRODUCT PRESENTATION & DEMONSTRATION</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white leading-[1.08]"
          >
            Your Personal Intelligence,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-300 drop-shadow-[0_0_30px_rgba(168,85,247,0.4)]">
              On Your Wrist.
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed"
          >
            A complete wearable intelligence ecosystem uniting <strong className="text-white font-semibold">FreeRTOS 10 & LVGL 7 bare-metal C++17 firmware</strong> on WatchOS hardware with an <strong className="text-purple-300 font-semibold">8-module React 19, Dexie v4, & Gemini AI</strong> companion smartphone application.
          </motion.p>

          {/* Quick CTA Actions */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-3"
          >
            <button
              onClick={() => {
                setViewMode('app')
                setActiveTab('dashboard')
              }}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white font-extrabold text-sm shadow-xl shadow-purple-600/30 hover:scale-105 active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Launch Companion Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setViewMode('login')}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-purple-500/40 bg-[#16102c]/80 hover:bg-purple-900/40 text-white font-bold text-sm transition-all hover:scale-105 shadow-md shadow-purple-950/40"
            >
              <User className="w-4 h-4 text-pink-400" />
              <span>Sign In / Profiles</span>
            </button>

            <a
              href="#modules"
              className="flex items-center gap-1.5 px-5 py-3.5 rounded-2xl text-slate-400 hover:text-white text-sm font-semibold transition-colors"
            >
              <span>Scroll 8 App Modules</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </motion.div>

          {/* Presentation Telemetry Strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 15+ Native LVGL 7 Screens</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> 8 Companion App Modules</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Multimodal Gemini AI Pipeline</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-pink-400" /> 9 Offline Dexie v4 Tables</span>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. SECTION A: THE FIRMWARE OS — 10 NATIVE SCREENS SHOWCASE   */}
      {/* ============================================================ */}
      <section id="firmware" className="py-20 px-4 sm:px-8 max-w-7xl mx-auto relative z-10 border-t border-purple-500/20">
        
        <div className="text-center space-y-3 mb-10 max-w-3xl mx-auto">
          <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest">Bare-Metal C++17 Firmware</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">The 10 Smartwatch OS Screens</h2>
          <p className="text-sm sm:text-base text-slate-300">
            Running directly on Nordic nRF52832 (64 MHz ARM Cortex-M4F) with FreeRTOS 10 and LVGL 7. Select any screen or activate Presentation Auto-Tour.
          </p>

          {/* Auto-Tour Toggle Button for Pitch Presentations */}
          <div className="flex items-center justify-center pt-2">
            <button
              onClick={() => setIsAutoTour(!isAutoTour)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                isAutoTour
                  ? 'bg-pink-600/30 border-pink-400 text-pink-200 shadow-lg shadow-pink-600/30'
                  : 'bg-[#150f28]/60 border-purple-500/30 text-purple-300 hover:bg-purple-900/30'
              }`}
            >
              {isAutoTour ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-pink-400" />
                  <span>Auto-Tour Active (Advancing Every 3.5s)</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                  <span>Start Presentation Auto-Tour (Plays 10 Screens)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Interactive Dual-Panel Showcase: Screen Chips on Left, 3D Watch on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-6xl mx-auto">
          
          {/* Left Column: Screen Selector Chips & Information (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {firmwareScreens.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveScreenIndex(idx)
                    setIsAutoTour(false)
                  }}
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
                <span>Driver: LVGL 7 Double-Buffered</span>
              </div>
            </div>

          </div>

          {/* Right Column: Physical Watch Chassis with Live Rendered Screenshot (5 cols) */}
          <div className="lg:col-span-5 flex justify-center py-4 select-none relative">
            
            {/* Floating Hardware Telemetry Badges Around the Watch */}
            <motion.div 
              animate={{ y: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="hidden sm:flex absolute -top-4 -left-6 z-30 px-3 py-1.5 rounded-xl bg-[#160f2e]/90 border border-purple-500/30 backdrop-blur-md text-[10px] font-mono text-purple-200 items-center gap-1.5 shadow-lg"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nordic nRF52832 • 64MHz</span>
            </motion.div>

            <motion.div 
              animate={{ y: [3, -3, 3] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
              className="hidden sm:flex absolute -bottom-4 -right-6 z-30 px-3 py-1.5 rounded-xl bg-[#160f2e]/90 border border-purple-500/30 backdrop-blur-md text-[10px] font-mono text-pink-200 items-center gap-1.5 shadow-lg"
            >
              <Radio className="w-3.5 h-3.5 text-pink-400" />
              <span>FreeRTOS 10 • Preemptive</span>
            </motion.div>

            <motion.div
              animate={{ y: [-6, 6, -6], rotate: [-0.4, 0.4, -0.4] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative flex flex-col items-center"
            >
              {/* Top Strap */}
              <div className="w-32 h-20 bg-gradient-to-b from-[#161421] to-[#252233] rounded-t-3xl border-t-2 border-x-2 border-purple-900/30 shadow-2xl flex flex-col items-center justify-end pb-2">
                <div className="w-16 h-1 bg-black/40 rounded-full mb-1" />
                <div className="w-20 h-1 bg-black/30 rounded-full mb-1" />
              </div>

              {/* Watch Chassis */}
              <div className="relative w-[280px] h-[310px] sm:w-[310px] sm:h-[340px] bg-gradient-to-tr from-[#13101e] via-[#241f35] to-[#120f1c] rounded-[52px] p-5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_40px_rgba(168,85,247,0.3)] border-2 border-purple-500/30 flex items-center justify-center">
                <div className="absolute -right-3.5 top-[38%] w-3.5 h-16 bg-gradient-to-r from-[#2a263d] to-[#181624] rounded-r-lg border border-purple-500/30 shadow-lg" />

                <div className="w-full h-full bg-black rounded-[40px] p-2.5 shadow-inner border border-purple-900/40 relative overflow-hidden flex flex-col items-center justify-center">
                  
                  {/* Subtle Glass Reflection Sweep Animation */}
                  <motion.div 
                    animate={{ x: ['-120%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", repeatDelay: 3 }}
                    className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 pointer-events-none z-30"
                  />

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
            </motion.div>

          </div>

        </div>

      </section>

      {/* ============================================================ */}
      {/* 5. SECTION B: THE 8 COMPANION APP MODULES (SCROLLABLE 1 BY 1) */}
      {/* ============================================================ */}
      <section id="modules" className="py-20 px-4 sm:px-8 max-w-6xl mx-auto relative z-10 border-t border-purple-500/20">
        
        <div className="text-center space-y-3 mb-10 max-w-3xl mx-auto">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">Scroll-Driven Presentation Reel</span>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">The 8 Companion App Modules</h2>
          <p className="text-sm sm:text-base text-slate-300">
            Scroll continuously down to inspect each module 1-by-1 during your pitch, or use the quick-jump pills below.
          </p>
        </div>

        {/* STICKY PRESENTATION QUICK JUMP PILL BAR */}
        <div className="sticky top-16 z-40 py-3 -mx-4 px-4 sm:-mx-8 sm:px-8 backdrop-blur-2xl bg-[#07060c]/90 border-y border-purple-500/20 mb-12 shadow-2xl">
          <div className="max-w-6xl mx-auto flex items-center justify-start sm:justify-center gap-2 overflow-x-auto no-scrollbar py-1 text-xs">
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

        {/* VERTICAL SCROLL STREAM: ALL 8 MODULES DISPLAYED SEQUENTIALLY */}
        <div className="space-y-16">

          {/* ========================================== */}
          {/* MODULE 1: PERSONAL AI ASSISTANT            */}
          {/* ========================================== */}
          <motion.div
            id="mod-assistant"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                  <p className="text-xs text-purple-300 font-medium">Google Gemini 2.5 context understanding with Web Speech API phone microphone pipeline</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setViewMode('app')
                  setActiveTab('assistant')
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>Launch Assistant Screen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Voice Waveform Visualizer Demonstration */}
            <div className="p-5 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 space-y-4 mb-6 shadow-inner">
              <div className="flex items-center justify-between text-xs font-mono text-purple-300">
                <span className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400 animate-spin" /> Live Voice Pipeline Simulation
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
                  <motion.div
                    key={i}
                    animate={{ height: [`${Math.max(6, height * 0.3)}px`, `${height}px`, `${Math.max(6, height * 0.4)}px`] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.05, ease: "easeInOut" }}
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
                <span className="text-xs text-slate-200">Morning briefings and evening summaries summarizing your agenda, weather, and activity</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">One-tap remote trigger directly from the smartwatch button over Bluetooth Low Energy</span>
              </div>
            </div>
          </motion.div>

          {/* ========================================== */}
          {/* MODULE 2: CENTRAL HOME DASHBOARD           */}
          {/* ========================================== */}
          <motion.div
            id="mod-dashboard"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                  <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest">Module 02 • Daily Command Center</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-white">Central Home Dashboard</h3>
                  <p className="text-xs text-purple-300 font-medium">Single-pane briefing, 6 quick actions, and real-time watch telemetry</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setViewMode('app')
                  setActiveTab('dashboard')
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>Launch Home Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Live Interactive Telemetry Preview: Step Arc & Weather Capsule */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
              
              {/* Step Gauge Arc (7 cols) */}
              <div className="md:col-span-7 p-5 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">Pedometer Cadence</span>
                  <p className="text-2xl font-black text-white mt-0.5">7,842 <span className="text-xs text-slate-400 font-normal">/ 10,000 steps</span></p>
                  <p className="text-xs text-purple-300 mt-1 font-mono">🔥 412 kcal • 5.6 km • 78.4% of daily goal</p>
                </div>
                
                {/* Animated Step Ring */}
                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#251c3d" strokeWidth="3" />
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="15" 
                      fill="none" 
                      stroke="url(#stepGradient)" 
                      strokeWidth="3" 
                      strokeDasharray="94.2" 
                      strokeDashoffset="20.3"
                      strokeLinecap="round" 
                    />
                    <defs>
                      <linearGradient id="stepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#34d399" />
                      </linearGradient>
                    </defs>
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
                <span className="text-[10px] font-mono text-slate-400 uppercase">6 Quick Actions Command Bar</span>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <Clock className="w-3 h-3 text-purple-400" />
                  <span>Telemetry Timestamp: 10:24 AM</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Ask AI', 'Add Task', 'Set Reminder', 'Save Memory', 'Start Focus', 'View Health'].map((act, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-200 text-xs font-bold border border-purple-500/30 hover:scale-105 transition-transform cursor-default">
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
          </motion.div>

          {/* ========================================== */}
          {/* MODULE 3: PERSONAL MEMORY VAULT            */}
          {/* ========================================== */}
          <motion.div
            id="mod-memory"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                onClick={() => {
                  setViewMode('app')
                  setActiveTab('memory')
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>Launch Memory Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Simulated Watch Alert Trigger */}
            <div className="p-4 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Interactive Hardware Dispatch:</span>
                <p className="text-xs text-slate-300">Test sending an offline vault note to the WatchOS smartwatch over BLE ANS:</p>
              </div>
              <button
                onClick={triggerWatchNotification}
                className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Watch className="w-3.5 h-3.5" />
                <span>Send Note to WatchOS Alert</span>
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
                <span>"Where did I save the machine learning dataset credentials?"</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                100% Grounded
              </span>
            </div>

            {/* Interactive Taxonomy Category Chips */}
            <div className="p-4 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 mb-6">
              <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase">Semantic Taxonomy Categories</span>
              <div className="flex flex-wrap gap-2">
                {['#Health', '#Work', '#Study', '#Hardware', '#Routines', '#Personal'].map((tag, i) => (
                  <span key={i} className="px-3 py-1 rounded-xl bg-purple-900/30 text-purple-300 text-xs font-mono border border-purple-500/30">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Feature Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Grounded semantic query engine ("Ask Your Vault") with pre-configured suggestion chips</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Send to Watch action: triggers instant haptic notification on WatchOS via BLE ANS service</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Offline-first private storage inside Dexie IndexedDB with zero cloud exposure</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Full JSON vault export and import for seamless multi-device backup and migration</span>
              </div>
            </div>
          </motion.div>

          {/* ========================================== */}
          {/* MODULE 4: TASKS & SMART CALENDAR           */}
          {/* ========================================== */}
          <motion.div
            id="mod-tasks"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 sm:p-10 rounded-[36px] bg-gradient-to-br from-[#1b1238]/90 via-[#130d29]/80 to-[#0c081e]/95 border-2 border-purple-500/30 shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 p-[1.5px] shadow-lg shadow-emerald-500/30">
                  <div className="w-full h-full bg-[#0d0918] rounded-[14px] flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest">Module 04 • Natural Language Productivity</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-white">Tasks & Smart Calendar</h3>
                  <p className="text-xs text-purple-300 font-medium">NLP task creation, dual-view calendar schedule, and haptic watch alerts</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setViewMode('app')
                  setActiveTab('tasks')
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>Launch Tasks Screen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Live Task Checklist Demo */}
            <div className="p-5 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 mb-6 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-300">
                <span className="font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <span>Live Task Interactive Toggles (Click to Check Off)</span>
                </span>
                <span className="text-slate-400">Syncs with WatchOS GATT Tasks</span>
              </div>

              <div className="space-y-2">
                {interactiveTasks.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => toggleTask(t.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      t.done
                        ? 'bg-purple-950/20 border-purple-500/20 opacity-70'
                        : 'bg-[#150f29]/80 border-purple-500/30 hover:border-purple-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        t.done ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-slate-500'
                      }`}>
                        {t.done && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <span className={`text-xs font-semibold ${t.done ? 'line-through text-slate-400' : 'text-white'}`}>
                          {t.title}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">{t.due}</span>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                      t.priority === 'URGENT' 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : t.priority === 'HIGH'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                    }`}>
                      {t.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Natural-language input: "Finish report tomorrow at 4pm #urgent" auto-populates all fields</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Timetable events categorized by class, meeting, deadline, and personal appointments</span>
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
          </motion.div>

          {/* ========================================== */}
          {/* MODULE 5: HEALTH & BIOMETRICS HUB          */}
          {/* ========================================== */}
          <motion.div
            id="mod-health"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                onClick={() => {
                  setViewMode('app')
                  setActiveTab('health')
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>Launch Health Screen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Live Pulsating ECG Wave & Heart-Rate Telemetry Box */}
            <div className="p-5 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 mb-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.25, 1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 0.85, ease: "easeInOut" }}
                  >
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  </motion.div>
                  <span className="text-2xl font-black text-white">74 <span className="text-xs font-normal text-slate-400 font-mono">BPM Resting</span></span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  HRS3300 Optical Sensor Active
                </span>
              </div>

              {/* Animated ECG Waveform Canvas SVG */}
              <div className="h-16 w-full bg-black/50 rounded-xl border border-rose-950/40 relative overflow-hidden flex items-center">
                <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 500 60">
                  <motion.path
                    d="M 0 30 L 40 30 L 50 15 L 55 45 L 65 5 L 75 40 L 80 30 L 140 30 L 150 15 L 155 45 L 165 5 L 175 40 L 180 30 L 240 30 L 250 15 L 255 45 L 265 5 L 275 40 L 280 30 L 340 30 L 350 15 L 355 45 L 365 5 L 375 40 L 380 30 L 440 30 L 450 15 L 455 45 L 465 5 L 475 40 L 480 30 L 500 30"
                    fill="none"
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathOffset: 0 }}
                    animate={{ pathOffset: [0, 1] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
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
          </motion.div>

          {/* ========================================== */}
          {/* MODULE 6: DEEP FOCUS & POMODORO            */}
          {/* ========================================== */}
          <motion.div
            id="mod-focus"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                onClick={() => {
                  setViewMode('app')
                  setActiveTab('focus')
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>Launch Focus Screen</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Pomodoro Dial Preview */}
            <div className="p-6 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 mb-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                {/* Circular Animated Dial */}
                <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#231a38" strokeWidth="3" />
                    <circle 
                      cx="18" 
                      cy="18" 
                      r="15" 
                      fill="none" 
                      stroke="#22d3ee" 
                      strokeWidth="3" 
                      strokeDasharray="94.2" 
                      strokeDashoffset={pomodoroRunning ? "35" : "0"} 
                      strokeLinecap="round" 
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <span className="absolute font-mono text-xs font-black text-cyan-300">
                    {formatTimer(pomodoroSeconds)}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Preset Focus Interval:</span>
                  <div className="flex gap-1.5 mt-1">
                    {['15 min', '25 min', '45 min', '60 min'].map((p) => (
                      <button
                        key={p}
                        onClick={() => {
                          setActivePreset(p)
                          const mins = parseInt(p)
                          setPomodoroSeconds(mins * 60)
                          setPomodoroRunning(false)
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all ${
                          activePreset === p
                            ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                            : 'bg-purple-950/30 border-purple-500/20 text-slate-300 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Start / Pause Focus Button */}
              <button
                onClick={() => setPomodoroRunning(!pomodoroRunning)}
                className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
                  pomodoroRunning
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/30'
                }`}
              >
                {pomodoroRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                <span>{pomodoroRunning ? 'Pause Session' : 'Start Focus Timer'}</span>
              </button>
            </div>

            {/* Feature Points Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Circular Pomodoro dial with animated countdown ring and custom duration stepper</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">High-precision stopwatch with interactive lap splits logging and delta calculation</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Daily focus goal tracking (120 minutes) with completed session streaks</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#0e091f]/70 border border-purple-500/15 flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="text-xs text-slate-200">Direct timer synchronization with the WatchOS smartwatch over Bluetooth</span>
              </div>
            </div>
          </motion.div>

          {/* ========================================== */}
          {/* MODULE 7: WELLNESS & HABIT ENGINE          */}
          {/* ========================================== */}
          <motion.div
            id="mod-wellness"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="p-8 sm:p-10 rounded-[36px] bg-gradient-to-br from-[#1b1238]/90 via-[#130d29]/80 to-[#0c081e]/95 border-2 border-purple-500/30 shadow-2xl relative overflow-hidden"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-cyan-600 p-[1.5px] shadow-lg shadow-sky-500/30">
                  <div className="w-full h-full bg-[#0d0918] rounded-[14px] flex items-center justify-center">
                    <Droplets className="w-6 h-6 text-sky-400" />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-pink-400 uppercase tracking-widest">Module 07 • Daily Wellness & Hydration</span>
                  <h3 className="text-3xl sm:text-4xl font-black text-white">Wellness & Habit Engine</h3>
                  <p className="text-xs text-purple-300 font-medium">Daily habit streaks, water intake logging, and prescription medication scheduling</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setViewMode('app')
                  setActiveTab('dashboard')
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>View Wellness Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Interactive Hydration Fluid Level & Streak Demo */}
            <div className="p-5 rounded-2xl bg-[#0e091f]/90 border border-purple-500/20 mb-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">Interactive Hydration Reservoir:</span>
                  <p className="text-xl font-black text-white mt-0.5">{waterLogged} <span className="text-xs font-normal text-slate-400">/ {waterTarget} ml ({waterPercent}%)</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setWaterLogged(prev => prev + 250)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/40 hover:bg-cyan-500/30 transition-all hover:scale-105"
                  >
                    +250 ml
                  </button>
                  <button 
                    onClick={() => setWaterLogged(prev => prev + 500)}
                    className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/40 hover:bg-cyan-500/30 transition-all hover:scale-105"
                  >
                    +500 ml
                  </button>
                  <button
                    onClick={() => setWaterLogged(1750)}
                    className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 text-slate-400 hover:text-white text-xs border border-purple-500/20"
                    title="Reset to 1750 ml"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Animated Progress Bar */}
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-purple-900/30">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-400"
                  animate={{ width: `${waterPercent}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              {/* Habit Streak Tag */}
              <div className="flex items-center gap-2 pt-1 text-xs font-mono">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  <Flame className="w-3.5 h-3.5 text-orange-400 animate-bounce" />
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
          </motion.div>

          {/* ========================================== */}
          {/* MODULE 8: SMART REMOTE & ROUTINES          */}
          {/* ========================================== */}
          <motion.div
            id="mod-remote"
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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
                onClick={() => {
                  setViewMode('app')
                  setActiveTab('devices')
                }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white text-xs font-bold shadow-lg shadow-purple-600/30 hover:scale-105 transition-all"
              >
                <span>Launch Devices Screen</span>
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

                {/* Animated Equalizer Frequency Bars */}
                <div className="h-6 flex items-center gap-1">
                  {[10, 22, 16, 26, 14, 20, 28, 12].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={isPlayingMusic ? { height: [`${Math.max(4, h * 0.3)}px`, `${h}px`, `${Math.max(4, h * 0.4)}px`] } : { height: '4px' }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.08, ease: "easeInOut" }}
                      className="w-1 rounded-full bg-cyan-400"
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
                    <Navigation className="w-4 h-4 text-cyan-300 -rotate-45 animate-pulse" />
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
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isSirenActive
                      ? 'bg-rose-600 text-white animate-bounce shadow-lg shadow-rose-600/50 scale-105'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 animate-pulse" />
                  <span>{isSirenActive ? '🔊 Siren Beeping!' : '🔊 Test Phone Siren'}</span>
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
                <span className="text-xs text-slate-200">Smart Routines runner (Morning Briefing, College Schedule, Evening Review automation)</span>
              </div>
            </div>
          </motion.div>

        </div>

      </section>

      {/* ============================================================ */}
      {/* 6. SECTION C: 3-TIER SYSTEM ARCHITECTURE                     */}
      {/* ============================================================ */}
      <section id="architecture" className="py-20 px-4 sm:px-8 max-w-6xl mx-auto relative z-10 border-t border-purple-500/20">
        
        <div className="text-center space-y-3 mb-14">
          <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-widest">Engineering Architecture</span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">How WristOS Connects & Syncs</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="p-7 rounded-3xl bg-[#120c24] border border-purple-500/25 space-y-4 hover:border-purple-400/40 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <Watch className="w-5 h-5 text-purple-300" />
            </div>
            <h4 className="text-xl font-bold text-white">1. Smartwatch Tier</h4>
            <ul className="text-xs text-slate-300 space-y-2 font-mono">
              <li>• WatchOS (Nordic nRF52832)</li>
              <li>• FreeRTOS 10.0 Preemptive Kernel</li>
              <li>• LVGL 7 Double-Buffered 240×240</li>
              <li>• HRS3300 Optical PPG Sensor</li>
              <li>• BMA421 Triaxial Accelerometer</li>
            </ul>
          </div>

          <div className="p-7 rounded-3xl bg-[#120c24] border border-purple-500/25 space-y-4 hover:border-cyan-400/40 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Bluetooth className="w-5 h-5 text-cyan-300" />
            </div>
            <h4 className="text-xl font-bold text-white">2. BLE GATT Protocol</h4>
            <ul className="text-xs text-slate-300 space-y-2 font-mono">
              <li>• Standard CTS (Current Time Sync)</li>
              <li>• BAS (Battery Level Telemetry)</li>
              <li>• HRS & Motion Step notifications</li>
              <li>• ANS (Haptic notification forward)</li>
              <li>• Remote AI voice trigger event</li>
            </ul>
          </div>

          <div className="p-7 rounded-3xl bg-[#120c24] border border-purple-500/25 space-y-4 hover:border-pink-400/40 transition-colors">
            <div className="w-10 h-10 rounded-2xl bg-pink-500/20 border border-pink-500/30 flex items-center justify-center">
              <Brain className="w-5 h-5 text-pink-300" />
            </div>
            <h4 className="text-xl font-bold text-white">3. Companion & AI Tier</h4>
            <ul className="text-xs text-slate-300 space-y-2 font-mono">
              <li>• React 19 + TypeScript frontend</li>
              <li>• Dexie v4 (9 local IndexedDB tables)</li>
              <li>• Google Gemini 2.5 Multimodal AI</li>
              <li>• Web Audio acoustic siren synth</li>
              <li>• Open-Meteo live weather provider</li>
            </ul>
          </div>

        </div>

      </section>

      {/* ============================================================ */}
      {/* 7. LIVE PRESENTATION LAUNCHER CALL TO ACTION                 */}
      {/* ============================================================ */}
      <section className="py-20 px-4 sm:px-8 max-w-7xl mx-auto relative z-10">
        <div className="rounded-[40px] p-8 sm:p-14 bg-gradient-to-r from-purple-950/70 via-fuchsia-950/60 to-pink-950/70 border-2 border-purple-500/40 shadow-[0_0_80px_rgba(168,85,247,0.3)] text-center space-y-6">
          
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">Ready for Presentation Demo</span>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Launch WristOS Live in Your Browser
          </h2>

          <p className="text-sm sm:text-base text-purple-200/90 max-w-2xl mx-auto leading-relaxed">
            Every feature is 100% interactive. Click below to enter the live companion dashboard with pre-seeded health, task, and memory records.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                setViewMode('app')
                setActiveTab('dashboard')
              }}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-white text-purple-950 font-black text-sm shadow-xl hover:bg-purple-100 hover:scale-105 active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4 fill-purple-950" />
              <span>Launch Companion Application</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="/WristOS-Mobile-App-v1.0.apk"
              download="WristOS-Mobile-App-v1.0.apk"
              className="flex items-center gap-2 px-6 py-4 rounded-2xl border border-cyan-400/40 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-200 font-bold text-sm backdrop-blur-xl hover:scale-105 transition-all"
            >
              <Smartphone className="w-4 h-4 text-cyan-300" />
              <span>Download Android APK</span>
            </a>

            <button
              onClick={() => setViewMode('login')}
              className="flex items-center gap-2 px-7 py-4 rounded-2xl border border-white/30 bg-black/40 hover:bg-black/60 text-white font-bold text-sm backdrop-blur-xl hover:scale-105 transition-all"
            >
              <Bluetooth className="w-4 h-4 text-cyan-400" />
              <span>Pair Smartwatch</span>
            </button>
          </div>

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
            <p className="font-bold text-white">WristOS Ecosystem v2.0</p>
            <p className="text-[11px] text-slate-500">FreeRTOS Bare Metal & Multimodal Intelligence</p>
          </div>
        </div>

        <div className="flex items-center gap-6 font-mono text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> InfiniTime 1.16 Ready
          </span>
          <span className="text-slate-400">WatchOS Hardware Verified</span>
          <button 
            onClick={() => setViewMode('login')}
            className="hover:text-purple-300 transition-colors"
          >
            Pair Watch
          </button>
        </div>

      </footer>

    </div>
  )
}
