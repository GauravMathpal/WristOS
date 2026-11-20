import { useState } from 'react'
import { db, TaskRecord } from '../lib/db'
import { taskRepository } from '../lib/repository'
import { useLiveQuery } from 'dexie-react-hooks'
import { 
  Check, 
  Plus, 
  Trash2, 
  Calendar, 
  Search, 
  X,
  Sparkles,
  CheckCircle2,
  ListTodo
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export function TasksScreen() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  
  // New task form fields
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [newPriority, setNewPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [newCategory, setNewCategory] = useState('general')

  const tasks = useLiveQuery(() => {
    return db.tasks
      .filter((t) => !t.deletedAt)
      .reverse()
      .sortBy('createdAt')
  }, []) || []

  const handleToggle = async (task: TaskRecord) => {
    await taskRepository.toggleComplete(task.id)
  }

  const handleDelete = async (id: string) => {
    await taskRepository.delete(id)
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    await taskRepository.add(
      newTitle.trim(),
      newDueDate ? new Date(newDueDate).toISOString() : undefined,
      newPriority,
      newCategory
    )

    setNewTitle('')
    setNewDueDate('')
    setNewPriority('normal')
    setNewCategory('general')
    setShowAddModal(false)
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending' && t.isCompleted) return false
    if (filter === 'completed' && !t.isCompleted) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      return t.title.toLowerCase().includes(q) || (t.category && t.category.toLowerCase().includes(q))
    }
    return true
  })

  const pendingCount = tasks.filter(t => !t.isCompleted).length
  const completedCount = tasks.filter(t => t.isCompleted).length
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0

  const priorityStyles: Record<string, string> = {
    urgent: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_8px_rgba(244,63,94,0.3)]',
    high: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_8px_rgba(245,158,11,0.3)]',
    normal: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    low: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl border border-purple-500/25 bg-gradient-to-r from-[#1c123b]/85 via-[#140e2b]/80 to-[#0e0820]/90 backdrop-blur-2xl shadow-xl shadow-purple-950/25">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-purple-400 font-bold flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5 text-pink-400" />
              <span>AGENDA & TASKS</span>
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            Tasks & Reminders
          </h2>
          <p className="text-xs text-purple-200/80 font-medium">
            {pendingCount} remaining • {completedCount} completed ({completionRate}% progress)
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          transition={{ type: 'spring', stiffness: 450, damping: 20 }}
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white font-bold text-xs transition-all shadow-lg shadow-pink-500/30 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </motion.button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
        <div className="flex items-center p-1.5 rounded-2xl bg-[#0d091d]/80 border border-purple-500/25 shadow-inner">
          {(['all', 'pending', 'completed'] as const).map((tab) => {
            const isSelected = filter === tab
            const count = tab === 'all' ? tasks.length : tab === 'pending' ? pendingCount : completedCount
            return (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`relative px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                  isSelected ? 'text-white' : 'text-slate-400 hover:text-purple-200'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="taskFilterPill"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 shadow-md shadow-pink-600/30"
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  <span>{tab}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-purple-500/10 text-purple-300'
                  }`}>
                    {count}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-purple-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#140e29]/80 border border-purple-500/25 text-xs text-white placeholder:text-purple-400/50 focus:outline-none focus:border-pink-500 transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-purple-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Task Rows List with Micro-interactions */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {filteredTasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ x: 4 }}
              transition={{ duration: 0.18 }}
              className="group flex items-center justify-between p-4 rounded-2xl bg-[#140e29]/80 hover:bg-[#1c133a] border border-purple-500/20 hover:border-purple-500/50 transition-all backdrop-blur-md shadow-sm hover:shadow-[0_4px_20px_rgba(168,85,247,0.2)]"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Spring Animated Checkbox */}
                <motion.button
                  whileTap={{ scale: 0.75 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  onClick={() => handleToggle(task)}
                  className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                    task.isCompleted
                      ? 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-md shadow-pink-500/30'
                      : 'border border-purple-500/40 hover:border-pink-400 bg-black/20'
                  }`}
                >
                  {task.isCompleted && (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </motion.div>
                  )}
                </motion.button>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-xs sm:text-sm font-semibold transition-all truncate ${
                      task.isCompleted ? 'line-through text-purple-300/40' : 'text-white'
                    }`}>
                      {task.title}
                    </p>

                    {/* Priority badge */}
                    {task.priority && task.priority !== 'normal' && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold tracking-wider border ${priorityStyles[task.priority] || priorityStyles.normal}`}>
                        {task.priority}
                      </span>
                    )}

                    {/* Category pill */}
                    {task.category && task.category !== 'general' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-pink-300 bg-pink-500/15 border border-pink-500/30 font-bold">
                        #{task.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 pl-3">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-purple-300/80">
                  {task.dueTime && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-pink-400" />
                      <span>{new Date(task.dueTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDelete(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-rose-400 transition-opacity p-1"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12 p-6 rounded-3xl border border-purple-500/20 bg-[#140e29]/40 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-purple-400 mx-auto" />
            <p className="text-xs font-bold text-white">No tasks matching your current filter.</p>
            <p className="text-[11px] text-purple-200/70">Click "New Task" above or ask the AI assistant to add one.</p>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-gradient-to-b from-[#221345] to-[#0c071d] p-6 shadow-2xl shadow-purple-950/60 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>Create Task / Reminder</span>
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-purple-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete DSA assignment"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-purple-500/30 text-xs text-white placeholder:text-purple-400/50 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-purple-200">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#140e29] border border-purple-500/30 text-xs text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="general">#general</option>
                      <option value="study">#study</option>
                      <option value="work">#work</option>
                      <option value="health">#health</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-purple-200">Priority</label>
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#140e29] border border-purple-500/30 text-xs text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">Due Time (Optional)</label>
                  <input
                    type="datetime-local"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-purple-500/30 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-purple-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-pink-500/30"
                  >
                    Save Task
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
