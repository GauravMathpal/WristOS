import Dexie, { type EntityTable } from 'dexie'

export interface TaskRecord {
  id: string
  title: string
  description?: string
  dueTime: string
  isCompleted: boolean
  priority?: string // 'urgent' | 'high' | 'normal' | 'low'
  category?: string // 'work' | 'study' | 'health' | 'personal'
  isRecurring?: boolean
  recurrenceRule?: 'daily' | 'weekly'
  createdAt: number
  updatedAt: number
  deletedAt?: number | null
  syncStatus: 'synced' | 'pending' | 'failed'
}

export interface MemoryRecord {
  id: string
  tag: string
  fact: string
  createdAt: number
  updatedAt: number
  deletedAt?: number | null
  syncStatus: 'synced' | 'pending' | 'failed'
}

export interface FocusSessionRecord {
  id: string
  title: string
  durationMinutes: number
  mode: string // 'pomodoro' | 'short_break' | 'long_break' | 'stopwatch'
  completedAt: string
  createdAt: number
  updatedAt: number
  deletedAt?: number | null
  syncStatus: 'synced' | 'pending' | 'failed'
}

export interface ActivityRecord {
  id: string
  date: string // YYYY-MM-DD
  steps: number
  stepGoal: number
  heartRateAvg: number
  calories: number
  distanceKm: number
  activeMinutes: number
  createdAt: number
  updatedAt: number
  deletedAt?: number | null
  syncStatus: 'synced' | 'pending' | 'failed'
}

export interface HabitRecord {
  id: string
  title: string
  category: string // 'Health' | 'Focus' | 'Mindset' | 'Routine'
  targetDaysPerWeek: number
  streakCount: number
  completedDates: string[] // List of YYYY-MM-DD strings
  createdAt: number
  updatedAt: number
  deletedAt?: number | null
  syncStatus: 'synced' | 'pending' | 'failed'
}

export interface HydrationRecord {
  id: string
  date: string // YYYY-MM-DD
  amountMl: number
  goalMl: number
  logs: { id: string; time: string; amountMl: number }[]
  createdAt: number
  updatedAt: number
  deletedAt?: number | null
  syncStatus: 'synced' | 'pending' | 'failed'
}

export interface MedicationRecord {
  id: string
  name: string
  dosage: string // e.g. "500mg", "1 Tablet"
  scheduleTime: string // e.g. "09:00 AM"
  instructions?: string
  takenDates: string[] // list of YYYY-MM-DD
  createdAt: number
  updatedAt: number
  deletedAt?: number | null
  syncStatus: 'synced' | 'pending' | 'failed'
}

export interface CalendarEventRecord {
  id: string
  title: string
  description?: string
  date: string // YYYY-MM-DD
  startTime: string // e.g. "10:00"
  endTime: string // e.g. "11:30"
  category: 'class' | 'meeting' | 'deadline' | 'personal'
  location?: string
  createdAt: number
  updatedAt: number
  deletedAt?: number | null
  syncStatus: 'synced' | 'pending' | 'failed'
}

export interface RoutineStep {
  id: string
  label: string
  action: string // 'briefing' | 'tasks' | 'focus' | 'vibrate' | 'health'
  completed?: boolean
}

export interface RoutineRecord {
  id: string
  name: string
  type: 'morning' | 'college' | 'evening' | 'custom'
  description: string
  steps: RoutineStep[]
  isActive: boolean
  lastRunDate?: string // YYYY-MM-DD
  createdAt: number
  updatedAt: number
  deletedAt?: number | null
  syncStatus: 'synced' | 'pending' | 'failed'
}

export interface UserSettingsRecord {
  userId: string
  preset: string
  mode: string
  customPrimary: string
  customSecondary: string
  autoSync: boolean
  notifications: boolean
  wristVibrate: boolean
  ttsEnabled?: boolean
  updatedAt: number
  syncStatus: 'synced' | 'pending' | 'failed'
}

export interface SyncMeta {
  key: string
  value: string | number
}

const db = new Dexie('WristOSDatabase') as Dexie & {
  tasks: EntityTable<TaskRecord, 'id'>
  memories: EntityTable<MemoryRecord, 'id'>
  focusSessions: EntityTable<FocusSessionRecord, 'id'>
  activityLogs: EntityTable<ActivityRecord, 'id'>
  habits: EntityTable<HabitRecord, 'id'>
  hydrationLogs: EntityTable<HydrationRecord, 'id'>
  medications: EntityTable<MedicationRecord, 'id'>
  calendarEvents: EntityTable<CalendarEventRecord, 'id'>
  routines: EntityTable<RoutineRecord, 'id'>
  userSettings: EntityTable<UserSettingsRecord, 'userId'>
  syncMeta: EntityTable<SyncMeta, 'key'>
}

// Version 1: Legacy
db.version(1).stores({
  tasks: 'id, title, isCompleted, createdAt',
  memories: 'id, tag, fact, createdAt'
})

// Version 2: Added syncStatus, updatedAt, deletedAt, syncMeta
db.version(2).stores({
  tasks: 'id, title, isCompleted, createdAt, updatedAt, deletedAt, syncStatus',
  memories: 'id, tag, fact, createdAt, updatedAt, deletedAt, syncStatus',
  syncMeta: 'key'
}).upgrade((tx) => {
  const now = Date.now()
  tx.table('tasks').toCollection().modify((task) => {
    task.updatedAt = task.updatedAt || task.createdAt || now
    task.deletedAt = task.deletedAt || null
    task.syncStatus = 'pending'
  })
  tx.table('memories').toCollection().modify((memory) => {
    memory.updatedAt = memory.updatedAt || memory.createdAt || now
    memory.deletedAt = memory.deletedAt || null
    memory.syncStatus = 'pending'
  })
})

// Version 3: Expanded with Focus Sessions, Activity Logs, and User Settings
db.version(3).stores({
  tasks: 'id, title, isCompleted, createdAt, updatedAt, deletedAt, syncStatus',
  memories: 'id, tag, fact, createdAt, updatedAt, deletedAt, syncStatus',
  focusSessions: 'id, title, mode, durationMinutes, completedAt, createdAt, updatedAt, deletedAt, syncStatus',
  activityLogs: 'id, date, steps, createdAt, updatedAt, deletedAt, syncStatus',
  userSettings: 'userId, updatedAt, syncStatus',
  syncMeta: 'key'
})

// Version 4: Comprehensive WristOS Ecosystem Expansion
// Adds Habits, Hydration, Medications, Calendar Events, and Smart Routines
db.version(4).stores({
  tasks: 'id, title, isCompleted, createdAt, updatedAt, deletedAt, syncStatus',
  memories: 'id, tag, fact, createdAt, updatedAt, deletedAt, syncStatus',
  focusSessions: 'id, title, mode, durationMinutes, completedAt, createdAt, updatedAt, deletedAt, syncStatus',
  activityLogs: 'id, date, steps, createdAt, updatedAt, deletedAt, syncStatus',
  habits: 'id, title, category, streakCount, createdAt, updatedAt, deletedAt, syncStatus',
  hydrationLogs: 'id, date, amountMl, createdAt, updatedAt, deletedAt, syncStatus',
  medications: 'id, name, scheduleTime, createdAt, updatedAt, deletedAt, syncStatus',
  calendarEvents: 'id, title, date, category, createdAt, updatedAt, deletedAt, syncStatus',
  routines: 'id, name, type, isActive, createdAt, updatedAt, deletedAt, syncStatus',
  userSettings: 'userId, updatedAt, syncStatus',
  syncMeta: 'key'
})

export { db }
