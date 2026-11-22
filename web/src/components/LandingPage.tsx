import { useState } from 'react'
import { 
  Sparkles, 
  Watch, 
  Heart, 
  Activity, 
  Timer, 
  Brain, 
  ArrowRight, 
  Bluetooth, 
  Zap, 
  CheckCircle2, 
  Smartphone, 
  User, 
  CheckSquare, 
  Radio, 
  Download, 
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'

export function LandingPage() {
  const { setViewMode, currentUser, watch, connectWatch } = useAppStore()
  const [activeScreenIndex, setActiveScreenIndex] = useState(0)

  const isConnected = watch.connectionState === 'connected'

  // Showcase screens available to preview on the interactive watch mockup
  const previewScreens = [
    {
      id: 'clock',
      title: 'Minimal Clock Face',
      subtitle: 'Geometric typography with live biometrics & violet silk curve',
      image: '/screens/screen_clock.png',
      tag: 'Watch Face'
    },
    {
      id: 'health',
      title: 'Cardio & ECG Wave',
      subtitle: 'Direct optical PPG sampling with live electrocardiogram pulse',
      image: '/screens/screen_health.png',
      tag: 'Health'
    },
    {
      id: 'activity',
      title: '7-Day Step History',
      subtitle: 'Daily pedometer cadence analytics & weekly activity progress',
      image: '/screens/screen_activity.png',
      tag: 'Activity'
    },
    {
      id: 'focus',
      title: 'Zen Focus Dial',
      subtitle: '25-minute Pomodoro sprint with silent haptic wrist alerts',
      image: '/screens/screen_focus.png',
      tag: 'Focus'
    },
    {
      id: 'tasks',
      title: 'Daily Priority Tasks',
      subtitle: 'Instant phone-to-wrist checklist sync with priority tagging',
      image: '/screens/screen_tasks.png',
      tag: 'Tasks'
    },
    {
      id: 'assistant',
      title: 'Voice AI Assistant',
      subtitle: 'One-tap remote smartphone microphone trigger for Gemini AI',
      image: '/screens/screen_assistant.png',
      tag: 'Voice AI'
    }
  ]

  const currentPreview = previewScreens[activeScreenIndex]

  const featureCards = [
    {
      title: 'Voice AI Assistant',
      description: 'Trigger your phone’s microphone with a single wrist tap to get instant spoken answers, voice task logging, and daily briefings powered by Gemini.',
      icon: Sparkles,
      color: 'from-purple-500 to-indigo-500',
      badge: 'Gemini AI'
    },
    {
      title: 'Cardio & PPG Biometrics',
      description: 'Continuous optical heart-rate sampling, live dynamic ECG waveform graphs, resting pulse tracking, and automatic cardio training zones.',
      icon: Heart,
      color: 'from-rose-500 to-pink-500',
      badge: 'HRS3300 PPG'
    },
    {
      title: 'Cadence & Motion Analytics',
      description: 'Hardware step counter with weekly bar charts, daily progress arcs, and calibrated movement thresholds for zero false steps.',
      icon: Activity,
      color: 'from-emerald-500 to-teal-500',
      badge: 'BMA421 Motion'
    },
    {
      title: 'Zen Focus Sprint',
      description: 'Minimalist circular countdown dial for deep work sessions. Gentle, silent haptic vibrations signal interval start and completion.',
      icon: Timer,
      color: 'from-violet-500 to-purple-500',
      badge: 'Haptic Cues'
    },
    {
      title: 'Smart Daily Agenda',
      description: 'Real-time two-way synchronization of priority tasks. Check items off from your wrist or smartphone with immediate BLE state updates.',
      icon: CheckSquare,
      color: 'from-sky-500 to-blue-500',
      badge: 'BLE GATT Sync'
    },
    {
      title: 'Offline Knowledge Vault',
      description: 'Keep critical notes, emergency contacts, medical IDs, and passkeys securely accessible directly on your wrist even without your phone.',
      icon: Brain,
      color: 'from-amber-500 to-orange-500',
      badge: 'Encrypted Vault'
    }
  ]

  return (
    <div className="min-h-screen w-full bg-[#07050f] text-slate-100 font-sans selection:bg-purple-500/30 selection:text-purple-200">
      
      {/* Background ambient gradient accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[160px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[160px]" />
      </div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#07050f]/80 border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25 border border-white/20">
              <span className="font-mono font-black text-sm text-white">W</span>
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white">WristOS</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                v1.16
              </span>
            </div>
          </div>

          {/* Navigation links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
            <a href="#watch-ui" className="hover:text-purple-400 transition-colors">Watch OS</a>
            <a href="#ecosystem" className="hover:text-purple-400 transition-colors">Companion App</a>
            <a href="#downloads" className="hover:text-purple-400 transition-colors">Downloads</a>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => connectWatch()}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isConnected
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-200'
              }`}
            >
              <Bluetooth className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-purple-400'}`} />
              <span>{isConnected ? 'Watch Connected' : 'Pair BLE'}</span>
            </button>

            <button
              onClick={() => setViewMode('login')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/[0.06] hover:bg-white/10 border border-white/10 text-slate-200 transition-all"
            >
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span className="max-w-[90px] truncate">{currentUser ? currentUser.name.split(' ')[0] : 'Sign In'}</span>
            </button>

            <button
              onClick={() => setViewMode('app')}
              className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/25 hover:opacity-95 transition-all"
            >
              <span>Open App</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 pt-12 sm:pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Hero Content */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300 text-xs font-semibold shadow-sm">
              <Zap className="w-3.5 h-3.5 text-pink-400" />
              <span>FreeRTOS & LVGL 7 Wearable OS with Companion App</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.08] text-white">
              Your Personal Intelligence, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                On Your Wrist.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              A private, open-source smartwatch ecosystem combining real-time biometric tracking, on-device Gemini Voice AI, and seamless smartphone sync over Bluetooth Low Energy.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
              <button
                onClick={() => setViewMode('app')}
                className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white font-bold text-sm shadow-xl shadow-purple-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Launch Companion App</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => connectWatch()}
                className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-white font-semibold text-sm transition-all"
              >
                <Bluetooth className="w-4 h-4 text-purple-400" />
                <span>Pair Watch (BLE)</span>
              </button>

              <a
                href="/WristOS-Mobile-App-v1.0.apk"
                download
                className="flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 text-xs font-medium transition-all"
              >
                <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                <span>Get Android APK</span>
              </a>
            </div>

            {/* Quick Status Pill Highlights */}
            <div className="grid grid-cols-3 gap-3 pt-4 max-w-lg mx-auto lg:mx-0 text-left">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-lg font-black text-white">60 FPS</div>
                <div className="text-[11px] text-slate-400">Smooth LVGL GUI</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-lg font-black text-purple-300">HRS3300</div>
                <div className="text-[11px] text-slate-400">Optical Heart Rate</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="text-lg font-black text-emerald-400">BMA421</div>
                <div className="text-[11px] text-slate-400">Step Pedometer</div>
              </div>
            </div>
          </div>

          {/* Right Interactive Watch Mockup */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative">
              
              {/* Glow backdrop */}
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/30 to-pink-600/30 rounded-[48px] blur-2xl transform scale-95" />

              {/* Watch Physical Frame (240x240 screen in premium rounded chassis) */}
              <div className="relative w-[280px] sm:w-[310px] h-[360px] sm:h-[390px] rounded-[52px] bg-gradient-to-b from-[#252331] via-[#15141e] to-[#0c0b14] p-4 shadow-2xl border-4 border-slate-700/50 flex flex-col items-center justify-center">
                
                {/* Physical side button simulation */}
                <div className="absolute -left-2 top-[45%] w-1.5 h-12 bg-slate-600 rounded-l-md border-r border-black/40" />
                
                {/* 240x240 LCD Bezel */}
                <div className="w-[240px] h-[240px] rounded-3xl bg-black overflow-hidden relative shadow-inner border border-white/10 flex items-center justify-center">
                  <img
                    src={currentPreview.image}
                    alt={currentPreview.title}
                    className="w-[240px] h-[240px] object-cover transition-all duration-300"
                  />
                </div>

                {/* Live Caption Below Watch */}
                <div className="mt-3.5 text-center px-2">
                  <div className="text-xs font-bold text-white flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>{currentPreview.title}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[240px]">
                    {currentPreview.subtitle}
                  </div>
                </div>
              </div>
            </div>

            {/* Screen Selector Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-5 max-w-sm">
              {previewScreens.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => setActiveScreenIndex(idx)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    activeScreenIndex === idx
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'bg-white/[0.05] hover:bg-white/[0.08] text-slate-400'
                  }`}
                >
                  {s.tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CORE CAPABILITIES GRID */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-purple-400">
            Intelligent Architecture
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for Independence & Precision
          </p>
          <p className="text-sm text-slate-400">
            Every feature runs native C++ on the Nordic nRF52 SoC with zero cloud dependencies for offline essentials.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map((feat) => {
            const Icon = feat.icon
            return (
              <div 
                key={feat.title}
                className="p-6 rounded-2xl bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.07] hover:border-purple-500/30 transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${feat.color} flex items-center justify-center shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/[0.06] text-slate-300 border border-white/10">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* COMPANION ECOSYSTEM SHOWCASE */}
      <section id="ecosystem" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div className="lg:col-span-5 space-y-5">
            <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-pink-400">
              Cross-Platform Companion
            </h2>
            <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              One Unified Dashboard Across Web and Mobile
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Whether you are pairing on your laptop via Web Bluetooth or on your phone via the Android release, your daily agenda, heart telemetry, step targets, and AI assistant remain in continuous sync.
            </p>

            <ul className="space-y-3 pt-2 text-xs sm:text-sm text-slate-300">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Web Bluetooth API — instant browser connection without drivers</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Continuous motion service UUID telemetry streaming for live steps</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Personal profiles with custom health targets & step goals</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Instant watch alerts and remote haptic motor feedback</span>
              </li>
            </ul>

            <div className="pt-2">
              <button
                onClick={() => setViewMode('app')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/30 transition-all"
              >
                <span>Enter Companion Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick interactive UI preview card */}
          <div className="lg:col-span-7 rounded-3xl bg-gradient-to-tr from-[#141024] to-[#1e1736] p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center font-bold text-white">
                  {currentUser ? currentUser.name.charAt(0) : 'G'}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{currentUser ? currentUser.name : 'Gaurav Mathpal'}</div>
                  <div className="text-xs text-purple-300 font-mono">Daily Target: {currentUser?.dailyStepGoal ? currentUser.dailyStepGoal.toLocaleString() : '10,000'} steps</div>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                Telemetry Active
              </span>
            </div>

            {/* Simulated Live Gauges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
                <div className="text-xs text-slate-400 mb-1">Step Progress</div>
                <div className="text-2xl font-black text-white">7,842</div>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full w-[78%]" />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
                <div className="text-xs text-slate-400 mb-1">Optical PPG</div>
                <div className="text-2xl font-black text-rose-400">78 <span className="text-xs font-normal text-slate-400">bpm</span></div>
                <div className="text-[11px] text-emerald-400 mt-2 font-mono">Resting Cardio Zone</div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.06]">
                <div className="text-xs text-slate-400 mb-1">Watch Battery</div>
                <div className="text-2xl font-black text-emerald-400">91%</div>
                <div className="text-[11px] text-slate-400 mt-2 font-mono">3.2 days remaining</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DOWNLOADS & SETUP */}
      <section id="downloads" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-white/[0.06]">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
          <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
            Installation & Firmware
          </h2>
          <p className="text-3xl font-black text-white tracking-tight">
            Get WristOS On Your Hardware
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          
          {/* Card 1: Companion Web App */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                <Radio className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Web Companion</h3>
              <p className="text-xs text-slate-400 mb-4">
                Runs instantly in Chrome or Edge with native Web Bluetooth support.
              </p>
            </div>
            <button
              onClick={() => setViewMode('app')}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <span>Launch in Browser</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Android APK */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center mb-4">
                <Smartphone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Android App v1.0</h3>
              <p className="text-xs text-slate-400 mb-4">
                Native release APK with background Bluetooth telemetry and speech engine.
              </p>
            </div>
            <a
              href="/WristOS-Mobile-App-v1.0.apk"
              download
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download APK (20 MB)</span>
            </a>
          </div>

          {/* Card 3: Watch Firmware DFU */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4">
                <Watch className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Firmware DFU v1.16</h3>
              <p className="text-xs text-slate-400 mb-4">
                Signed OTA DFU package for PineTime. Flash via Gadgetbridge or nRF Connect.
              </p>
            </div>
            <a
              href="/WristOS-Firmware-1.16.0-DFU.zip"
              download
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download DFU (420 KB)</span>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-4 border-t border-white/[0.06] text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">WristOS</span>
            <span>— Open-Source Wearable Operating System</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <a href="https://github.com/GauravMathpal/WristOS" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              GitHub
            </a>
            <button onClick={() => setViewMode('app')} className="hover:text-white transition-colors">
              Companion App
            </button>
            <button onClick={() => setViewMode('login')} className="hover:text-white transition-colors">
              Sign In
            </button>
          </div>
        </div>
      </footer>
    </div>
  )
}
