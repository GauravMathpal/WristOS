import { useEffect } from 'react'
import { useAppStore } from './stores/useAppStore'
import { seedInitialDataIfEmpty } from './lib/seed'
import { 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  Brain, 
  Sliders,
  Watch,
  Wifi,
  WifiOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { DashboardScreen } from './components/DashboardScreen'
import { AssistantScreen } from './components/AssistantScreen'
import { TasksScreen } from './components/TasksScreen'
import { MemoryScreen } from './components/MemoryScreen'
import { SettingsScreen } from './components/SettingsScreen'

export function App() {
  const { activeTab, setActiveTab, watch, connectWatch, disconnectWatch } = useAppStore()

  useEffect(() => {
    seedInitialDataIfEmpty()
  }, [])

  const navItems = [
    { id: 'dashboard' as const, label: 'Telemetry', icon: Activity, badge: null },
    { id: 'assistant' as const, label: 'Intelligence', icon: Sparkles, badge: 'AI' },
    { id: 'tasks' as const, label: 'Agenda', icon: CheckCircle2, badge: null },
    { id: 'memory' as const, label: 'Vault', icon: Brain, badge: null },
    { id: 'settings' as const, label: 'Settings', icon: Sliders, badge: null },
  ]

  const isConnected = watch.connectionState === 'connected'

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#08090d] text-[#e2e8f0] font-sans antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
      
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/[0.03] rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/[0.03] rounded-full blur-[140px] pointer-events-none" />

      {/* Desktop / Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-white/[0.06] bg-[#0c0e14]/70 backdrop-blur-2xl p-5 justify-between shrink-0 z-20">
        <div className="space-y-7">
          {/* Brand header */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 via-cyan-500 to-indigo-600 p-[1px] shadow-lg shadow-cyan-500/15">
              <div className="w-full h-full bg-[#0c0e14] rounded-[11px] flex items-center justify-center">
                <Watch className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-semibold tracking-tight text-white">WristOS</h1>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-400 border border-white/[0.06]">v1.0</span>
              </div>
              <p className="text-[11px] text-slate-400">Personal Intelligence</p>
            </div>
          </div>

          {/* Nav List */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-white/[0.08] text-white font-semibold shadow-sm border border-white/[0.08]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-mono uppercase tracking-wider font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Watch Status Card in Sidebar */}
        <div className="p-3.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-slate-600'}`} />
              <span className="text-xs font-semibold text-slate-200">PineTime BLE</span>
            </div>
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-slate-500" />
            )}
          </div>

          <div className="text-[11px] text-slate-400 flex justify-between">
            <span>Battery: {isConnected ? `${watch.batteryLevel}%` : '--'}</span>
            <span>Heart: {isConnected ? `${watch.heartRate} bpm` : '--'}</span>
          </div>

          <button
            onClick={isConnected ? disconnectWatch : connectWatch}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              isConnected
                ? 'bg-white/[0.06] hover:bg-rose-500/10 text-slate-300 hover:text-rose-400 border border-white/[0.06]'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
            }`}
          >
            {isConnected ? 'Disconnect' : 'Connect Watch'}
          </button>
        </div>
      </aside>

      {/* Main Viewport */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-14 px-6 border-b border-white/[0.06] flex items-center justify-between bg-[#08090d]/60 backdrop-blur-xl shrink-0 z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-slate-400 capitalize">{activeTab}</span>
            <span className="text-slate-600">/</span>
            <span className="text-xs font-semibold text-slate-200">Control Unit</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-white/[0.06] bg-white/[0.02] text-xs text-slate-300">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
              <span className="text-[11px] font-medium">{isConnected ? 'PineTime Connected' : 'Local Offline'}</span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="max-w-4xl mx-auto"
            >
              {activeTab === 'dashboard' && <DashboardScreen />}
              {activeTab === 'assistant' && <AssistantScreen />}
              {activeTab === 'tasks' && <TasksScreen />}
              {activeTab === 'memory' && <MemoryScreen />}
              {activeTab === 'settings' && <SettingsScreen />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile App Bottom Navigation Bar */}
        <nav className="md:hidden absolute bottom-0 left-0 right-0 h-16 bg-[#0c0e14]/90 backdrop-blur-2xl border-t border-white/[0.06] flex items-center justify-around px-2 z-20">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
                  isActive ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span className="text-[10px] font-medium mt-1">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </main>
    </div>
  )
}
