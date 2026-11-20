import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Palette, 
  Sun, 
  Moon, 
  Laptop, 
  Check, 
  Cloud, 
  Download, 
  Upload, 
  User, 
  LogOut, 
  Mail, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  WifiOff, 
  RotateCcw,
  Sliders,
  Volume2,
  Watch,
  Bell,
  ShieldCheck
} from 'lucide-react'
import { db } from '../lib/db'
import { useAuthStore } from '../stores/useAuthStore'
import { syncService, SyncState } from '../lib/syncService'
import { useThemeStore, PRESET_THEMES } from '../stores/useThemeStore'

export function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<'appearance' | 'preferences' | 'account'>('appearance')
  
  // Theme Store
  const { currentPreset, mode, customColors, setPreset, setMode, setCustomColors, resetToDefault } = useThemeStore()
  const [showCustomPicker, setShowCustomPicker] = useState(currentPreset === 'custom')
  const [customPrimary, setCustomPrimary] = useState(customColors.primary)
  const [customSecondary, setCustomSecondary] = useState(customColors.secondary)

  // Hardware & Voice toggles
  const [autoSync, setAutoSync] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [wristVibrate, setWristVibrate] = useState(true)
  const [exportNotice, setExportNotice] = useState<string | null>(null)
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('wristos_tts_enabled') === 'true'
    }
    return false
  })

  // Auth & Sync state
  const { user, signInWithOtp, signInAnonymously, signOut } = useAuthStore()
  const [emailInput, setEmailInput] = useState('')
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncState>('idle')
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(0)

  // Clean up any legacy API keys on client device
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wristos_gemini_api_key')
    }

    const unsubscribe = syncService.subscribe((state, lastSync) => {
      setSyncStatus(state)
      if (lastSync) setLastSyncTimestamp(lastSync)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const handleToggleTts = () => {
    const next = !ttsEnabled
    setTtsEnabled(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('wristos_tts_enabled', String(next))
      if (!next && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput.trim()) return

    setIsSubmittingAuth(true)
    setAuthMessage(null)

    const { error } = await signInWithOtp(emailInput.trim())
    setIsSubmittingAuth(false)

    if (error) {
      setAuthMessage(`Error: ${error.message}`)
    } else {
      setAuthMessage('Sign-in link sent! Please check your email inbox.')
      setEmailInput('')
    }
  }

  // User Backup / Restore
  const handleExportJson = async () => {
    const tasks = await db.tasks.toArray()
    const memories = await db.memories.toArray()
    const focusSessions = await db.focusSessions.toArray()
    const activityLogs = await db.activityLogs.toArray()
    const exportData = {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      tasks,
      memories,
      focusSessions,
      activityLogs
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wristos_backup_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportNotice('Backup saved successfully to your downloads.')
    setTimeout(() => setExportNotice(null), 3000)
  }

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.tasks) await db.tasks.bulkPut(data.tasks)
        if (data.memories) await db.memories.bulkPut(data.memories)
        if (data.focusSessions) await db.focusSessions.bulkPut(data.focusSessions)
        if (data.activityLogs) await db.activityLogs.bulkPut(data.activityLogs)
        setExportNotice('Data restored successfully!')
        syncService.triggerSync()
        setTimeout(() => setExportNotice(null), 4000)
      } catch {
        alert("Invalid WristOS backup file. Please select a valid backup.")
      }
    }
    reader.readAsText(file)
  }

  const handleApplyCustomColors = () => {
    const gradient = `linear-gradient(135deg, ${customPrimary} 0%, ${customSecondary} 100%)`
    setCustomColors({
      primary: customPrimary,
      secondary: customSecondary,
      gradient,
      border: `color-mix(in srgb, ${customPrimary} 35%, transparent)`
    })
  }

  const themeCardStyles: Record<string, { bg: string; border: string; glow: string; ribbonColors: [string, string, string] }> = {
    aurora: {
      bg: 'from-[#1a0e33] to-[#0d071a]',
      border: 'border-purple-500/50',
      glow: 'shadow-[0_0_25px_rgba(168,85,247,0.45)]',
      ribbonColors: ['#6366F1', '#A855F7', '#EC4899']
    },
    ocean: {
      bg: 'from-[#08182b] to-[#040c17]',
      border: 'border-cyan-500/50',
      glow: 'shadow-[0_0_25px_rgba(6,182,212,0.45)]',
      ribbonColors: ['#0284C7', '#06B6D4', '#38BDF8']
    },
    emerald: {
      bg: 'from-[#082015] to-[#04100b]',
      border: 'border-emerald-500/50',
      glow: 'shadow-[0_0_25px_rgba(16,185,129,0.45)]',
      ribbonColors: ['#059669', '#10B981', '#34D399']
    },
    sunset: {
      bg: 'from-[#260f06] to-[#120703]',
      border: 'border-orange-500/50',
      glow: 'shadow-[0_0_25px_rgba(249,115,22,0.45)]',
      ribbonColors: ['#EA580C', '#F97316', '#FBBF24']
    },
    rose: {
      bg: 'from-[#290817] to-[#13040b]',
      border: 'border-pink-500/50',
      glow: 'shadow-[0_0_25px_rgba(244,63,94,0.45)]',
      ribbonColors: ['#E11D48', '#F43F5E', '#FB7185']
    },
    monochrome: {
      bg: 'from-[#19191c] to-[#0c0c0e]',
      border: 'border-slate-400/50',
      glow: 'shadow-[0_0_25px_rgba(226,232,240,0.35)]',
      ribbonColors: ['#64748B', '#94A3B8', '#E2E8F0']
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header & Section Selector Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-purple-500/25 bg-gradient-to-r from-[#1c123b]/85 via-[#140e2b]/80 to-[#0e0820]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-pink-400" />
              <span>SETTINGS & PREFERENCES</span>
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            Preferences
          </h2>
          <p className="text-xs text-purple-200/80 font-medium">
            Customize themes, companion watch behavior, and cloud backup
          </p>
        </div>

        {/* Section Selector Pills */}
        <div className="flex items-center p-1.5 rounded-2xl bg-[#0d091d]/80 border border-purple-500/25 shadow-inner">
          {[
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'preferences', label: 'Watch & AI', icon: Sliders },
            { id: 'account', label: 'Account & Backup', icon: User },
          ].map((item) => {
            const isSelected = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`relative px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors shrink-0 flex items-center gap-1.5 ${
                  isSelected ? 'text-white' : 'text-slate-400 hover:text-purple-200'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="settingsSubTabPill"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 shadow-md shadow-pink-600/30"
                  />
                )}
                <Icon className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* 1. APPEARANCE TAB */}
        {activeTab === 'appearance' && (
          <motion.div
            key="appearance"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-6"
          >
            {/* "Make it yours" Hero Card */}
            <div className="relative overflow-hidden p-8 sm:p-9 rounded-3xl border border-purple-500/30 bg-gradient-to-b from-[#221345]/90 via-[#150d2c]/85 to-[#0b071a]/95 backdrop-blur-2xl shadow-2xl shadow-purple-950/40 space-y-4">
              <div className="max-w-md space-y-1.5 z-10 relative">
                <span className="text-[10px] font-mono uppercase tracking-widest text-pink-400 font-bold">
                  PERSONALIZE YOUR LOOK
                </span>
                <h3 className="text-2xl font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
                  Make it yours
                </h3>
                <p className="text-xs text-purple-200/80 leading-relaxed font-medium">
                  Choose from 6 curated color schemes or craft your own personalized gradient to match your style.
                </p>
              </div>

              {/* Glowing Luminous Ribbon Wave */}
              <div className="relative h-20 w-full overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 400 60" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="heroRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="50%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                    <filter id="ribbonGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <motion.path
                    d="M 0 30 Q 100 5 200 30 T 400 30"
                    fill="none"
                    stroke="url(#heroRibbonGrad)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter="url(#ribbonGlow)"
                    animate={{
                      d: [
                        "M 0 30 Q 100 5 200 30 T 400 30",
                        "M 0 30 Q 100 55 200 30 T 400 30",
                        "M 0 30 Q 100 5 200 30 T 400 30"
                      ]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 4.5,
                      ease: 'easeInOut'
                    }}
                  />
                </svg>
              </div>
            </div>

            {/* Theme Mode Selector: Light, Dark, System */}
            <div className="p-6 rounded-3xl border border-purple-500/25 bg-gradient-to-b from-[#1b1236]/85 via-[#130d29]/80 to-[#0b081d]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25 space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Display Mode
              </h4>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light' as const, label: 'Light', icon: Sun },
                  { id: 'dark' as const, label: 'Dark', icon: Moon },
                  { id: 'system' as const, label: 'System', icon: Laptop },
                ].map((item) => {
                  const isSelected = mode === item.id
                  const Icon = item.icon
                  return (
                    <motion.button
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setMode(item.id)}
                      className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-gradient-to-b from-purple-500/25 to-pink-500/20 border-purple-400 text-white shadow-xl shadow-purple-500/25'
                          : 'bg-[#140e29]/70 border-purple-500/20 text-purple-300/80 hover:text-white hover:border-purple-500/40'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.7)]' : 'text-purple-300/70'}`} />
                      <span className="text-xs font-bold">{item.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* Predefined Color Themes */}
            <div className="p-6 sm:p-7 rounded-3xl border border-purple-500/25 bg-gradient-to-b from-[#1b1236]/85 via-[#130d29]/80 to-[#0b081d]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                    Color Themes
                  </h4>
                  <p className="text-xs text-purple-200/80 mt-0.5 font-medium">Select your palette</p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={resetToDefault}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-500/15 hover:bg-purple-500/25 text-purple-200 border border-purple-500/30 flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </motion.button>
              </div>

              {/* 6 Theme Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {(Object.keys(PRESET_THEMES) as (keyof typeof PRESET_THEMES)[]).map((themeKey) => {
                  const theme = PRESET_THEMES[themeKey]
                  const isSelected = currentPreset === themeKey
                  const style = themeCardStyles[themeKey] || themeCardStyles.aurora

                  return (
                    <motion.div
                      key={theme.id}
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setPreset(theme.id)}
                      className={`relative p-4 rounded-2xl border cursor-pointer flex flex-col justify-between space-y-3 transition-all overflow-hidden bg-gradient-to-b ${style.bg} ${
                        isSelected
                          ? `${style.border} ${style.glow} ring-2 ring-purple-400/50`
                          : 'border-white/10 hover:border-white/25'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/50 z-10">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      <div className="relative h-14 w-full rounded-xl overflow-hidden p-1 flex items-center justify-center bg-black/40 border border-white/10">
                        <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id={`grad-${theme.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor={style.ribbonColors[0]} />
                              <stop offset="50%" stopColor={style.ribbonColors[1]} />
                              <stop offset="100%" stopColor={style.ribbonColors[2]} />
                            </linearGradient>
                          </defs>
                          <path
                            d="M 0 15 Q 25 5 50 15 T 100 15"
                            fill="none"
                            stroke={`url(#grad-${theme.id})`}
                            strokeWidth="3.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>

                      <div>
                        <h5 className="text-xs font-black text-white">{theme.name}</h5>
                        <p className="text-[10px] text-purple-200/70 line-clamp-1 font-medium">{theme.description}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Custom Theme Creator Accordion */}
              <div className="pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCustomPicker(!showCustomPicker)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-[#140e29]/80 hover:bg-[#1c133a] border border-purple-500/25 text-left transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-pink-500 p-[1.5px] shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                      <div className="w-full h-full rounded-[10px] bg-[#0c0916] flex items-center justify-center text-pink-400">
                        <Palette className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Create Custom Palette</h5>
                      <p className="text-[10px] text-purple-200/70 font-medium">Pick your primary and secondary colors</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-pink-400 font-bold">{showCustomPicker ? '▲' : '▼'}</span>
                </motion.button>

                <AnimatePresence>
                  {showCustomPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-5 mt-2 rounded-2xl bg-[#140e29]/90 border border-purple-500/25 space-y-4 shadow-inner"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-purple-200">Primary Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customPrimary}
                              onChange={(e) => setCustomPrimary(e.target.value)}
                              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                            />
                            <input
                              type="text"
                              value={customPrimary}
                              onChange={(e) => setCustomPrimary(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-black/40 border border-purple-500/30 text-xs font-mono text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-purple-200">Secondary Color</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={customSecondary}
                              onChange={(e) => setCustomSecondary(e.target.value)}
                              className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                            />
                            <input
                              type="text"
                              value={customSecondary}
                              onChange={(e) => setCustomSecondary(e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-black/40 border border-purple-500/30 text-xs font-mono text-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-purple-200">Preview</span>
                        <div 
                          className="w-full h-8 rounded-xl shadow-md border border-white/20"
                          style={{
                            background: `linear-gradient(135deg, ${customPrimary} 0%, ${customSecondary} 100%)`
                          }}
                        />
                      </div>

                      <div className="flex justify-end pt-1">
                        <motion.button
                          whileTap={{ scale: 0.94 }}
                          onClick={handleApplyCustomColors}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-pink-500/30 transition-all"
                        >
                          Apply Theme
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. WATCH & AI PREFERENCES TAB */}
        {activeTab === 'preferences' && (
          <motion.div
            key="preferences"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="p-6 sm:p-7 rounded-3xl border border-purple-500/25 bg-gradient-to-b from-[#1b1236]/85 via-[#130d29]/80 to-[#0b081d]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25 space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500/30 to-purple-500/20 border border-pink-400/40 flex items-center justify-center text-pink-400 shadow-[0_0_16px_rgba(236,72,153,0.35)]">
                <Watch className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">Smart Watch & Assistant</h3>
                <p className="text-[11px] text-purple-200/80 font-medium">Control notifications, wrist vibrations, and AI voice</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* AI Voice Narration */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-purple-500/20 bg-[#140e29]/80">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-pink-400" />
                    <span>AI Voice Responses</span>
                  </p>
                  <p className="text-[11px] text-purple-200/80 font-medium">
                    {ttsEnabled ? 'AI reads messages aloud automatically' : 'AI replies in chat text first (quiet mode)'}
                  </p>
                </div>
                <button
                  onClick={handleToggleTts}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors ${ttsEnabled ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-md shadow-pink-500/40' : 'bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${ttsEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Watch Haptics */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-purple-500/20 bg-[#140e29]/80">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Watch className="w-3.5 h-3.5 text-purple-400" />
                    <span>Watch Vibration Alerts</span>
                  </p>
                  <p className="text-[11px] text-purple-200/80 font-medium">Vibrate smartwatch for alarms, focus blocks, and reminders</p>
                </div>
                <button
                  onClick={() => setWristVibrate(!wristVibrate)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors ${wristVibrate ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-md shadow-pink-500/40' : 'bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${wristVibrate ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Phone Notifications */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-purple-500/20 bg-[#140e29]/80">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Forward Notifications</span>
                  </p>
                  <p className="text-[11px] text-purple-200/80 font-medium">Send agenda reminders and updates directly to your watch</p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors ${notifications ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-md shadow-pink-500/40' : 'bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Auto Sync Telemetry */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-purple-500/20 bg-[#140e29]/80">
                <div>
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Automatic Health Sync</span>
                  </p>
                  <p className="text-[11px] text-purple-200/80 font-medium">Keep daily step count and heart rate synced in real-time</p>
                </div>
                <button
                  onClick={() => setAutoSync(!autoSync)}
                  className={`w-12 h-6 rounded-full p-0.5 transition-colors ${autoSync ? 'bg-gradient-to-r from-purple-500 to-pink-500 shadow-md shadow-pink-500/40' : 'bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${autoSync ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* 3. ACCOUNT & DATA BACKUP TAB */}
        {activeTab === 'account' && (
          <motion.div
            key="account"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="space-y-6"
          >
            {/* Account & Sync Card */}
            <div className="p-6 sm:p-7 rounded-3xl border border-purple-500/25 bg-gradient-to-b from-[#1b1236]/85 via-[#130d29]/80 to-[#0b081d]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500/30 to-teal-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_16px_rgba(52,211,153,0.35)]">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white tracking-tight">Cloud Sync</h3>
                    <p className="text-[11px] text-purple-200/80 font-medium">Keep your tasks, notes, and habits synchronized</p>
                  </div>
                </div>

                {/* Sync status pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#140e29] border border-purple-500/30 shadow-sm self-start sm:self-auto">
                  {syncStatus === 'syncing' && (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      <span className="text-cyan-400">Syncing...</span>
                    </>
                  )}
                  {syncStatus === 'synced' && (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Synced</span>
                    </>
                  )}
                  {syncStatus === 'offline' && (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-amber-400">Offline Mode</span>
                    </>
                  )}
                  {syncStatus === 'error' && (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-rose-400">Sync Retry Pending</span>
                    </>
                  )}
                  {syncStatus === 'idle' && (
                    <>
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <span className="text-purple-300">{user ? 'Up to date' : 'Local Only'}</span>
                    </>
                  )}
                </div>
              </div>

              {/* User Session Info or Login Options */}
              {user ? (
                <div className="p-5 rounded-2xl border border-purple-500/20 bg-[#140e29]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[1.5px]">
                      <div className="w-full h-full rounded-full bg-[#0c0819] flex items-center justify-center font-bold text-xs text-white">
                        {user.email ? user.email.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-white">
                          {user.is_anonymous ? 'Guest Device Session' : user.email}
                        </p>
                        {user.is_anonymous && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            Guest
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-purple-300/70 font-mono">
                        {lastSyncTimestamp ? `Last synced at ${new Date(lastSyncTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Cloud connected'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={() => syncService.triggerSync()}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white/[0.08] hover:bg-white/[0.14] text-white border border-purple-500/30 flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync Now</span>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={() => signOut()}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </motion.button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Instant 1-Click Guest Sync */}
                  <div className="p-5 rounded-2xl border border-purple-500/30 bg-[#160d2e]/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-purple-950/30">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-white">Instant Device Sync</p>
                      <p className="text-[11px] text-purple-200/80 font-medium">Activate cloud sync instantly without needing an email.</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.94 }}
                      onClick={async () => {
                        setIsSubmittingAuth(true)
                        await signInAnonymously()
                        setIsSubmittingAuth(false)
                      }}
                      disabled={isSubmittingAuth}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-pink-500/30 disabled:opacity-40 transition-all shrink-0"
                    >
                      {isSubmittingAuth ? 'Activating...' : 'Enable Cloud Sync (1-Click)'}
                    </motion.button>
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-purple-500/20"></div>
                    <span className="flex-shrink mx-3 text-[10px] uppercase font-mono text-purple-400 font-bold">or sign in with email</span>
                    <div className="flex-grow border-t border-purple-500/20"></div>
                  </div>

                  {/* Email Magic Link Sign In */}
                  <form onSubmit={handleLogin} className="p-5 rounded-2xl border border-purple-500/20 bg-[#140e29]/80 space-y-3">
                    <div>
                      <p className="text-xs font-bold text-white">Sign in with Email</p>
                      <p className="text-[11px] text-purple-200/80 font-medium">Access your data across your phone, tablet, and computer.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Mail className="w-4 h-4 text-purple-400 absolute left-3 top-2.5 pointer-events-none" />
                        <input
                          type="email"
                          placeholder="name@example.com"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-xs text-white placeholder:text-purple-400/50 focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      <motion.button
                        type="submit"
                        whileTap={{ scale: 0.94 }}
                        disabled={isSubmittingAuth || !emailInput.trim()}
                        className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white disabled:opacity-40 transition-all shrink-0 shadow-md"
                      >
                        {isSubmittingAuth ? 'Sending...' : 'Send Magic Link'}
                      </motion.button>
                    </div>

                    {authMessage && (
                      <p className="text-xs text-pink-400 font-bold">{authMessage}</p>
                    )}
                  </form>
                </div>
              )}
            </div>

            {/* Data Backup & Privacy Card */}
            <div className="p-6 sm:p-7 rounded-3xl border border-purple-500/25 bg-gradient-to-b from-[#1b1236]/85 via-[#130d29]/80 to-[#0b081d]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500/30 to-indigo-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shadow-[0_0_16px_rgba(168,85,247,0.35)]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white tracking-tight">Your Data & Privacy</h3>
                  <p className="text-[11px] text-purple-200/80 font-medium">Download a backup or restore your files anytime</p>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-purple-500/20 bg-[#140e29]/80 space-y-4">
                <p className="text-xs text-purple-200/90 leading-relaxed font-medium">
                  Your tasks, notes, and habits always stay saved locally on your device. You can download an offline backup or restore a previous backup at any time.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    onClick={handleExportJson}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-pink-500/30 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Backup</span>
                  </motion.button>

                  <motion.label 
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.94 }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/[0.08] hover:bg-white/[0.14] text-white border border-purple-500/30 cursor-pointer transition-all shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5 text-purple-300" />
                    <span>Restore from File</span>
                    <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                  </motion.label>
                </div>

                {exportNotice && (
                  <p className="text-xs text-emerald-400 font-bold pt-1 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>{exportNotice}</span>
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

    </div>
  )
}
