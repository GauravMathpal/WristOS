import { useState, useEffect } from 'react'
import { useAppStore } from './stores/useAppStore'
import { useThemeStore } from './stores/useThemeStore'
import { seedInitialDataIfEmpty } from './lib/seed'
import { 
  Home, 
  Sparkles, 
  CheckSquare, 
  Timer, 
  Activity, 
  Brain, 
  Watch, 
  Sliders, 
  Search, 
  Bell, 
  Sun, 
  Moon, 
  PanelLeftClose, 
  PanelLeft, 
  Wifi, 
  WifiOff,
  Heart,
  MoreHorizontal,
  Globe,
  User
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { DashboardScreen } from './components/DashboardScreen'
import { AssistantScreen } from './components/AssistantScreen'
import { TasksScreen } from './components/TasksScreen'
import { FocusScreen } from './components/FocusScreen'
import { HealthScreen } from './components/HealthScreen'
import { MemoryScreen } from './components/MemoryScreen'
import { DevicesScreen } from './components/DevicesScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { ProfileScreen } from './components/ProfileScreen'
import { CommandPalette } from './components/CommandPalette'
import { LandingPage } from './components/LandingPage'
import { LoginScreen } from './components/LoginScreen'

export function App() {
  const { viewMode, setViewMode, activeTab, setActiveTab, watch, connectWatch, disconnectWatch, currentUser } = useAppStore()
  const { mode, setMode } = useThemeStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    seedInitialDataIfEmpty()
  }, [])

  // Auto-switch to Assistant tab when watch triggers AI remotely over BLE or simulator
  useEffect(() => {
    const handleRemoteTrigger = () => {
      setViewMode('app')
      setActiveTab('assistant')
    }
    window.addEventListener('wristos-ai-trigger', handleRemoteTrigger)
    return () => window.removeEventListener('wristos-ai-trigger', handleRemoteTrigger)
  }, [setActiveTab, setViewMode])

  // View routing between Landing Page, Login/Pairing Screen, and Companion Application
  if (viewMode === 'landing') {
    return <LandingPage />
  }

  if (viewMode === 'login') {
    return <LoginScreen />
  }

  // Desktop navigation items (all application sections)
  const navItems = [
    { id: 'dashboard' as const, label: 'Home', icon: Home, badge: null },
    { id: 'profile' as const, label: 'My Profile', icon: User, badge: null },
    { id: 'assistant' as const, label: 'AI Assistant', icon: Sparkles, badge: 'AI' },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare, badge: null },
    { id: 'focus' as const, label: 'Focus', icon: Timer, badge: null },
    { id: 'health' as const, label: 'Health', icon: Activity, badge: null },
    { id: 'memory' as const, label: 'Memory', icon: Brain, badge: null },
    { id: 'devices' as const, label: 'Devices', icon: Watch, badge: null },
    { id: 'settings' as const, label: 'Settings', icon: Sliders, badge: null },
  ]

  // Mobile bottom navigation items (5 primary tabs matching mockup)
  const mobileNavItems = [
    { id: 'dashboard' as const, label: 'Home', icon: Home },
    { id: 'assistant' as const, label: 'AI', icon: Sparkles },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
    { id: 'health' as const, label: 'Health', icon: Heart },
    { id: 'settings' as const, label: 'More', icon: MoreHorizontal },
  ]

  const isConnected = watch.connectionState === 'connected'
  const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary,#06040d)] text-[var(--text-primary,#f8fafc)] font-sans antialiased selection:bg-purple-500/40 selection:text-pink-300 relative">
      
      {/* VIBRANT ATMOSPHERIC AMBIENT NEBULA GLOWS (Ultra-efficient radial shader, zero GPU memory churn) */}
      <div 
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
        style={{
          transform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          contain: 'strict'
        }}
      >
        <div 
          className="absolute top-[-15%] left-[5%] w-[650px] h-[650px] rounded-full pointer-events-none opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.35) 0%, rgba(79, 70, 229, 0.15) 50%, transparent 70%)',
            transform: 'translate3d(0, 0, 0)'
          }}
        />
        <div 
          className="absolute bottom-[-15%] right-[5%] w-[700px] h-[700px] rounded-full pointer-events-none opacity-60"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.35) 0%, rgba(219, 39, 119, 0.15) 50%, transparent 70%)',
            transform: 'translate3d(0, 0, 0)'
          }}
        />
        <div 
          className="absolute top-[25%] right-[25%] w-[550px] h-[550px] rounded-full pointer-events-none opacity-50"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.35) 0%, rgba(124, 58, 237, 0.12) 50%, transparent 70%)',
            transform: 'translate3d(0, 0, 0)'
          }}
        />
        <div 
          className="absolute bottom-[18%] left-[15%] w-[480px] h-[480px] rounded-full pointer-events-none opacity-45"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.25) 0%, rgba(56, 189, 248, 0.1) 50%, transparent 70%)',
            transform: 'translate3d(0, 0, 0)'
          }}
        />
      </div>

      {/* Floating Starlight Particle Sparkles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[15%] left-[25%] w-1.5 h-1.5 rounded-full bg-purple-300/60 blur-[1px] floating-star" />
        <div className="absolute top-[45%] left-[12%] w-1 h-1 rounded-full bg-pink-400/70 blur-[1px] floating-star" style={{ animationDelay: '2s' }} />
        <div className="absolute top-[25%] right-[20%] w-2 h-2 rounded-full bg-cyan-300/50 blur-[1px] floating-star" style={{ animationDelay: '4s' }} />
        <div className="absolute bottom-[35%] right-[15%] w-1.5 h-1.5 rounded-full bg-fuchsia-300/60 blur-[1px] floating-star" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-[20%] left-[40%] w-1 h-1 rounded-full bg-indigo-300/60 blur-[1px] floating-star" style={{ animationDelay: '5s' }} />
      </div>

      {/* Desktop / Tablet Sidebar (Collapsible) */}
      <aside 
        className={`hidden md:flex flex-col border-r border-purple-500/20 bg-[#090615]/85 backdrop-blur-2xl p-4 justify-between shrink-0 z-20 transition-all duration-300 shadow-[4px_0_30px_rgba(0,0,0,0.5)] ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="space-y-6">
          
          {/* Brand header & Collapse Toggle */}
          <div className="flex items-center justify-between px-1">
            <div 
              onClick={() => setViewMode('landing')}
              className="flex items-center gap-3 cursor-pointer group"
              title="Return to WristOS Portal Homepage"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-pink-500 p-[1.5px] shadow-lg shadow-purple-500/30 group-hover:scale-105 transition-transform shrink-0">
                <div className="w-full h-full bg-[#0d0918] rounded-[14px] flex items-center justify-center">
                  <span className="font-extrabold text-base text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono">W</span>
                </div>
              </div>

              {!sidebarCollapsed && (
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm font-extrabold tracking-tight text-white group-hover:text-purple-300 transition-colors">WristOS</h1>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.3)]">v2.0</span>
                  </div>
                  <p className="text-[10px] text-purple-300/80 truncate font-medium">Personal Intelligence</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav List with Sliding Indicator */}
          <nav className="space-y-1.5 relative">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`relative w-full flex items-center ${
                    sidebarCollapsed ? 'justify-center px-2 py-3' : 'justify-between px-3.5 py-2.5'
                  } rounded-xl text-xs font-semibold transition-all ${
                    isActive ? 'text-white' : 'text-slate-300 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {/* Sliding Pill Indicator with Glowing Aura */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/40 via-fuchsia-600/30 to-pink-600/25 border border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors shrink-0 ${isActive ? 'text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' : 'text-purple-300/70'}`} />
                    {!sidebarCollapsed && <span className={isActive ? 'font-bold' : ''}>{item.label}</span>}
                  </div>

                  {!sidebarCollapsed && item.badge && (
                    <span className="relative z-10 text-[9px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-200 border border-purple-400/40 shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Watch Status Card in Sidebar */}
        {!sidebarCollapsed ? (
          <motion.div 
            whileHover={{ y: -2 }}
            transition={{ duration: 0.15 }}
            className="p-4 rounded-2xl border border-purple-500/25 bg-gradient-to-b from-[#1b1236]/80 via-[#130d29]/75 to-[#0b081d]/90 backdrop-blur-xl space-y-3 shadow-lg shadow-purple-900/20"
          >
            <div className="flex items-center justify-between">
              <div 
                onClick={() => setActiveTab('devices')}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-slate-600'}`} />
                <span className="text-xs font-bold text-white tracking-tight">{watch.deviceName || 'WatchOS'}</span>
              </div>
              {isConnected ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-slate-500" />
              )}
            </div>

            <div className="text-[11px] text-slate-300 flex justify-between font-mono">
              <span className="text-emerald-400">BAT: {watch.batteryLevel > 0 ? `${watch.batteryLevel}%` : '94%'}</span>
              <span className="text-pink-400">HRS: {watch.heartRate > 0 ? `${watch.heartRate} bpm` : '78 bpm'}</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              onClick={isConnected ? disconnectWatch : connectWatch}
              className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all shadow-md ${
                isConnected
                  ? 'bg-purple-900/30 hover:bg-rose-500/15 text-slate-200 hover:text-rose-400 border border-purple-500/30'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/30 hover:brightness-110'
              }`}
            >
              {isConnected ? 'Manage Watch' : 'Connect Watch'}
            </motion.button>
          </motion.div>
        ) : (
          <div className="flex justify-center">
            <button 
              onClick={() => setActiveTab('devices')}
              className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20"
              title="Watch status"
            >
              <Watch className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-purple-500/15 bg-[#06040d]/70 backdrop-blur-2xl flex items-center justify-between px-4 sm:px-6 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            {/* Search shortcut button (Raycast / Linear style) */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-[#140e29]/70 hover:bg-[#1a1236] border border-purple-500/20 text-xs text-slate-300 transition-all shadow-inner"
            >
              <Search className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">Search or command...</span>
              <kbd className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-200 border border-purple-500/30">⌘K</kbd>
            </motion.button>

            {/* Smartwatch connection pill in header */}
            <div 
              onClick={() => setActiveTab('devices')}
              className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#140e29]/70 border border-purple-500/20 text-xs font-medium cursor-pointer hover:border-purple-500/40 transition-all"
            >
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-600'}`} />
              <span className="text-[11px] text-slate-200">
                {isConnected ? 'Watch Connected' : 'Watch Standby'}
              </span>
              <span className="text-[10px] text-purple-300 font-mono">
                {watch.batteryLevel > 0 ? `${watch.batteryLevel}%` : '94%'}
              </span>
            </div>

            {/* Return to Landing Portal Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('landing')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#140e29]/70 hover:bg-purple-900/30 border border-purple-500/20 text-xs font-semibold text-purple-300 hover:text-white transition-all shadow-inner"
              title="Return to WristOS Portal Homepage"
            >
              <Globe className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden sm:inline">Portal</span>
            </motion.button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Mode Toggle (Sun / Moon) */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setMode(isDark ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-[#140e29]/70 hover:bg-[#1a1236] border border-purple-500/20 text-slate-300 hover:text-white transition-all shadow-inner"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
            </motion.button>

            {/* Notifications Button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setActiveTab('settings')}
              className="p-2 rounded-xl bg-[#140e29]/70 hover:bg-[#1a1236] border border-purple-500/20 text-slate-300 hover:text-white transition-all relative shadow-inner"
              title="Settings & Sync"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899]" />
            </motion.button>

            {/* Profile Avatar / User Chip */}
            <div 
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 px-2 py-1 rounded-2xl hover:bg-white/[0.05] border border-transparent hover:border-purple-500/20 cursor-pointer transition-all group"
              title={`View ${currentUser.name}'s Profile`}
            >
              <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${currentUser.avatarColor} p-[1.5px] shadow-md shadow-purple-500/30 group-hover:scale-105 transition-transform`}>
                <div className="w-full h-full rounded-full bg-[#0a0715] flex items-center justify-center font-bold text-xs text-white">
                  {currentUser.name.charAt(0)}
                </div>
              </div>
              <div className="hidden lg:block text-left pr-1">
                <p className="text-xs font-bold text-white leading-tight group-hover:text-pink-200 transition-colors">
                  {currentUser.name.split(' ')[0]}
                </p>
                <p className="text-[10px] text-purple-300/70 font-mono leading-none">
                  {currentUser.role.split(' ')[0]}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Screen Content Container with Smooth Fade Transitions */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              >
                {activeTab === 'dashboard' && <DashboardScreen />}
                {activeTab === 'profile' && <ProfileScreen />}
                {activeTab === 'assistant' && <AssistantScreen />}
                {activeTab === 'tasks' && <TasksScreen />}
                {activeTab === 'focus' && <FocusScreen />}
                {activeTab === 'health' && <HealthScreen />}
                {activeTab === 'memory' && <MemoryScreen />}
                {activeTab === 'devices' && <DevicesScreen />}
                {activeTab === 'settings' && <SettingsScreen />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar (Matching Mockup Screen 1) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-purple-500/20 bg-[#090615]/95 backdrop-blur-2xl px-3 flex items-center justify-around z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.7)]">
          {mobileNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="absolute -top-1 w-8 h-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_8px_#ec4899]"
                  />
                )}
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'text-pink-400 scale-110 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' : ''}`} />
                <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold text-white' : 'font-medium'}`}>{item.label}</span>
              </button>
            )
          })}
        </nav>

      </div>

      {/* Global Command Palette (⌘K) */}
      <CommandPalette 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />

    </div>
  )
}
