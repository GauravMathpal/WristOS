import Dexie, { type EntityTable } from 'dexie'

export interface TaskRecord {
  id: string
  title: string
  dueTime: string
  isCompleted: boolean
  createdAt: number
}

export interface MemoryRecord {
  id: string
  tag: string
  fact: string
  createdAt: number
}

const db = new Dexie('WristOSDatabase') as Dexie & {
  tasks: EntityTable<TaskRecord, 'id'>
  memories: EntityTable<MemoryRecord, 'id'>
}

// Schema definition
db.version(1).stores({
  tasks: 'id, title, isCompleted, createdAt',
  memories: 'id, tag, fact, createdAt'
})

export { db }
