import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { 
  Search, 
  Sparkles, 
  CheckSquare, 
  Timer, 
  Activity, 
  Brain, 
  Watch, 
  Sliders, 
  Palette, 
  X,
  ArrowRight
} from 'lucide-react'
import { useAppStore } from '../stores/useAppStore'
import { useThemeStore, ThemePreset } from '../stores/useThemeStore'
import { db } from '../lib/db'
import { useLiveQuery } from 'dexie-react-hooks'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const { setActiveTab } = useAppStore()
  const { setPreset } = useThemeStore()

  const tasks = useLiveQuery(() => db.tasks.filter(t => !t.deletedAt).toArray(), []) || []
  const memories = useLiveQuery(() => db.memories.filter(m => !m.deletedAt).toArray(), []) || []

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          // Open
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const q = query.toLowerCase().trim()

  const navigationCommands = [
    { title: 'Home Dashboard', tab: 'dashboard' as const, icon: Sparkles, desc: 'Overview, today plan & telemetry' },
    { title: 'AI Assistant', tab: 'assistant' as const, icon: Sparkles, desc: 'Conversational assistant with breathing orb' },
    { title: 'Tasks & Agenda', tab: 'tasks' as const, icon: CheckSquare, desc: 'Manage your daily checklist' },
    { title: 'Focus Session', tab: 'focus' as const, icon: Timer, desc: 'Pomodoro timer & deep work' },
    { title: 'Health & Biometrics', tab: 'health' as const, icon: Activity, desc: 'Activity ring & heart rate trends' },
    { title: 'Knowledge Vault', tab: 'memory' as const, icon: Brain, desc: 'Grounding memory facts' },
    { title: 'Smartwatch Devices', tab: 'devices' as const, icon: Watch, desc: 'PineTime Bluetooth GATT manager' },
    { title: 'Settings & Appearance', tab: 'settings' as const, icon: Sliders, desc: 'Theme colors and cloud sync' },
  ].filter(item => !q || item.title.toLowerCase().includes(q) || item.desc.toLowerCase().includes(q))

  const themeList: { title: string; preset: ThemePreset; desc: string }[] = [
    { title: 'Switch to Aurora Theme', preset: 'aurora', desc: 'Purple & Violet (Default)' },
    { title: 'Switch to Ocean Theme', preset: 'ocean', desc: 'Blue & Cyan' },
    { title: 'Switch to Emerald Theme', preset: 'emerald', desc: 'Green & Mint' },
    { title: 'Switch to Sunset Theme', preset: 'sunset', desc: 'Orange & Gold' },
    { title: 'Switch to Rose Theme', preset: 'rose', desc: 'Pink & Magenta' },
    { title: 'Switch to Monochrome Theme', preset: 'monochrome', desc: 'Black, White & Silver' },
  ]
  const themeCommands = themeList.filter(item => !q || item.title.toLowerCase().includes(q))

  const matchingTasks = tasks.filter(t => !q || t.title.toLowerCase().includes(q)).slice(0, 3)
  const matchingMemories = memories.filter(m => !q || m.fact.toLowerCase().includes(q) || m.tag.toLowerCase().includes(q)).slice(0, 3)

  const handleSelectNav = (tab: any) => {
    setActiveTab(tab)
    onClose()
  }

  const handleSelectTheme = (preset: ThemePreset) => {
    setPreset(preset)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl rounded-2xl bg-[#0e0a1a] border border-white/[0.1] shadow-2xl overflow-hidden flex flex-col max-h-[540px]"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08]">
          <Search className="w-4 h-4 text-purple-400 shrink-0" />
          <input
            type="text"
            placeholder="Search screens, tasks, memories, or themes (or press Esc)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          
          {/* Navigation Items */}
          {navigationCommands.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2.5">
                Navigation
              </span>
              {navigationCommands.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.tab}
                    onClick={() => handleSelectNav(item.tab)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] text-left transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{item.title}</p>
                        <p className="text-[10px] text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                  </button>
                )
              })}
            </div>
          )}

          {/* Quick Tasks */}
          {matchingTasks.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2.5">
                Matching Tasks
              </span>
              {matchingTasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleSelectNav('tasks')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-200">{task.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{task.dueTime}</span>
                </button>
              ))}
            </div>
          )}

          {/* Quick Memories */}
          {matchingMemories.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2.5">
                Vault Memories
              </span>
              {matchingMemories.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleSelectNav('memory')}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Brain className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-200 truncate">{m.fact}</span>
                  </div>
                  <span className="text-[10px] font-mono text-purple-400 font-semibold uppercase">{m.tag}</span>
                </button>
              ))}
            </div>
          )}

          {/* Theme Commands */}
          {themeCommands.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-2.5">
                Appearance Themes
              </span>
              {themeCommands.map((t) => (
                <button
                  key={t.preset}
                  onClick={() => handleSelectTheme(t.preset)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-white/[0.04] text-left transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Palette className="w-4 h-4 text-pink-400 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-slate-200">{t.title}</p>
                      <p className="text-[10px] text-slate-400">{t.desc}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">APPLY</span>
                </button>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/[0.06] bg-white/[0.01] flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>Navigate with arrows • Enter to open</span>
          <span>Cmd+K</span>
        </div>
      </motion.div>
    </div>
  )
}
