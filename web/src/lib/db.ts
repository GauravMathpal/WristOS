import Dexie, { type EntityTable } from 'dexie'

export interface TaskRecord {
  id: string
  title: string
  description?: string
  dueTime: string
  isCompleted: boolean
  priority?: string
  category?: string
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
  mode: string
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

export { db }
