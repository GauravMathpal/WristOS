import { useAppStore } from '../stores/useAppStore'
import { db } from '../lib/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Watch, 
  Footprints, 
  Activity, 
  BatteryCharging, 
  Vibrate, 
  Sparkles, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  Layers
} from 'lucide-react'
import { motion } from 'motion/react'

export function DashboardScreen() {
  const { watch, connectWatch, disconnectWatch, sendWatchAlert, setActiveTab } = useAppStore()
  
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || []
  const memories = useLiveQuery(() => db.memories.toArray(), []) || []
  
  const pendingTasks = tasks.filter(t => !t.isCompleted)
  const isConnected = watch.connectionState === 'connected'

  const handleTestAlert = () => {
    sendWatchAlert("WristOS: Focus Session")
  }

  return (
    <div className="space-y-6">
      {/* Top Welcome & Hardware Status Hero */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/20 p-6 md:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold tracking-wide">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-rose-400'}`} />
              <span>{isConnected ? 'BLE Synced & Active' : 'Disconnected'}</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white">
              {watch.deviceName}
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              InfiniTime firmware companion. Bi-directional phone-watch intelligence, live biometric streaming, and instant haptic alerts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleTestAlert}
              disabled={!isConnected}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isConnected 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700' 
                  : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <Vibrate className="w-4 h-4 text-indigo-400" />
              <span>Vibrate Watch</span>
            </button>

            <button
              onClick={isConnected ? disconnectWatch : connectWatch}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${
                isConnected
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-500/20'
              }`}
            >
              <Watch className="w-4 h-4" />
              <span>{isConnected ? 'Disconnect' : 'Connect Watch'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Steps */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Activity Telemetry</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Footprints className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold tracking-tight text-white">
              {watch.stepCount.toLocaleString()}
            </div>
            <div className="text-xs text-slate-400 mt-1">Daily Target: 10,000 steps</div>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (watch.stepCount / 10000) * 100)}%` }} 
            />
          </div>
        </motion.div>

        {/* Heart Rate */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Heart Rate (HRS)</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold tracking-tight text-white flex items-baseline gap-2">
              {watch.heartRate} <span className="text-sm font-semibold text-slate-400">BPM</span>
            </div>
            <div className="text-xs text-emerald-400 font-medium mt-1">Normal Resting Rhythm</div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>Updated live from watch</span>
          </div>
        </motion.div>

        {/* Battery */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Watch Power (BAS)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <BatteryCharging className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold tracking-tight text-white">
              {watch.batteryLevel}%
            </div>
            <div className="text-xs text-slate-400 mt-1">High efficiency power mode</div>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-emerald-400 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${watch.batteryLevel}%` }} 
            />
          </div>
        </motion.div>
      </div>

      {/* Two Column Section: Quick Agenda & AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Agenda */}
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-base font-bold text-white">Pending Agenda</h3>
            </div>
            <button
              onClick={() => setActiveTab('tasks')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300"
            >
              <span>View All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {pendingTasks.slice(0, 3).map((task) => (
              <div 
                key={task.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800/60 hover:border-slate-700/80 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{task.title}</p>
                  <p className="text-[11px] text-slate-400">{task.dueTime}</p>
                </div>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <p className="text-xs text-slate-500 py-4 text-center">All caught up! No pending tasks.</p>
            )}
          </div>
        </div>

        {/* AI Knowledge Brief */}
        <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-base font-bold text-white">Personal Knowledge Context</h3>
            </div>
            <button
              onClick={() => setActiveTab('memory')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              <span>Open Vault</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {memories.slice(0, 2).map((m) => (
              <div 
                key={m.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800/60 space-y-1"
              >
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {m.tag}
                </span>
                <p className="text-xs text-slate-300 line-clamp-2">{m.fact}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>{memories.length} facts synced into AI prompt memory</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
