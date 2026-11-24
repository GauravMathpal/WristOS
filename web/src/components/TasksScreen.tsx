import { useState } from 'react'
import { db, TaskRecord, CalendarEventRecord } from '../lib/db'
import { taskRepository, calendarRepository } from '../lib/repository'
import { useLiveQuery } from 'dexie-react-hooks'
import { useAppStore } from '../stores/useAppStore'
import { 
  Check, 
  Plus, 
  Trash2, 
  Calendar as CalendarIcon, 
  Search, 
  X, 
  Sparkles, 
  CheckCircle2, 
  ChevronLeft,
  ChevronRight,
  Clock,
  Repeat,
  Send,
  MapPin,
  Edit2,
  Layers
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

export function TasksScreen() {
  const { setActiveTab, sendWatchAlert } = useAppStore()

  // Primary subview: Tasks vs Smart Calendar
  const [subView, setSubView] = useState<'tasks' | 'calendar'>('tasks')

  // Tasks Filter state
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<TaskRecord | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Natural Language Task Quick-Add input
  const [quickInput, setQuickInput] = useState('')

  // Task form fields
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDueTime, setTaskDueTime] = useState('Today, 6:00 PM')
  const [taskPriority, setTaskPriority] = useState<string>('normal')
  const [taskCategory, setTaskCategory] = useState('general')
  const [taskRecurring, setTaskRecurring] = useState<'none' | 'daily' | 'weekly'>('none')

  // Calendar state
  const [calendarDateStr, setCalendarDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [eventTitle, setEventTitle] = useState('')
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0])
  const [eventStartTime, setEventStartTime] = useState('10:00')
  const [eventEndTime, setEventEndTime] = useState('11:00')
  const [eventCategory, setEventCategory] = useState<'class' | 'meeting' | 'deadline' | 'personal'>('class')
  const [eventLocation, setEventLocation] = useState('')
  const [eventDescription, setEventDescription] = useState('')

  // Live queries
  const tasks = useLiveQuery(() => {
    return db.tasks
      .filter((t) => !t.deletedAt)
      .reverse()
      .sortBy('createdAt')
  }, []) || []

  const calendarEvents = useLiveQuery(() => {
    return db.calendarEvents
      .where('date')
      .equals(calendarDateStr)
      .filter((e) => !e.deletedAt)
      .sortBy('startTime')
  }, [calendarDateStr]) || []

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Natural Language Task Parser
  const handleQuickAddNaturalTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickInput.trim()) return

    let text = quickInput.trim()
    let priority = 'normal'
    let category = 'general'
    let dueTime = 'Today'

    // Priority extraction
    if (/#urgent|!urgent|urgent/i.test(text)) {
      priority = 'urgent'
      text = text.replace(/#urgent|!urgent/gi, '').trim()
    } else if (/#high|!high|high/i.test(text)) {
      priority = 'high'
      text = text.replace(/#high|!high/gi, '').trim()
    }

    // Category extraction
    if (/#study|study/i.test(text)) {
      category = 'study'
      text = text.replace(/#study/gi, '').trim()
    } else if (/#work|work/i.test(text)) {
      category = 'work'
      text = text.replace(/#work/gi, '').trim()
    } else if (/#health|health/i.test(text)) {
      category = 'health'
      text = text.replace(/#health/gi, '').trim()
    }

    // Due time extraction
    if (/tomorrow/i.test(text)) {
      dueTime = 'Tomorrow'
      text = text.replace(/tomorrow/gi, '').trim()
    } else if (/tonight/i.test(text)) {
      dueTime = 'Tonight, 9:00 PM'
      text = text.replace(/tonight/gi, '').trim()
    } else {
      const timeMatch = text.match(/(at|by)\s+([0-9]{1,2}(:[0-9]{2})?\s*(am|pm)?)/i)
      if (timeMatch) {
        dueTime = `Today, ${timeMatch[2]}`
        text = text.replace(timeMatch[0], '').trim()
      }
    }

    const title = text || quickInput.trim()
    await taskRepository.add(title, dueTime, priority, category)
    setQuickInput('')
    showToast(`Task created: "${title}" (${priority})`)
  }

  const handleToggleTask = async (task: TaskRecord) => {
    await taskRepository.toggleComplete(task.id)
    showToast(task.isCompleted ? 'Task reopened' : 'Task completed! 🎉')
  }

  const handleDeleteTask = async (id: string) => {
    await taskRepository.delete(id)
    showToast('Task removed')
  }

  const handleSendTaskToWatch = async (task: TaskRecord) => {
    await sendWatchAlert(`Task: ${task.title} • Due ${task.dueTime}`)
    showToast('Sent reminder to WatchOS')
  }

  const handleSaveTaskForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskTitle.trim()) return

    if (editingTask) {
      await db.tasks.update(editingTask.id, {
        title: taskTitle.trim(),
        dueTime: taskDueTime.trim() || 'Today',
        priority: taskPriority,
        category: taskCategory,
        isRecurring: taskRecurring !== 'none',
        recurrenceRule: taskRecurring !== 'none' ? taskRecurring : undefined,
        updatedAt: Date.now(),
        syncStatus: 'pending'
      })
      showToast('Task updated')
      setEditingTask(null)
    } else {
      const task = await taskRepository.add(taskTitle.trim(), taskDueTime.trim() || 'Today', taskPriority, taskCategory)
      if (taskRecurring !== 'none') {
        await db.tasks.update(task.id, {
          isRecurring: true,
          recurrenceRule: taskRecurring
        })
      }
      showToast('New task scheduled')
    }

    setTaskTitle('')
    setTaskDueTime('Today, 6:00 PM')
    setTaskPriority('normal')
    setTaskCategory('general')
    setTaskRecurring('none')
    setShowAddTaskModal(false)
  }

  const handleStartEditTask = (task: TaskRecord) => {
    setEditingTask(task)
    setTaskTitle(task.title)
    setTaskDueTime(task.dueTime)
    setTaskPriority(task.priority || 'normal')
    setTaskCategory(task.category || 'general')
    setTaskRecurring(task.recurrenceRule || 'none')
    setShowAddTaskModal(true)
  }

  // Calendar Event Handlers
  const handleSaveCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventTitle.trim()) return

    await calendarRepository.add(
      eventTitle.trim(),
      eventDate,
      eventStartTime,
      eventEndTime,
      eventCategory,
      eventLocation.trim(),
      eventDescription.trim()
    )

    setEventTitle('')
    setEventLocation('')
    setEventDescription('')
    setShowAddEventModal(false)
    showToast(`Added event to calendar for ${eventDate}`)
  }

  const handleDeleteCalendarEvent = async (id: string) => {
    await calendarRepository.delete(id)
    showToast('Event removed from schedule')
  }

  const handleSendEventToWatch = async (evt: CalendarEventRecord) => {
    const loc = evt.location ? ` @ ${evt.location}` : ''
    await sendWatchAlert(`${evt.category.toUpperCase()}: ${evt.title} (${evt.startTime})${loc}`)
    showToast('Sent event schedule to WatchOS')
  }

  // Change Calendar Day
  const handleShiftCalendarDay = (offset: number) => {
    const current = new Date(calendarDateStr)
    current.setDate(current.getDate() + offset)
    setCalendarDateStr(current.toISOString().split('T')[0])
  }

  // Filtered Tasks
  const filteredTasks = tasks.filter((t) => {
    if (filter === 'pending' && t.isCompleted) return false
    if (filter === 'completed' && !t.isCompleted) return false
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false
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
    urgent: 'bg-rose-500/15 text-rose-300 border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.25)]',
    high: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    normal: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
    low: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25'
  }

  const calendarDateFormatted = new Date(calendarDateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-8">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-purple-600/90 text-white text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 border border-purple-400/40"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-300" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP HEADER: Back button + Title + Create Action */}
      <div className="flex items-center justify-between pt-1">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setActiveTab('dashboard')}
          className="w-10 h-10 rounded-full bg-[#161224] border border-white/[0.08] flex items-center justify-center text-slate-300 hover:text-white transition-all shadow-md"
          title="Back to Home"
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>

        <h2 className="text-lg font-extrabold text-white tracking-tight">
          {subView === 'tasks' ? 'Tasks & Reminders' : 'Smart Calendar'}
        </h2>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            if (subView === 'tasks') {
              setEditingTask(null)
              setTaskTitle('')
              setTaskDueTime('Today, 6:00 PM')
              setTaskPriority('normal')
              setShowAddTaskModal(true)
            } else {
              setEventDate(calendarDateStr)
              setShowAddEventModal(true)
            }
          }}
          className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white transition-all shadow-lg shadow-pink-500/30"
          title={subView === 'tasks' ? 'Create Task' : 'Add Calendar Event'}
        >
          <Plus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* 2. SUB-VIEW SEGMENTED SWITCHER: Tasks vs Calendar */}
      <div className="flex items-center p-1 rounded-2xl bg-[#161224] border border-white/[0.08] shadow-inner">
        <button
          onClick={() => setSubView('tasks')}
          className={`relative flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            subView === 'tasks' ? 'text-white' : 'text-slate-400 hover:text-purple-200'
          }`}
        >
          {subView === 'tasks' && (
            <motion.div
              layoutId="tasksViewPill"
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 shadow-md shadow-pink-600/30"
            />
          )}
          <Layers className="w-3.5 h-3.5 relative z-10" />
          <span className="relative z-10">Tasks ({tasks.length})</span>
        </button>

        <button
          onClick={() => setSubView('calendar')}
          className={`relative flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            subView === 'calendar' ? 'text-white' : 'text-slate-400 hover:text-purple-200'
          }`}
        >
          {subView === 'calendar' && (
            <motion.div
              layoutId="tasksViewPill"
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 shadow-md shadow-pink-600/30"
            />
          )}
          <CalendarIcon className="w-3.5 h-3.5 relative z-10" />
          <span className="relative z-10">Smart Calendar</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* VIEW A: TASKS & SMART REMINDERS                           */}
      {/* ========================================================= */}
      {subView === 'tasks' && (
        <div className="space-y-4">
          
          {/* Natural Language Task Quick-Add Bar */}
          <form onSubmit={handleQuickAddNaturalTask} className="relative">
            <input
              type="text"
              placeholder="e.g. Finish lab report by tomorrow at 4pm #urgent #study"
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              className="w-full pl-3.5 pr-20 py-2.5 rounded-2xl bg-[#161224] border border-purple-500/30 text-xs text-white placeholder:text-purple-300/40 focus:outline-none focus:border-pink-500 transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!quickInput.trim()}
              className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[11px] font-bold shadow-md disabled:opacity-40 transition-all"
            >
              Add
            </button>
          </form>

          {/* Daily Progress Card */}
          <div className="p-5 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">DAILY AGENDA</span>
                <h3 className="text-sm font-bold text-white">Execution Rate</h3>
              </div>
              <span className="text-xs font-mono font-bold text-pink-400">
                {completedCount} of {tasks.length} completed
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="w-full h-2 rounded-full bg-[#0d0a18] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionRate}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500"
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>{pendingCount} remaining</span>
                <span className="font-bold text-white">{completionRate}%</span>
              </div>
            </div>
          </div>

          {/* Filters Bar: Status & Priority */}
          <div className="space-y-2.5">
            <div className="flex items-center p-1 rounded-2xl bg-[#161224] border border-white/[0.08]">
              {(['all', 'pending', 'completed'] as const).map((tab) => {
                const isSelected = filter === tab
                const count = tab === 'all' ? tasks.length : tab === 'pending' ? pendingCount : completedCount
                return (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`relative flex-1 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors flex items-center justify-center gap-1 ${
                      isSelected ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{tab}</span>
                    <span className="text-[10px] font-mono opacity-70">({count})</span>
                  </button>
                )
              })}
            </div>

            {/* Priority Selector Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              {['all', 'urgent', 'high', 'normal', 'low'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`px-2.5 py-1 rounded-xl font-semibold capitalize transition-colors shrink-0 ${
                    priorityFilter === p
                      ? 'bg-purple-500/25 text-pink-300 border border-purple-500/40'
                      : 'bg-[#161224] text-slate-400 hover:text-white border border-white/[0.06]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-purple-400/60 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tasks by keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-[#161224] border border-white/[0.08] text-xs text-white placeholder:text-purple-300/40 focus:outline-none focus:border-purple-500/60 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-purple-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Tasks List */}
          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ x: 2 }}
                  transition={{ duration: 0.16 }}
                  className="group p-4 rounded-2xl bg-[#161224] hover:bg-[#1a152b] border border-white/[0.08] hover:border-purple-500/30 transition-all shadow-md space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox button */}
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        onClick={() => handleToggleTask(task)}
                        className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                          task.isCompleted
                            ? 'bg-gradient-to-tr from-purple-500 to-pink-500 text-white shadow-md shadow-pink-500/30'
                            : 'border border-white/20 hover:border-pink-400 bg-white/[0.03]'
                        }`}
                      >
                        {task.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </motion.button>

                      <p className={`text-xs sm:text-sm font-semibold truncate ${
                        task.isCompleted ? 'line-through text-slate-500' : 'text-white'
                      }`}>
                        {task.title}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleSendTaskToWatch(task)}
                        className="p-1 rounded-lg text-purple-400 hover:text-pink-300 hover:bg-white/5 transition-colors"
                        title="Alert on WatchOS"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleStartEditTask(task)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                        title="Edit task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Badges strip */}
                  <div className="flex items-center gap-2 pl-8 flex-wrap">
                    {task.priority && task.priority !== 'normal' && (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold tracking-wider border ${priorityStyles[task.priority] || priorityStyles.normal}`}>
                        {task.priority}
                      </span>
                    )}

                    {task.category && task.category !== 'general' && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono text-pink-300 bg-pink-500/10 border border-pink-500/25 font-bold">
                        #{task.category}
                      </span>
                    )}

                    {task.dueTime && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-purple-300/80">
                        <Clock className="w-3 h-3 text-pink-400" />
                        <span>{task.dueTime}</span>
                      </span>
                    )}

                    {task.isRecurring && (
                      <span className="flex items-center gap-1 text-[10px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                        <Repeat className="w-2.5 h-2.5" />
                        <span>{task.recurrenceRule}</span>
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredTasks.length === 0 && (
              <div className="text-center py-10 p-6 rounded-3xl border border-white/[0.08] bg-[#161224] space-y-2">
                <CheckCircle2 className="w-8 h-8 text-purple-400 mx-auto" />
                <p className="text-xs font-bold text-white">No tasks matching your current filter.</p>
                <p className="text-[11px] text-purple-200/70">Type above or tap '+' to schedule a task.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW B: SMART CALENDAR & TIMETABLE                        */}
      {/* ========================================================= */}
      {subView === 'calendar' && (
        <div className="space-y-4">
          
          {/* Day Navigator */}
          <div className="p-4 rounded-3xl bg-[#161224] border border-white/[0.08] shadow-xl flex items-center justify-between">
            <button
              onClick={() => handleShiftCalendarDay(-1)}
              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <h3 className="text-sm font-black text-white">{calendarDateFormatted}</h3>
              <p className="text-[10px] font-mono text-purple-300/80">
                {calendarDateStr === new Date().toISOString().split('T')[0] ? '• Today •' : calendarDateStr}
              </p>
            </div>

            <button
              onClick={() => handleShiftCalendarDay(1)}
              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Calendar Events List */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {calendarEvents.map((evt) => {
                const categoryStyle = 
                  evt.category === 'class' ? 'border-amber-500/40 bg-amber-500/10 text-amber-300' :
                  evt.category === 'deadline' ? 'border-rose-500/40 bg-rose-500/10 text-rose-300' :
                  evt.category === 'meeting' ? 'border-purple-500/40 bg-purple-500/10 text-purple-300' :
                  'border-sky-500/40 bg-sky-500/10 text-sky-300'

                return (
                  <motion.div
                    key={evt.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -2 }}
                    className="p-4 rounded-2xl bg-[#161224] border border-white/[0.08] hover:border-purple-500/30 transition-all shadow-md space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono uppercase font-bold border ${categoryStyle}`}>
                          {evt.category}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                          {evt.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSendEventToWatch(evt)}
                          className="p-1 rounded-lg text-purple-400 hover:text-pink-300 hover:bg-white/5 transition-colors"
                          title="Alert event on WatchOS"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCalendarEvent(evt.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-white/[0.04]">
                      <div className="flex items-center gap-1 text-[11px] font-mono text-purple-300 font-bold">
                        <Clock className="w-3.5 h-3.5 text-pink-400" />
                        <span>{evt.startTime} - {evt.endTime}</span>
                      </div>

                      {evt.location && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[150px]">{evt.location}</span>
                        </div>
                      )}
                    </div>

                    {evt.description && (
                      <p className="text-[11px] text-slate-300 leading-relaxed pt-0.5">
                        {evt.description}
                      </p>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {calendarEvents.length === 0 && (
              <div className="text-center py-12 p-6 rounded-3xl border border-white/[0.08] bg-[#161224] space-y-2">
                <CalendarIcon className="w-8 h-8 text-purple-400 mx-auto" />
                <p className="text-xs font-bold text-white">No events scheduled for {calendarDateFormatted}.</p>
                <p className="text-[11px] text-slate-400">Tap '+' to schedule a class, meeting, or deadline.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. ADD / EDIT TASK MODAL */}
      <AnimatePresence>
        {showAddTaskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#161224] p-6 shadow-2xl shadow-purple-950/60 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>{editingTask ? 'Edit Task' : 'Create Task / Reminder'}</span>
                </h3>
                <button 
                  onClick={() => setShowAddTaskModal(false)}
                  className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTaskForm} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-200">Task Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Complete DSA assignment"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white placeholder:text-purple-400/50 focus:outline-none focus:border-pink-500 transition-all"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-purple-200">Category</label>
                    <select
                      value={taskCategory}
                      onChange={(e) => setTaskCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0e0b17] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="general">#general</option>
                      <option value="study">#study</option>
                      <option value="work">#work</option>
                      <option value="health">#health</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-purple-200">Priority</label>
                    <select
                      value={taskPriority}
                      onChange={(e) => setTaskPriority(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0e0b17] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-purple-200">Due Time</label>
                    <input
                      type="text"
                      value={taskDueTime}
                      onChange={(e) => setTaskDueTime(e.target.value)}
                      placeholder="e.g. Today, 5:00 PM"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-purple-200">Recurrence</label>
                    <select
                      value={taskRecurring}
                      onChange={(e) => setTaskRecurring(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0e0b17] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="none">None</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-pink-500/30"
                  >
                    {editingTask ? 'Update Task' : 'Save Task'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. ADD CALENDAR EVENT MODAL */}
      <AnimatePresence>
        {showAddEventModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-white/[0.12] bg-[#161224] p-6 shadow-2xl shadow-purple-950/60 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-pink-400" />
                  <span>Add Calendar Event</span>
                </h3>
                <button 
                  onClick={() => setShowAddEventModal(false)}
                  className="w-8 h-8 rounded-full bg-white/[0.05] flex items-center justify-center text-slate-300 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCalendarEvent} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">Event Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Embedded Systems Lab"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white placeholder:text-purple-400/50 focus:outline-none focus:border-pink-500"
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-purple-200">Date (YYYY-MM-DD)</label>
                    <input
                      type="date"
                      required
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0e0b17] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-purple-200">Category</label>
                    <select
                      value={eventCategory}
                      onChange={(e) => setEventCategory(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0e0b17] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-pink-500"
                    >
                      <option value="class">Class</option>
                      <option value="meeting">Meeting</option>
                      <option value="deadline">Deadline</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-purple-200">Start Time</label>
                    <input
                      type="time"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0e0b17] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-purple-200">End Time</label>
                    <input
                      type="time"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0e0b17] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">Location (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Lab 304 / Conference Room"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white placeholder:text-purple-400/50 focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-purple-200">Notes / Description (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Bring WatchOS DK and review FreeRTOS queues"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/[0.1] text-xs text-white placeholder:text-purple-400/50 focus:outline-none focus:border-pink-500 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEventModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white shadow-lg shadow-pink-500/30"
                  >
                    Save Event
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
