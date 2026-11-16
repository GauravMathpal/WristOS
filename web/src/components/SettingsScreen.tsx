import { useState } from 'react'
import { 
  Watch, 
  Database, 
  Cloud, 
  Download, 
  Upload 
} from 'lucide-react'
import { db } from '../lib/db'

export function SettingsScreen() {
  const [autoSync, setAutoSync] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [wristVibrate, setWristVibrate] = useState(true)
  const [exportNotice, setExportNotice] = useState<string | null>(null)

  // JSON Export / Import for safe Room DB backup & restore
  const handleExportJson = async () => {
    const tasks = await db.tasks.toArray()
    const memories = await db.memories.toArray()
    const exportData = {
      version: '1.0',
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
          <h2 className="text-2xl font-extrabold text-white">System & Hardware Settings</h2>
          <p className="text-xs text-slate-400">
            Control PineTime InfiniTime BLE parameters, local Dexie database, and Supabase cloud sync
          </p>
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

      {/* Cloud & Specs */}
      <div className="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Cloud className="w-4 h-4 text-emerald-400" />
          <span>Cloud & Architecture Metadata</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Stack Architecture</span>
            <span className="font-semibold text-slate-200">React 19 + Capacitor 7</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Offline Storage</span>
            <span className="font-semibold text-slate-200">Dexie IndexedDB (Local-First)</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">Cloud Sync Target</span>
            <span className="font-semibold text-slate-200">Supabase Free Tier (M4)</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-400">AI Engine</span>
            <span className="font-semibold text-slate-200">Gemini Edge Functions (M5)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
