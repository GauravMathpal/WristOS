import { useEffect } from 'react'
import { useAppStore } from './stores/useAppStore'
import { seedInitialDataIfEmpty } from './lib/seed'
import { 
  Home, 
  Sparkles, 
  CheckSquare, 
  Activity,
  Brain, 
  Sliders,
  Wifi,
  WifiOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { DashboardScreen } from './components/DashboardScreen'
import { AssistantScreen } from './components/AssistantScreen'
import { TasksScreen } from './components/TasksScreen'
import { HealthScreen } from './components/HealthScreen'
import { MemoryScreen } from './components/MemoryScreen'
import { SettingsScreen } from './components/SettingsScreen'

export function App() {
  const { activeTab, setActiveTab, watch, connectWatch, disconnectWatch } = useAppStore()

  useEffect(() => {
    seedInitialDataIfEmpty()
  }, [])

  const navItems = [
    { id: 'dashboard' as const, label: 'Home', icon: Home, badge: null },
    { id: 'assistant' as const, label: 'AI', icon: Sparkles, badge: 'AI' },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckSquare, badge: null },
    { id: 'health' as const, label: 'Health', icon: Activity, badge: null },
    { id: 'memory' as const, label: 'Vault', icon: Brain, badge: null },
    { id: 'settings' as const, label: 'More', icon: Sliders, badge: null },
  ]

  const isConnected = watch.connectionState === 'connected'

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0714] text-[#f1f5f9] font-sans antialiased selection:bg-purple-500/30 selection:text-pink-300">
      
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
      <motion.div
        animate={{
          x: [0, 25, -25, 0],
          y: [0, 25, -20, 0],
        }}
        transition={{
          repeat: Infinity,
          duration: 15,
          ease: 'easeInOut'
        }}
        className="fixed top-[40%] right-[30%] w-[450px] h-[450px] bg-indigo-600/[0.04] rounded-full blur-[130px] pointer-events-none"
      />

      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/[0.06] bg-[#0d0918]/80 backdrop-blur-2xl p-5 justify-between shrink-0 z-20">
        <div className="space-y-7">
          {/* Brand header */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 via-fuchsia-500 to-pink-500 p-[1px] shadow-lg shadow-purple-500/20">
              <div className="w-full h-full bg-[#0d0918] rounded-[11px] flex items-center justify-center">
                <span className="font-extrabold text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-mono">W</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold tracking-tight text-white">WristOS</h1>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">v2.0</span>
              </div>
              <p className="text-[11px] text-slate-400">Personal Intelligence</p>
            </div>
          </div>

          {/* Nav List with Smooth Sliding Motion Indicator */}
          <nav className="space-y-1 relative">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
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
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-pink-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
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
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
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
            {isConnected ? 'Disconnect' : 'Connect Watch'}
          </motion.button>
        </motion.div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-14 px-6 border-b border-white/[0.06] flex items-center justify-between bg-[#0a0714]/80 backdrop-blur-xl shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-slate-400 capitalize">{activeTab}</span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-bold text-white tracking-tight">WristOS Companion</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-xs text-slate-300">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-500'}`} />
              <span className="text-[11px] font-medium">{isConnected ? 'GATT 0x1805 Connected' : 'Local-First Mode'}</span>
            </div>
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
              {activeTab === 'health' && <HealthScreen />}
              {activeTab === 'memory' && <MemoryScreen />}
              {activeTab === 'settings' && <SettingsScreen />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile App Bottom Navigation Bar with Sliding Indicator */}
        <nav className="md:hidden absolute bottom-0 left-0 right-0 h-16 bg-[#0d0918]/95 backdrop-blur-2xl border-t border-white/[0.06] flex items-center justify-around px-2 z-20">
          {navItems.map((item) => {
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
    </div>
  )
}
