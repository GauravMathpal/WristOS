import { useState, useEffect } from 'react'
import { 
  Watch, 
  Database, 
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
  Cpu, 
  Check 
} from 'lucide-react'
import { db } from '../lib/db'
import { useAuthStore } from '../stores/useAuthStore'
import { syncService, SyncState } from '../lib/syncService'
import { isSupabaseConfigured } from '../lib/supabase'

export function SettingsScreen() {
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

  // JSON Export / Import for safe Room DB backup & restore
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

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-6 md:p-7 backdrop-blur-xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300 font-medium text-[11px]">System & Architecture Control</span>
          </div>
          
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Settings & Sync</span>
          </h2>

          <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
            Configure local-first Dexie replication, Supabase multi-device synchronization, and InfiniTime Bluetooth Low Energy telemetry.
          </p>
        </div>
      </div>

      {/* Cloud Account & Synchronization Status */}
      <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-5">
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

        {/* Auth / Account State */}
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
              <button
                onClick={() => syncService.triggerSync()}
                className="px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Now</span>
              </button>
              <button
                onClick={() => signOut()}
                className="px-3.5 py-2 rounded-xl text-xs font-medium bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center gap-1.5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
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
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-white/20"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth || !emailInput.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white text-slate-950 hover:bg-slate-200 disabled:opacity-40 transition-all shrink-0"
              >
                {isSubmittingAuth ? 'Sending...' : 'Send Magic Link'}
              </button>
            </div>

            {authMessage && (
              <p className="text-xs text-cyan-400 font-medium">{authMessage}</p>
            )}
          </form>
        )}
      </div>

      {/* Local Storage & Data Preservation */}
      <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
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
            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] transition-all"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export JSON Backup</span>
            </button>

            <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5 text-slate-400" />
              <span>Import JSON Data</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
          </div>

          {exportNotice && (
            <p className="text-xs text-emerald-400 font-medium pt-1 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>{exportNotice}</span>
            </p>
          )}
        </div>
      </div>

      {/* Hardware Section */}
      <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
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
              className={`w-11 h-6 rounded-full p-0.5 transition-colors ${autoSync ? 'bg-cyan-500' : 'bg-white/[0.1]'}`}
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
              className={`w-11 h-6 rounded-full p-0.5 transition-colors ${notifications ? 'bg-cyan-500' : 'bg-white/[0.1]'}`}
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
              className={`w-11 h-6 rounded-full p-0.5 transition-colors ${wristVibrate ? 'bg-cyan-500' : 'bg-white/[0.1]'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-slate-950 transition-transform ${wristVibrate ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Diagnostics / System Information */}
      <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">System Diagnostics</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
            <span className="text-slate-500 text-[11px]">Native Android Target</span>
            <p className="font-mono text-slate-200">Capacitor 7 (com.wristos.app)</p>
          </div>
        </div>
      </div>

    </div>
  )
}
