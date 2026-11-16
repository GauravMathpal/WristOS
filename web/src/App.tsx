import { useEffect } from 'react'
import { useAppStore } from './stores/useAppStore'
import { seedInitialDataIfEmpty } from './lib/seed'
import { 
  LayoutDashboard, 
  Sparkles, 
  CheckSquare, 
  BrainCircuit, 
  Settings2,
  Watch,
  Zap
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
    { id: 'dashboard' as const, label: 'Control', icon: LayoutDashboard },
    { id: 'assistant' as const, label: 'Assistant', icon: Sparkles },
    { id: 'tasks' as const, label: 'Agenda', icon: CheckSquare },
    { id: 'memory' as const, label: 'Vault', icon: BrainCircuit },
    { id: 'settings' as const, label: 'System', icon: Settings2 },
  ]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased select-none font-sans">
      {/* Sidebar for Desktop / Tablet */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/80 bg-slate-900/40 backdrop-blur-xl p-5 justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Watch className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                WristOS
              </h1>
              <p className="text-[11px] font-semibold tracking-wider text-cyan-400 uppercase">Personal Intelligence</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Watch Status Pill in Desktop Sidebar */}
        <div className="p-3.5 rounded-2xl border border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">PineTime Watch</span>
            <span className={`inline-block w-2 h-2 rounded-full ${watch.connectionState === 'connected' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-500'}`} />
          </div>
          <p className="text-[11px] text-slate-400 capitalize mb-3">Status: {watch.connectionState}</p>
          <button
            onClick={watch.connectionState === 'connected' ? disconnectWatch : connectWatch}
            className="w-full py-1.5 px-3 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            {watch.connectionState === 'connected' ? 'Disconnect' : 'Connect BLE'}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 px-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/60 backdrop-blur-xl shrink-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/40">
              {activeTab}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Dexie Local-First Online</span>
            </div>
          </div>
        </header>

        {/* Scrollable Screen Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
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

        {/* Mobile Bottom Navigation Bar */}
        <nav className="md:hidden absolute bottom-0 left-0 right-0 h-16 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 flex items-center justify-around px-2 z-20">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
                  isActive ? 'text-cyan-400' : 'text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span className="text-[10px] font-medium tracking-tight mt-1">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </main>
    </div>
  )
}
