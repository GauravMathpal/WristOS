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

export interface SyncMeta {
  key: string
  value: string | number
}

const db = new Dexie('WristOSDatabase') as Dexie & {
  tasks: EntityTable<TaskRecord, 'id'>
  memories: EntityTable<MemoryRecord, 'id'>
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

export { db }
