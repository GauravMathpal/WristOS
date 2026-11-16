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
  WifiOff
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
    setExportNotice('Export downloaded successfully!')
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
      } catch (err) {
        alert("Invalid WristOS backup JSON file.")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Configuration</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">System & Cloud Settings</h2>
          <p className="text-xs text-slate-400">
            Local-first Dexie storage, Supabase cloud sync, and PineTime BLE hardware toggles
          </p>
        </div>
      </div>

      {/* Cloud Account & Synchronization Status */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Cloud className="w-4 h-4 text-emerald-400" />
            <span>Supabase Cloud Sync</span>
          </h3>

          {/* Sync status pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/90 border border-slate-800">
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
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
            <p className="font-bold">Supabase Credentials Not Yet Configured</p>
            <p className="text-slate-400">
              Your app is running in 100% offline Local-First mode with Dexie.js. To enable multi-device cloud backup, add <code className="text-amber-200">VITE_SUPABASE_URL</code> and <code className="text-amber-200">VITE_SUPABASE_ANON_KEY</code> to <code className="text-amber-200">web/.env</code>.
            </p>
          </div>
        ) : user ? (
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <User className="w-4 h-4" />
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
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync Now</span>
              </button>
              <button
                onClick={() => signOut()}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div>
              <p className="text-xs font-semibold text-slate-200">Sign in with Email (Magic Link)</p>
              <p className="text-[11px] text-slate-400">Sync tasks and memories across your phone, tablet, and browser.</p>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingAuth || !emailInput.trim()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 shadow-md shadow-cyan-500/20 shrink-0"
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

      {/* Data Management Section */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          <span>Local Storage & Preservation (Room / Dexie)</span>
        </h3>

        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <p className="text-xs text-slate-300">
            WristOS guarantees non-destructive persistence. Export your tasks and memory vault to JSON or import existing Room database data.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Database (JSON)</span>
            </button>

            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Import Data (JSON)</span>
              <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
            </label>
          </div>

          {exportNotice && (
            <p className="text-xs text-emerald-400 font-semibold pt-1">✓ {exportNotice}</p>
          )}
        </div>
      </div>

      {/* Hardware Section */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Watch className="w-4 h-4 text-cyan-400" />
          <span>InfiniTime BLE Companion</span>
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div>
              <p className="text-sm font-semibold text-white">Auto-Sync Telemetry</p>
              <p className="text-xs text-slate-400">Stream steps and heart rate continuously via BLE CTS & HRS</p>
            </div>
            <button
              onClick={() => setAutoSync(!autoSync)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${autoSync ? 'bg-cyan-500' : 'bg-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${autoSync ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div>
              <p className="text-sm font-semibold text-white">Forward Phone Notifications</p>
              <p className="text-xs text-slate-400">Push reminder alerts to watch via GATT ANS 0x1811</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${notifications ? 'bg-cyan-500' : 'bg-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div>
              <p className="text-sm font-semibold text-white">Wrist Haptic Vibration</p>
              <p className="text-xs text-slate-400">Vibrate PineTime on scheduled alarms and AI priority alerts</p>
            </div>
            <button
              onClick={() => setWristVibrate(!wristVibrate)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${wristVibrate ? 'bg-cyan-500' : 'bg-slate-800'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${wristVibrate ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
