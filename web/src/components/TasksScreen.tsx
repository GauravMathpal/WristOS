import { useState } from 'react'
import { db, TaskRecord } from '../lib/db'
import { taskRepository } from '../lib/repository'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Plus, 
  Trash2, 
  Clock, 
  CheckCircle, 
  Circle,
  CloudCheck,
  CloudUpload
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export function TasksScreen() {
  const [newTitle, setNewTitle] = useState('')
  const [newDue, setNewDue] = useState('Today')
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')

  const tasks = useLiveQuery(
    () => db.tasks.filter((t) => !t.deletedAt).reverse().sortBy('createdAt'),
    []
  ) || []

  const handleToggle = async (task: TaskRecord) => {
    await taskRepository.toggleComplete(task.id)
  }

  const handleDelete = async (id: string) => {
    await taskRepository.delete(id)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    await taskRepository.add(newTitle, newDue)
    setNewTitle('')
    setNewDue('Today')
    setShowAddModal(false)
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending') return !t.isCompleted
    if (filter === 'completed') return t.isCompleted
    return true
  })

  const pendingCount = tasks.filter(t => !t.isCompleted).length
  const completedCount = tasks.filter(t => t.isCompleted).length
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 font-semibold">AGENDA MANAGER</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Tasks & Reminders</h2>
          <p className="text-xs text-slate-400">
            {pendingCount} remaining • {completedCount} completed ({completionRate}% progress)
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Task</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-1.5">
          {(['all', 'pending', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === tab 
                  ? 'bg-white/[0.08] text-white font-semibold border border-white/[0.08]' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab} ({tab === 'all' ? tasks.length : tab === 'pending' ? pendingCount : completedCount})
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          DEXIE + SUPABASE SYNCED
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                task.isCompleted
                  ? 'bg-white/[0.01] border-white/[0.03] text-slate-500'
                  : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1] text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <button
                  onClick={() => handleToggle(task)}
                  className="shrink-0 transition-transform active:scale-90"
                >
                  {task.isCompleted ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 hover:text-cyan-400" />
                  )}
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-xs sm:text-sm font-medium truncate ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-100'}`}>
                      {task.title}
                    </p>
                    {task.syncStatus === 'synced' ? (
                      <span title="Cloud Synced"><CloudCheck className="w-3.5 h-3.5 text-emerald-400/80 shrink-0" /></span>
                    ) : (
                      <span title="Pending Sync"><CloudUpload className="w-3.5 h-3.5 text-amber-400/80 shrink-0" /></span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{task.dueTime}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(task.id)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTasks.length === 0 && (
          <div className="py-12 text-center rounded-2xl border border-dashed border-white/[0.06] text-slate-400 text-xs">
            No agenda items in this category.
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-[#0f1117] border border-white/[0.1] shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Create Agenda Item</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-xs">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g., Validate PineTime step telemetry"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">Due Schedule</label>
                <input
                  type="text"
                  placeholder="e.g., Today 5:00 PM"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:bg-white/[0.04]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
