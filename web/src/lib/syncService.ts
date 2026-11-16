import { db, TaskRecord, MemoryRecord } from './db'
import { supabase, isSupabaseConfigured } from './supabase'
import { useAuthStore } from '../stores/useAuthStore'

export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

class SyncService {
  private syncState: SyncState = 'idle'
  private subscribers = new Set<(state: SyncState, lastSync?: number) => void>()
  private lastSyncTime: number = 0
  private isRunning = false

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.triggerSync())
      window.addEventListener('offline', () => this.updateState('offline'))
    }
  }

  public subscribe(fn: (state: SyncState, lastSync?: number) => void) {
    this.subscribers.add(fn)
    fn(this.syncState, this.lastSyncTime)
    return () => this.subscribers.delete(fn)
  }

  private updateState(state: SyncState) {
    this.syncState = state
    this.subscribers.forEach((fn) => fn(state, this.lastSyncTime))
  }

  public async triggerSync(): Promise<void> {
    if (!isSupabaseConfigured) {
      this.updateState('idle')
      return
    }

    if (!navigator.onLine) {
      this.updateState('offline')
      return
    }

    const user = useAuthStore.getState().user
    if (!user) {
      this.updateState('idle')
      return
    }

    if (this.isRunning) return
    this.isRunning = true
    this.updateState('syncing')

    try {
      // 1. PUSH: Upload pending local tasks to Supabase
      const pendingTasks = await db.tasks.where('syncStatus').equals('pending').toArray()
      for (const t of pendingTasks) {
        const payload = {
          id: t.id,
          user_id: user.id,
          title: t.title,
          description: t.description || '',
          due_time: t.dueTime,
          is_completed: t.isCompleted,
          priority: t.priority || 'normal',
          category: t.category || 'general',
          created_at: t.createdAt,
          updated_at: t.updatedAt,
          deleted_at: t.deletedAt || null
        }
        const { error } = await supabase.from('tasks').upsert(payload)
        if (!error) {
          await db.tasks.update(t.id, { syncStatus: 'synced' })
        }
      }

      // 2. PUSH: Upload pending local memories to Supabase
      const pendingMemories = await db.memories.where('syncStatus').equals('pending').toArray()
      for (const m of pendingMemories) {
        const payload = {
          id: m.id,
          user_id: user.id,
          tag: m.tag,
          fact: m.fact,
          created_at: m.createdAt,
          updated_at: m.updatedAt,
          deleted_at: m.deletedAt || null
        }
        const { error } = await supabase.from('memories').upsert(payload)
        if (!error) {
          await db.memories.update(m.id, { syncStatus: 'synced' })
        }
      }

      // 3. PULL: Fetch remote tasks updated since last pull
      const lastPullMeta = await db.syncMeta.get('last_task_pull')
      const lastPullTime = Number(lastPullMeta?.value || 0)

      const { data: remoteTasks, error: taskPullError } = await supabase
        .from('tasks')
        .select('*')
        .gt('updated_at', lastPullTime)

      if (!taskPullError && remoteTasks) {
        for (const rt of remoteTasks) {
          const local = await db.tasks.get(rt.id)
          // If local has newer unsynced changes, do not overwrite (LWW)
          if (local && local.syncStatus === 'pending' && local.updatedAt > rt.updated_at) {
            continue
          }

          const localTask: TaskRecord = {
            id: rt.id,
            title: rt.title,
            description: rt.description,
            dueTime: rt.due_time,
            isCompleted: rt.is_completed,
            priority: rt.priority,
            category: rt.category,
            createdAt: rt.created_at,
            updatedAt: rt.updated_at,
            deletedAt: rt.deleted_at,
            syncStatus: 'synced'
          }
          await db.tasks.put(localTask)
        }
        await db.syncMeta.put({ key: 'last_task_pull', value: Date.now() })
      }

      // 4. PULL: Fetch remote memories updated since last pull
      const lastMemMeta = await db.syncMeta.get('last_memory_pull')
      const lastMemPullTime = Number(lastMemMeta?.value || 0)

      const { data: remoteMemories, error: memPullError } = await supabase
        .from('memories')
        .select('*')
        .gt('updated_at', lastMemPullTime)

      if (!memPullError && remoteMemories) {
        for (const rm of remoteMemories) {
          const local = await db.memories.get(rm.id)
          if (local && local.syncStatus === 'pending' && local.updatedAt > rm.updated_at) {
            continue
          }

          const localMem: MemoryRecord = {
            id: rm.id,
            tag: rm.tag,
            fact: rm.fact,
            createdAt: rm.created_at,
            updatedAt: rm.updated_at,
            deletedAt: rm.deleted_at,
            syncStatus: 'synced'
          }
          await db.memories.put(localMem)
        }
        await db.syncMeta.put({ key: 'last_memory_pull', value: Date.now() })
      }

      this.lastSyncTime = Date.now()
      this.updateState('synced')
    } catch (e) {
      console.error('WristOS Sync Error:', e)
      this.updateState('error')
    } finally {
      this.isRunning = false
    }
  }
}

export const syncService = new SyncService()
