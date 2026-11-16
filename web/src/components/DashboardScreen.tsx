import { useAppStore } from '../stores/useAppStore'
import { db } from '../lib/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Footprints, 
  Activity, 
  Battery, 
  Vibrate, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  Watch
} from 'lucide-react'
import { motion } from 'motion/react'

export function DashboardScreen() {
  const { watch, connectWatch, disconnectWatch, sendWatchAlert, setActiveTab } = useAppStore()
  
  const tasks = useLiveQuery(() => db.tasks.toArray(), []) || []
  const memories = useLiveQuery(() => db.memories.toArray(), []) || []
  
  const pendingTasks = tasks.filter(t => !t.isCompleted && !t.deletedAt)
  const isConnected = watch.connectionState === 'connected'

  const handleTestAlert = () => {
    sendWatchAlert("WristOS: Focus Session")
  }

  const stepPercentage = Math.min(100, Math.round((watch.stepCount / 10000) * 100))

  return (
    <div className="space-y-6">
      
      {/* Companion Hardware Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 md:p-7 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-500'}`} />
              <span className="text-slate-300 font-medium text-[11px]">{isConnected ? 'GATT Connected • Nordic nRF52832' : 'Hardware Disconnected'}</span>
            </div>
            
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
              <span>{watch.deviceName}</span>
              {isConnected && (
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  InfiniTime 1.14
                </span>
              )}
            </h2>

            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              Real-time companion telemetry. Bi-directional phone-watch intelligence over Bluetooth Low Energy CTS, HRS & ANS GATT protocols.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleTestAlert}
              disabled={!isConnected}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                isConnected 
                  ? 'bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08]' 
                  : 'bg-white/[0.02] text-slate-600 border border-white/[0.04] cursor-not-allowed'
              }`}
            >
              <Vibrate className="w-3.5 h-3.5 text-cyan-400" />
              <span>Haptic Alert</span>
            </button>

            <button
              onClick={isConnected ? disconnectWatch : connectWatch}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                isConnected
                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'
                  : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold'
              }`}
            >
              <Watch className="w-3.5 h-3.5" />
              <span>{isConnected ? 'Disconnect' : 'Connect Watch'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Step Count */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Daily Steps</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Footprints className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-white font-mono">
              {watch.stepCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              <span>{stepPercentage}% of 10,000 goal</span>
            </div>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-cyan-400 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${stepPercentage}%` }} 
            />
          </div>
        </motion.div>

        {/* Heart Rate */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Heart Rate (HRS)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-white font-mono flex items-baseline gap-2">
              {watch.heartRate || '--'} <span className="text-xs font-sans font-medium text-slate-400">BPM</span>
            </div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3 h-3" />
              <span>Normal Cardio Resting Range</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {isConnected ? 'LIVE STREAMING VIA 0x180D' : 'SENSOR STANDBY'}
          </div>
        </motion.div>

        {/* Watch Battery */}
        <motion.div 
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Battery (BAS)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-white font-mono">
              {watch.batteryLevel ? `${watch.batteryLevel}%` : '--'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {watch.batteryLevel ? 'Optimal power draw' : 'Awaiting sync'}
            </div>
          </div>
          <div className="w-full bg-white/[0.06] rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${watch.batteryLevel || 0}%` }} 
            />
          </div>
        </motion.div>
      </div>

      {/* Two Column Layout: Daily Agenda & Personal Vault Preview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Agenda */}
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-white">Daily Agenda</h3>
            </div>
            <button
              onClick={() => setActiveTab('tasks')}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2">
            {pendingTasks.slice(0, 3).map((task) => (
              <div 
                key={task.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                  <p className="text-xs font-medium text-slate-200 truncate">{task.title}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 pl-2 font-mono">{task.dueTime}</span>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400">
                No pending tasks today. All clear!
              </div>
            )}
          </div>
        </div>

        {/* Knowledge Vault Snapshot */}
        <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">Knowledge Vault Context</h3>
            </div>
            <button
              onClick={() => setActiveTab('memory')}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <span>Explore</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {memories.slice(0, 2).map((m) => (
              <div 
                key={m.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] space-y-1.5"
              >
                <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {m.tag}
                </span>
                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{m.fact}</p>
              </div>
            ))}
          </div>

          <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{memories.length} facts available to Gemini AI</span>
            <span className="text-cyan-400 font-mono text-[10px]">SYNCED</span>
          </div>
        </div>
      </div>
    </div>
  )
}
