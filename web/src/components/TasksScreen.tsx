import { useState } from 'react'
import { db, TaskRecord } from '../lib/db'
import { taskRepository } from '../lib/repository'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Plus, 
  Trash2, 
  Clock, 
  Check, 
  CloudCheck, 
  CloudUpload,
  X
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
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-semibold">AGENDA & TASKS</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Tasks & Reminders</h2>
          <p className="text-xs text-slate-400">
            {pendingCount} remaining • {completedCount} completed ({completionRate}% progress)
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 450, damping: 20 }}
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold text-xs transition-all shadow-md shadow-purple-500/25 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </motion.button>
      </div>

      {/* Filter Tabs with Sliding Motion Indicator */}
      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
        <div className="flex items-center p-1 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          {(['all', 'pending', 'completed'] as const).map((tab) => {
            const isSelected = filter === tab
            const count = tab === 'all' ? tasks.length : tab === 'pending' ? pendingCount : completedCount
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="taskFilterPill"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-600/80 to-pink-600/80 shadow-sm"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>{tab}</span>
                  <span className="text-[10px] opacity-75 font-mono">({count})</span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
          DEXIE + SUPABASE SYNCED
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {filteredTasks.map((task: TaskRecord) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              whileHover={{ y: -2, scale: 1.005 }}
              transition={{ duration: 0.18 }}
              className="group flex items-center justify-between p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.035] hover:border-purple-500/20 backdrop-blur-md transition-all"
            >
              <div 
                onClick={() => handleToggle(task)}
                className="flex items-center gap-3.5 flex-1 cursor-pointer min-w-0"
              >
                <motion.div
                  whileTap={{ scale: 0.75 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    task.isCompleted
                      ? 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-sm shadow-purple-500/30'
                      : 'border border-white/20 hover:border-purple-400'
                  }`}
                >
                  {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </motion.div>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${
                    task.isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                  }`}>
                    {task.title}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 pl-3">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>{task.dueTime}</span>
                </div>

                <div className="flex items-center gap-2">
                  {task.syncStatus === 'synced' ? (
                    <span title="Cloud Synced"><CloudCheck className="w-3.5 h-3.5 text-emerald-400/80" /></span>
                  ) : (
                    <span title="Pending Local Sync"><CloudUpload className="w-3.5 h-3.5 text-amber-400/80" /></span>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={() => handleDelete(task.id)}
                    className="opacity-60 group-hover:opacity-100 text-slate-500 hover:text-rose-400 p-1 transition-opacity"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTasks.length === 0 && (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] text-slate-500 space-y-3">
            <p className="text-sm font-medium text-slate-300">No tasks in this view</p>
            <p className="text-xs text-slate-500">
              {filter === 'completed' ? 'Complete your pending agenda items!' : 'Enjoy your day or click "New Task" to plan ahead.'}
            </p>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md p-6 rounded-2xl bg-[#0f0b1a] border border-white/[0.1] shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Create New Agenda Task</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Gym / Walk, Complete Assignment, Read Paper"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Due Time</label>
                <input
                  type="text"
                  placeholder="e.g. Today, 6:00 PM, Tomorrow"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.94 }}
                  disabled={!newTitle.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 disabled:opacity-40 text-white shadow-md shadow-purple-500/25"
                >
                  Save Task
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
