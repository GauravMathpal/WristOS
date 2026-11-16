import { db, TaskRecord, MemoryRecord } from './db'
import { syncService } from './syncService'

export const taskRepository = {
  async getAllActive(): Promise<TaskRecord[]> {
    return db.tasks
      .filter((t) => !t.deletedAt)
      .reverse()
      .sortBy('createdAt')
  },

  async add(title: string, dueTime: string = 'Today'): Promise<TaskRecord> {
    const now = Date.now()
    const task: TaskRecord = {
      id: `task-${now}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      dueTime: dueTime.trim() || 'Today',
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending'
    }
    await db.tasks.add(task)
    syncService.triggerSync()
    return task
  },

  async toggleComplete(id: string): Promise<void> {
    const task = await db.tasks.get(id)
    if (!task) return
    const now = Date.now()
    await db.tasks.update(id, {
      isCompleted: !task.isCompleted,
      updatedAt: now,
      syncStatus: 'pending'
    })
    syncService.triggerSync()
  },

  async delete(id: string): Promise<void> {
    const now = Date.now()
    // Soft delete locally so the deletion replicates to Supabase
    await db.tasks.update(id, {
      deletedAt: now,
      updatedAt: now,
      syncStatus: 'pending'
    })
    syncService.triggerSync()
  }
}

export const memoryRepository = {
  async getAllActive(): Promise<MemoryRecord[]> {
    return db.memories
      .filter((m) => !m.deletedAt)
      .reverse()
      .sortBy('createdAt')
  },

  async add(tag: string, fact: string): Promise<MemoryRecord> {
    const now = Date.now()
    const memory: MemoryRecord = {
      id: `mem-${now}-${Math.random().toString(36).substring(2, 7)}`,
      tag: tag.trim() || 'General',
      fact: fact.trim(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending'
    }
    await db.memories.add(memory)
    syncService.triggerSync()
    return memory
  },

  async delete(id: string): Promise<void> {
    const now = Date.now()
    await db.memories.update(id, {
      deletedAt: now,
      updatedAt: now,
      syncStatus: 'pending'
    })
    syncService.triggerSync()
  }
}
