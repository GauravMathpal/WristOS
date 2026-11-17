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
  WifiOff
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
import { CommandPalette } from './components/CommandPalette'

export function App() {
  const { activeTab, setActiveTab, watch, connectWatch, disconnectWatch, sendWatchAlert } = useAppStore()
  const { mode, setMode } = useThemeStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    seedInitialDataIfEmpty()
  }, [])

  // Desktop navigation items (all 8 application sections)
  const navItems = [
    { id: 'dashboard' as const, label: 'Home', icon: Home, badge: null },
    { id: 'assistant' as const, label: 'AI Assistant', icon: Sparkles, badge: 'AI' },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare, badge: null },
    { id: 'focus' as const, label: 'Focus', icon: Timer, badge: null },
    { id: 'health' as const, label: 'Health', icon: Activity, badge: null },
    { id: 'memory' as const, label: 'Memory', icon: Brain, badge: null },
    { id: 'devices' as const, label: 'Devices', icon: Watch, badge: null },
    { id: 'settings' as const, label: 'Settings', icon: Sliders, badge: null },
  ]

  // Mobile bottom navigation items (5 primary tabs)
  const mobileNavItems = [
    { id: 'dashboard' as const, label: 'Home', icon: Home },
    { id: 'assistant' as const, label: 'AI', icon: Sparkles },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare },
    { id: 'focus' as const, label: 'Focus', icon: Timer },
    { id: 'health' as const, label: 'Health', icon: Activity },
    { id: 'settings' as const, label: 'More', icon: Sliders },
  ]

  const isConnected = watch.connectionState === 'connected'
  const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[var(--bg-primary,#080812)] text-[var(--text-primary,#f8fafc)] font-sans antialiased selection:bg-purple-500/30 selection:text-pink-300">
      
      {/* Background ambient subtle floating gradient movement */}
      <motion.div
        animate={{
          x: [0, 45, -35, 0],
          y: [0, -35, 30, 0],
          scale: [1, 1.12, 0.95, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 18,
          ease: 'easeInOut'
        }}
        className="fixed top-[-10%] left-[15%] w-[600px] h-[600px] bg-purple-600/[0.08] rounded-full blur-[140px] pointer-events-none"
      />
      <motion.div
        animate={{
          x: [0, -40, 30, 0],
          y: [0, 35, -25, 0],
          scale: [1, 0.92, 1.1, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 22,
          ease: 'easeInOut'
        }}
        className="fixed bottom-[-10%] right-[10%] w-[650px] h-[650px] bg-pink-600/[0.07] rounded-full blur-[160px] pointer-events-none"
      />

      {/* Desktop / Tablet Sidebar (Collapsible) */}
      <aside 
        className={`hidden md:flex flex-col border-r border-white/[0.06] bg-[var(--bg-secondary,#11111f)]/80 backdrop-blur-2xl p-4 justify-between shrink-0 z-20 transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="space-y-6">
          
          {/* Brand header & Collapse Toggle */}
          <div className="flex items-center justify-between px-1">
            <div 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-pink-500 p-[1.5px] shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform shrink-0">
                <div className="w-full h-full bg-[#0d0918] rounded-[10px] flex items-center justify-center">
                  <span className="font-extrabold text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono">W</span>
                </div>
              </div>

              {!sidebarCollapsed && (
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm font-bold tracking-tight text-white">WristOS</h1>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">v2.0</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">Personal Intelligence</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          </div>

          {/* Nav List with Sliding Indicator */}
          <nav className="space-y-1 relative">
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
                  } rounded-xl text-xs font-semibold transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Sliding Pill Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600/25 to-pink-600/20 border border-purple-500/30 shadow-sm"
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors shrink-0 ${isActive ? 'text-pink-400' : 'text-slate-400'}`} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </div>

                  {!sidebarCollapsed && item.badge && (
                    <span className="relative z-10 text-[9px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
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
            className="p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md space-y-3"
          >
            <div className="flex items-center justify-between">
              <div 
                onClick={() => setActiveTab('devices')}
                className="flex items-center gap-2 cursor-pointer"
              >
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-600'}`} />
                <span className="text-xs font-bold text-slate-200">PineTime BLE</span>
              </div>
              {isConnected ? (
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-slate-500" />
              )}
            </div>

            <div className="text-[11px] text-slate-400 flex justify-between font-mono">
              <span>BAT: {isConnected ? `${watch.batteryLevel}%` : '87%'}</span>
              <span>HRS: {isConnected ? `${watch.heartRate} bpm` : '78 bpm'}</span>
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 450, damping: 20 }}
              onClick={isConnected ? disconnectWatch : connectWatch}
              className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                isConnected
                  ? 'bg-white/[0.06] hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 border border-white/[0.06]'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/20'
              }`}
            >
              {isConnected ? 'Manage Watch' : 'Connect Watch'}
            </motion.button>
          </motion.div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => setActiveTab('devices')}
              className="p-2.5 rounded-xl bg-white/[0.04] text-purple-400 hover:bg-white/[0.08]"
              title="PineTime Devices"
            >
              <Watch className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header with Global Search, Notifications & Profile */}
        <header className="h-14 px-6 border-b border-white/[0.06] flex items-center justify-between bg-[var(--bg-primary,#080812)]/85 backdrop-blur-xl shrink-0 z-10">
          
          {/* Left Breadcrumb */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-400 capitalize">{activeTab}</span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-bold text-white tracking-tight">WristOS Companion</span>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            
            {/* Global Search Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-xs text-slate-400 hover:text-white transition-all shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-purple-400" />
              <span>Search everything...</span>
              <kbd className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400 border border-white/[0.08]">⌘K</kbd>
            </motion.button>

            {/* Mobile search icon */}
            <button
              onClick={() => setSearchOpen(true)}
              className="sm:hidden p-2 rounded-xl text-slate-400 hover:text-white"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setMode(isDark ? 'light' : 'dark')}
              className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-slate-400 hover:text-white border border-white/[0.06] transition-all"
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-purple-400" />}
            </motion.button>

            {/* Notification Bell / Haptic Alert Trigger */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => sendWatchAlert("WristOS Focus Session Ping")}
              className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] text-slate-400 hover:text-white border border-white/[0.06] transition-all relative"
              title="Test watch notification"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-pink-500 shadow-[0_0_6px_#ec4899]" />
            </motion.button>

            {/* User Profile Avatar */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('settings')}
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[1.5px] cursor-pointer shadow-md shadow-purple-500/20"
              title="Settings & Account"
            >
              <div className="w-full h-full rounded-full bg-[#0e0a1a] flex items-center justify-center font-bold text-xs text-white">
                G
              </div>
            </motion.div>
          </div>
        </header>

        {/* Content Container with Smooth Page Transitions */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -10, filter: 'blur(3px)' }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-4xl mx-auto"
            >
              {activeTab === 'dashboard' && <DashboardScreen />}
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

        {/* Floating AI Assistant Trigger Pill (bottom right when not in assistant) */}
        {activeTab !== 'assistant' && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setActiveTab('assistant')}
            className="hidden sm:flex fixed bottom-6 right-6 items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white shadow-xl shadow-purple-600/30 border border-white/20 z-30 font-semibold text-xs"
          >
            <Sparkles className="w-4 h-4 fill-current text-white" />
            <span>Ask WristOS</span>
          </motion.button>
        )}

        {/* Mobile App Bottom Navigation Bar with Sliding Indicator */}
        <nav className="md:hidden absolute bottom-0 left-0 right-0 h-16 bg-[#0d0918]/95 backdrop-blur-2xl border-t border-white/[0.06] flex items-center justify-around px-2 z-20">
          {mobileNavItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
                  isActive ? 'text-pink-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {/* Active Top Bar Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute top-0 w-8 h-[2px] rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_8px_#ec4899]"
                  />
                )}
                
                <Icon className={`w-4 h-4 ${isActive ? 'text-pink-400' : 'text-slate-500'}`} />
                <span className="text-[10px] font-semibold mt-1">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </main>

      {/* Global Command Palette Modal */}
      <CommandPalette 
        isOpen={searchOpen} 
        onClose={() => setSearchOpen(false)} 
      />

    </div>
  )
}
