import { useAppStore } from './stores/useAppStore'
import { 
  LayoutDashboard, 
  Sparkles, 
  CheckSquare, 
  BrainCircuit, 
  Settings2,
  Watch,
  Activity,
  Footprints,
  BatteryCharging,
  Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export function App() {
  const { activeTab, setActiveTab, watch, connectWatch, disconnectWatch } = useAppStore()

  const navItems = [
    { id: 'dashboard' as const, label: 'Control', icon: LayoutDashboard },
    { id: 'assistant' as const, label: 'Assistant', icon: Sparkles },
    { id: 'tasks' as const, label: 'Agenda', icon: CheckSquare },
    { id: 'memory' as const, label: 'Vault', icon: BrainCircuit },
    { id: 'settings' as const, label: 'System', icon: Settings2 },
  ]

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 antialiased select-none font-sans">
      {/* Sidebar for Desktop / Large displays */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-800/80 bg-slate-900/40 backdrop-blur-xl p-5 justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Watch className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                WristOS
              </h1>
              <p className="text-[11px] font-semibold tracking-wider text-cyan-400 uppercase">Personal AI Core</p>
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
            <span className="text-xs font-semibold text-slate-300">PineTime Hardware</span>
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
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>V1 Web Scaffold</span>
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
              className="max-w-4xl mx-auto space-y-6"
            >
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  {/* Hero Watch Status Banner */}
                  <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/30 border border-slate-800/80 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold tracking-wider uppercase text-cyan-400">Companion Telemetry</span>
                        </div>
                        <h2 className="text-2xl font-extrabold tracking-tight text-white">{watch.deviceName}</h2>
                        <p className="text-sm text-slate-400 mt-0.5">InfiniTime BLE Smartwatch Link</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={watch.connectionState === 'connected' ? disconnectWatch : connectWatch}
                          className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                            watch.connectionState === 'connected'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                              : 'bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 shadow-lg shadow-cyan-500/20'
                          }`}
                        >
                          {watch.connectionState === 'connected' ? 'Unlink Watch' : 'Connect Watch'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Telemetry Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Step Count</span>
                        <Footprints className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="text-3xl font-extrabold tracking-tight text-white">
                        {watch.stepCount.toLocaleString()}
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-cyan-400 h-1.5 rounded-full" style={{ width: '68%' }} />
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Heart Rate</span>
                        <Activity className="w-4 h-4 text-rose-400" />
                      </div>
                      <div className="text-3xl font-extrabold tracking-tight text-white">
                        {watch.heartRate} <span className="text-sm font-medium text-slate-400">BPM</span>
                      </div>
                      <span className="text-xs text-emerald-400 font-medium">Resting Normal</span>
                    </div>

                    <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-xs font-semibold uppercase tracking-wider">Watch Battery</span>
                        <BatteryCharging className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div className="text-3xl font-extrabold tracking-tight text-white">
                        {watch.batteryLevel}%
                      </div>
                      <span className="text-xs text-slate-400 font-medium">Estimated 3.5 days remaining</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'assistant' && (
                <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">AI Assistant Ready for Scaffold</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    M1 scaffold verified. Gemini conversations, context memory injection, and speech interaction will be hooked up in M5.
                  </p>
                </div>
              )}

              {activeTab === 'tasks' && (
                <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Agenda & Tasks Ready for Scaffold</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Dexie IndexedDB local-first task management will be connected in M3.
                  </p>
                </div>
              )}

              {activeTab === 'memory' && (
                <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                    <BrainCircuit className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Personal Memory Vault Ready</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    Context facts and lightning search will be wired in M3.
                  </p>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center mx-auto">
                    <Settings2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">System Settings</h3>
                  <p className="text-sm text-slate-400 max-w-md mx-auto">
                    BLE sync toggles, haptic alert switches, and Supabase cloud settings.
                  </p>
                </div>
              )}
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
