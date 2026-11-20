import { 
  db, 
  TaskRecord, 
  MemoryRecord, 
  FocusSessionRecord, 
  ActivityRecord
} from './db'
import { supabase, isSupabaseConfigured } from './supabase'
import { useAuthStore } from '../stores/useAuthStore'

export type SyncState = 'idle' | 'syncing' | 'synced' | 'offline' | 'error'

export interface SyncStats {
  state: SyncState
  lastSyncTime: number
  pendingCount: number
}

class SyncService {
  private syncState: SyncState = 'idle'
  private subscribers = new Set<(state: SyncState, lastSync?: number) => void>()
  private lastSyncTime: number = 0
  private isRunning = false

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.triggerSync())
      window.addEventListener('offline', () => this.updateState('offline'))

      // Periodic sync every 60s
      window.setInterval(() => {
        if (navigator.onLine && useAuthStore.getState().user) {
          this.triggerSync()
        }
      }, 60000)
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

  public async getPendingCount(): Promise<number> {
    const [pTasks, pMems, pFocus, pAct, pSet] = await Promise.all([
      db.tasks.where('syncStatus').equals('pending').count(),
      db.memories.where('syncStatus').equals('pending').count(),
      db.focusSessions.where('syncStatus').equals('pending').count(),
      db.activityLogs.where('syncStatus').equals('pending').count(),
      db.userSettings.where('syncStatus').equals('pending').count()
    ])
    return pTasks + pMems + pFocus + pAct + pSet
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
      // ----------------------------------------------------
      // 1. PUSH: Tasks
      // ----------------------------------------------------
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

      // ----------------------------------------------------
      // 2. PUSH: Memories
      // ----------------------------------------------------
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

      // ----------------------------------------------------
      // 3. PUSH: Focus Sessions
      // ----------------------------------------------------
      const pendingFocus = await db.focusSessions.where('syncStatus').equals('pending').toArray()
      for (const f of pendingFocus) {
        const payload = {
          id: f.id,
          user_id: user.id,
          title: f.title,
          duration_minutes: f.durationMinutes,
          mode: f.mode,
          completed_at: f.completedAt,
          created_at: f.createdAt,
          updated_at: f.updatedAt,
          deleted_at: f.deletedAt || null
        }
        const { error } = await supabase.from('focus_sessions').upsert(payload)
        if (!error) {
          await db.focusSessions.update(f.id, { syncStatus: 'synced' })
        }
      }

      // ----------------------------------------------------
      // 4. PUSH: Activity Logs
      // ----------------------------------------------------
      const pendingActivities = await db.activityLogs.where('syncStatus').equals('pending').toArray()
      for (const a of pendingActivities) {
        const payload = {
          id: a.id,
          user_id: user.id,
          date: a.date,
          steps: a.steps,
          step_goal: a.stepGoal,
          heart_rate_avg: a.heartRateAvg,
          calories: a.calories,
          distance_km: a.distanceKm,
          active_minutes: a.activeMinutes,
          created_at: a.createdAt,
          updated_at: a.updatedAt,
          deleted_at: a.deletedAt || null
        }
        const { error } = await supabase.from('activity_logs').upsert(payload)
        if (!error) {
          await db.activityLogs.update(a.id, { syncStatus: 'synced' })
        }
      }

      // ----------------------------------------------------
      // 5. PUSH: User Settings
      // ----------------------------------------------------
      const pendingSettings = await db.userSettings.where('syncStatus').equals('pending').toArray()
      for (const s of pendingSettings) {
        const payload = {
          user_id: user.id,
          preset: s.preset,
          mode: s.mode,
          custom_primary: s.customPrimary,
          custom_secondary: s.customSecondary,
          auto_sync: s.autoSync,
          notifications: s.notifications,
          wrist_vibrate: s.wristVibrate,
          updated_at: s.updatedAt
        }
        const { error } = await supabase.from('user_settings').upsert(payload)
        if (!error) {
          await db.userSettings.update(s.userId, { syncStatus: 'synced' })
        }
      }

      // ----------------------------------------------------
      // 6. PULL: Tasks updated since last pull
      // ----------------------------------------------------
      const lastPullMeta = await db.syncMeta.get('last_task_pull')
      const lastPullTime = Number(lastPullMeta?.value || 0)

      const { data: remoteTasks, error: taskPullError } = await supabase
        .from('tasks')
        .select('*')
        .gt('updated_at', lastPullTime)

      if (!taskPullError && remoteTasks) {
        for (const rt of remoteTasks) {
          const local = await db.tasks.get(rt.id)
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

      // ----------------------------------------------------
      // 7. PULL: Memories updated since last pull
      // ----------------------------------------------------
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

      // ----------------------------------------------------
      // 8. PULL: Focus Sessions updated since last pull
      // ----------------------------------------------------
      const lastFocusMeta = await db.syncMeta.get('last_focus_pull')
      const lastFocusPullTime = Number(lastFocusMeta?.value || 0)

      const { data: remoteFocus, error: focusPullError } = await supabase
        .from('focus_sessions')
        .select('*')
        .gt('updated_at', lastFocusPullTime)

      if (!focusPullError && remoteFocus) {
        for (const rf of remoteFocus) {
          const local = await db.focusSessions.get(rf.id)
          if (local && local.syncStatus === 'pending' && local.updatedAt > rf.updated_at) {
            continue
          }

          const localFocus: FocusSessionRecord = {
            id: rf.id,
            title: rf.title,
            durationMinutes: rf.duration_minutes,
            mode: rf.mode,
            completedAt: rf.completed_at,
            createdAt: rf.created_at,
            updatedAt: rf.updated_at,
            deletedAt: rf.deleted_at,
            syncStatus: 'synced'
          }
          await db.focusSessions.put(localFocus)
        }
        await db.syncMeta.put({ key: 'last_focus_pull', value: Date.now() })
      }

      // ----------------------------------------------------
      // 9. PULL: Activity Logs updated since last pull
      // ----------------------------------------------------
      const lastActMeta = await db.syncMeta.get('last_activity_pull')
      const lastActPullTime = Number(lastActMeta?.value || 0)

      const { data: remoteActivities, error: actPullError } = await supabase
        .from('activity_logs')
        .select('*')
        .gt('updated_at', lastActPullTime)

      if (!actPullError && remoteActivities) {
        for (const ra of remoteActivities) {
          const local = await db.activityLogs.get(ra.id)
          if (local && local.syncStatus === 'pending' && local.updatedAt > ra.updated_at) {
            continue
          }

          const localAct: ActivityRecord = {
            id: ra.id,
            date: ra.date,
            steps: ra.steps,
            stepGoal: ra.step_goal,
            heartRateAvg: ra.heart_rate_avg,
            calories: ra.calories,
            distanceKm: Number(ra.distance_km),
            activeMinutes: ra.active_minutes,
            createdAt: ra.created_at,
            updatedAt: ra.updated_at,
            deletedAt: ra.deleted_at,
            syncStatus: 'synced'
          }
          await db.activityLogs.put(localAct)
        }
        await db.syncMeta.put({ key: 'last_activity_pull', value: Date.now() })
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
