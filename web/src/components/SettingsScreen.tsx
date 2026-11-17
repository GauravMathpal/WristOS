import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { 
  Palette, 
  Sun, 
  Moon, 
  Laptop, 
  Check, 
  Cloud, 
  Database, 
  Watch, 
  Download, 
  Upload, 
  User, 
  LogOut, 
  Mail, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  WifiOff, 
  RotateCcw
} from 'lucide-react'
import { db } from '../lib/db'
import { useAuthStore } from '../stores/useAuthStore'
import { syncService, SyncState } from '../lib/syncService'
import { isSupabaseConfigured } from '../lib/supabase'
import { useThemeStore, PRESET_THEMES } from '../stores/useThemeStore'

export function SettingsScreen() {
  const [activeTab, setActiveTab] = useState<'appearance' | 'cloud' | 'data' | 'hardware'>('appearance')
  
  // Theme Store
  const { currentPreset, mode, customColors, setPreset, setMode, setCustomColors, resetToDefault } = useThemeStore()
  const [showCustomPicker, setShowCustomPicker] = useState(currentPreset === 'custom')
  const [customPrimary, setCustomPrimary] = useState(customColors.primary)
  const [customSecondary, setCustomSecondary] = useState(customColors.secondary)

  // Hardware toggles
  const [autoSync, setAutoSync] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [wristVibrate, setWristVibrate] = useState(true)
  const [exportNotice, setExportNotice] = useState<string | null>(null)

  // Auth & Sync state
  const { user, signInWithOtp, signOut } = useAuthStore()
  const [emailInput, setEmailInput] = useState('')
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)
  const [syncStatus, setSyncStatus] = useState<SyncState>('idle')
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState<number>(0)

  useEffect(() => {
    const unsubscribe = syncService.subscribe((state, lastSync) => {
      setSyncStatus(state)
      if (lastSync) setLastSyncTimestamp(lastSync)
    })
    return () => {
      unsubscribe()
    }
  }, [])

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
      setAuthMessage('Magic sign-in link sent! Check your email inbox.')
      setEmailInput('')
    }
  }

  // JSON Export / Import
  const handleExportJson = async () => {
    const tasks = await db.tasks.toArray()
    const memories = await db.memories.toArray()
    const exportData = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      tasks,
      memories
    }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `wristos_backup_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportNotice('Database exported successfully as JSON.')
    setTimeout(() => setExportNotice(null), 3000)
  }

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string)
        if (data.tasks) {
          await db.tasks.bulkPut(data.tasks)
        }
        if (data.memories) {
          await db.memories.bulkPut(data.memories)
        }
        setExportNotice(`Imported ${data.tasks?.length || 0} tasks & ${data.memories?.length || 0} memories!`)
        syncService.triggerSync()
        setTimeout(() => setExportNotice(null), 4000)
      } catch {
        alert("Invalid WristOS backup JSON file.")
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
      border: `color-mix(in srgb, ${customPrimary} 25%, transparent)`
    })
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header & Section Selector Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-semibold">PREFERENCES & SYSTEM</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Settings & Customization</h2>
          <p className="text-xs text-slate-400">
            Personalize themes, manage cloud synchronization, and configure BLE telemetry
          </p>
        </div>

        {/* Section Pills with Sliding Indicator */}
        <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-x-auto">
          {[
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'cloud', label: 'Cloud Sync', icon: Cloud },
            { id: 'data', label: 'Data & Backup', icon: Database },
            { id: 'hardware', label: 'Hardware', icon: Watch },
          ].map((item) => {
            const isSelected = activeTab === item.id
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors shrink-0 flex items-center gap-1.5 ${
                  isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="settingsSubTabPill"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 shadow-md shadow-purple-600/30"
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
        
        {/* APPEARANCE SECTION (Matching Mockup Screen 4) */}
        {activeTab === 'appearance' && (
          <motion.div
            key="appearance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="space-y-6"
          >
            {/* "Make it yours" Hero Card (From Mockup Screen 4) */}
            <div className="relative overflow-hidden p-7 rounded-3xl border border-purple-500/25 bg-gradient-to-b from-purple-900/20 via-pink-900/10 to-transparent backdrop-blur-2xl shadow-xl space-y-4">
              <div className="max-w-md space-y-1 z-10 relative">
                <h3 className="text-xl font-bold text-white tracking-tight">Make it yours</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Customize the look and feel of WristOS the way you like. Choose from 6 curated color schemes or craft your personal custom gradient.
                </p>
              </div>

              {/* Glowing Luminous Ribbon Wave (From Mockup Image) */}
              <div className="relative h-16 w-full overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 400 60" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="heroRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="50%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                  <motion.path
                    d="M 0 30 Q 100 5 200 30 T 400 30"
                    fill="none"
                    stroke="url(#heroRibbonGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    animate={{
                      d: [
                        "M 0 30 Q 100 5 200 30 T 400 30",
                        "M 0 30 Q 100 55 200 30 T 400 30",
                        "M 0 30 Q 100 5 200 30 T 400 30"
                      ]
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 4,
                      ease: 'easeInOut'
                    }}
                  />
                </svg>
              </div>
            </div>

            {/* Theme Mode Selector: Light, Dark, System (From Mockup Screen 4) */}
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Theme Mode
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
                          ? 'bg-gradient-to-b from-purple-500/20 to-pink-500/10 border-purple-500/40 text-white shadow-lg shadow-purple-500/15'
                          : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:border-white/[0.12]'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-pink-400' : 'text-slate-400'}`} />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </motion.button>
                  )
                })}
              </div>
            </div>

            {/* App Theme Predefined Grid (From Mockup Screen 4) */}
            <div className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    App Theme
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Select a signature palette</p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={resetToDefault}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </motion.button>
              </div>

              {/* 6 Theme Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {(Object.keys(PRESET_THEMES) as (keyof typeof PRESET_THEMES)[]).map((themeKey) => {
                  const theme = PRESET_THEMES[themeKey]
                  const isSelected = currentPreset === themeKey

                  return (
                    <motion.div
                      key={theme.id}
                      whileHover={{ y: -3, scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setPreset(theme.id)}
                      className={`relative p-4 rounded-2xl border cursor-pointer flex flex-col justify-between space-y-3 transition-all overflow-hidden ${
                        isSelected
                          ? 'border-purple-400/60 bg-gradient-to-b from-purple-500/20 to-pink-500/10 shadow-xl shadow-purple-500/20'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.15]'
                      }`}
                    >
                      {/* Active Checkmark Badge */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}

                      {/* Animated Theme Wave Preview */}
                      <div className="relative h-12 w-full rounded-xl overflow-hidden p-1 flex items-center justify-center" style={{ background: theme.dark.bgPrimary }}>
                        <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id={`grad-${theme.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor={theme.previewColors[0]} />
                              <stop offset="50%" stopColor={theme.previewColors[1]} />
                              <stop offset="100%" stopColor={theme.previewColors[2]} />
                            </linearGradient>
                          </defs>
                          <path
                            d="M 0 15 Q 25 5 50 15 T 100 15"
                            fill="none"
                            stroke={`url(#grad-${theme.id})`}
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>

                      {/* Theme Name & Description */}
                      <div>
                        <h5 className="text-xs font-bold text-white">{theme.name}</h5>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{theme.description}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* Custom Theme Accordion & Color Picker */}
              <div className="pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowCustomPicker(!showCustomPicker)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] text-left transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 p-[1.5px]">
                      <div className="w-full h-full rounded-[10px] bg-[#0c0916] flex items-center justify-center text-pink-400">
                        <Palette className="w-4 h-4" />
                      </div>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">Custom Theme Creator</h5>
                      <p className="text-[10px] text-slate-400">Create your own theme with custom colors and gradients</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-purple-400">{showCustomPicker ? '▲' : '▼'}</span>
                </motion.button>

                <AnimatePresence>
                  {showCustomPicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-5 mt-2 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-300">Primary Accent</label>
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
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-300">Secondary Accent</label>
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
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Custom Gradient Preview Bar */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-300">Live Custom Gradient</span>
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
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-950 hover:bg-slate-200 transition-all shadow-md"
                        >
                          Apply Custom Theme
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}

        {/* CLOUD SYNC SECTION */}
        {activeTab === 'cloud' && (
          <motion.div
            key="cloud"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">Supabase Cloud Sync</h3>
                  <p className="text-[11px] text-slate-400">Continuous background sync with row-level security</p>
                </div>
              </div>

              {/* Sync status pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.04] border border-white/[0.08] self-start sm:self-auto">
                {syncStatus === 'syncing' && (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    <span className="text-cyan-400">Syncing...</span>
                  </>
                )}
                {syncStatus === 'synced' && (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Cloud Synced</span>
                  </>
                )}
                {syncStatus === 'offline' && (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-400">Offline (Local Dexie)</span>
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
                    <span className="w-2 h-2 rounded-full bg-slate-500" />
                    <span className="text-slate-400">{user ? 'Idle' : 'Local Only'}</span>
                  </>
                )}
              </div>
            </div>

            {/* Auth Form / Account Status */}
            {!isSupabaseConfigured ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                <p className="font-semibold">Supabase Credentials Not Yet Configured</p>
                <p className="text-slate-400">
                  Your app is running in 100% offline Local-First mode with Dexie.js. To enable multi-device cloud backup, add <code className="text-amber-200">VITE_SUPABASE_URL</code> and <code className="text-amber-200">VITE_SUPABASE_ANON_KEY</code> to <code className="text-amber-200">web/.env</code>.
                </p>
              </div>
            ) : user ? (
              <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.1] text-white flex items-center justify-center font-bold text-xs">
                    {user.email ? user.email.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{user.email}</p>
                    <p className="text-[11px] text-slate-500">
                      {lastSyncTimestamp ? `Last synced: ${new Date(lastSyncTimestamp).toLocaleTimeString()}` : 'Connected to Supabase'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => syncService.triggerSync()}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sync Now</span>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={() => signOut()}
                    className="px-3.5 py-2 rounded-xl text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 transition-all"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </motion.button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleLogin} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-3">
                <div>
                  <p className="text-xs font-semibold text-slate-200">Sign in with Email (Magic Link)</p>
                  <p className="text-[11px] text-slate-400">Sync tasks and memories seamlessly between your phone and browser.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileTap={{ scale: 0.94 }}
                    disabled={isSubmittingAuth || !emailInput.trim()}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-950 hover:bg-slate-200 disabled:opacity-40 transition-all shrink-0"
                  >
                    {isSubmittingAuth ? 'Sending...' : 'Send Magic Link'}
                  </motion.button>
                </div>

                {authMessage && (
                  <p className="text-xs text-purple-400 font-medium">{authMessage}</p>
                )}
              </form>
            )}
          </motion.div>
        )}

        {/* DATA BACKUP & PRESERVATION SECTION */}
        {activeTab === 'data' && (
          <motion.div
            key="data"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Local Database & Preservation</h3>
                <p className="text-[11px] text-slate-400">Export offline Dexie data or import legacy Room backups</p>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                WristOS guarantees non-destructive local persistence. You can download a complete JSON snapshot of all tasks, priority rankings, and knowledge vault facts at any time.
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Export JSON Backup</span>
                </motion.button>

                <motion.label 
                  whileTap={{ scale: 0.94 }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] cursor-pointer transition-all"
                >
                  <Upload className="w-3.5 h-3.5 text-slate-400" />
                  <span>Import JSON Data</span>
                  <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                </motion.label>
              </div>

              {exportNotice && (
                <p className="text-xs text-emerald-400 font-medium pt-1 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  <span>{exportNotice}</span>
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* HARDWARE PREFERENCES SECTION */}
        {activeTab === 'hardware' && (
          <motion.div
            key="hardware"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="p-6 rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl space-y-4"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Watch className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">InfiniTime PineTime BLE Companion</h3>
                <p className="text-[11px] text-slate-400">GATT profile streaming and wrist haptics</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div>
                  <p className="text-xs font-semibold text-white">Auto-Sync Telemetry</p>
                  <p className="text-[11px] text-slate-400">Stream steps and heart rate continuously via BLE CTS & HRS</p>
                </div>
                <button
                  onClick={() => setAutoSync(!autoSync)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors ${autoSync ? 'bg-purple-500' : 'bg-white/[0.1]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${autoSync ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div>
                  <p className="text-xs font-semibold text-white">Forward Phone Notifications</p>
                  <p className="text-[11px] text-slate-400">Push reminder alerts to watch via GATT Alert Notification Service (ANS 0x1811)</p>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors ${notifications ? 'bg-purple-500' : 'bg-white/[0.1]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div>
                  <p className="text-xs font-semibold text-white">Wrist Haptic Vibration</p>
                  <p className="text-[11px] text-slate-400">Vibrate PineTime on scheduled alarms and AI priority alerts</p>
                </div>
                <button
                  onClick={() => setWristVibrate(!wristVibrate)}
                  className={`w-11 h-6 rounded-full p-0.5 transition-colors ${wristVibrate ? 'bg-purple-500' : 'bg-white/[0.1]'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${wristVibrate ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Diagnostics / System Information */}
      <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">System Diagnostics</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-white/[0.05] bg-white/[0.01] space-y-1">
            <span className="text-slate-500 text-[11px]">Local Database Layer</span>
            <p className="font-mono text-slate-200">Dexie.js v4 (IndexedDB)</p>
          </div>

          <div className="p-3 rounded-xl border border-white/[0.05] bg-white/[0.01] space-y-1">
            <span className="text-slate-500 text-[11px]">Cloud Endpoint</span>
            <p className="font-mono text-slate-200 truncate">clmnmyeaxumulyzraagp.supabase.co</p>
          </div>

          <div className="p-3 rounded-xl border border-white/[0.05] bg-white/[0.01] space-y-1">
            <span className="text-slate-500 text-[11px]">Hardware BLE Driver</span>
            <p className="font-mono text-slate-200">Web Bluetooth / Nordic CTS</p>
          </div>

          <div className="p-3 rounded-xl border border-white/[0.05] bg-white/[0.01] space-y-1">
            <span className="text-slate-500 text-[11px]">Native Target</span>
            <p className="font-mono text-slate-200">Capacitor 7 (com.wristos.app)</p>
          </div>
        </div>
      </div>

    </div>
  )
}
