import { 
  db, 
  TaskRecord, 
  MemoryRecord, 
  FocusSessionRecord, 
  ActivityRecord,
  UserSettingsRecord 
} from './db'
import { syncService } from './syncService'

// 1. Task Repository
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
    await db.tasks.update(id, {
      deletedAt: now,
      updatedAt: now,
      syncStatus: 'pending'
    })
    syncService.triggerSync()
  }
}

// 2. Memory Repository
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

// 3. Focus Repository
export const focusRepository = {
  async getAllActive(): Promise<FocusSessionRecord[]> {
    return db.focusSessions
      .filter((f) => !f.deletedAt)
      .reverse()
      .sortBy('createdAt')
  },

  async add(title: string, durationMinutes: number, mode: string = 'pomodoro'): Promise<FocusSessionRecord> {
    const now = Date.now()
    const session: FocusSessionRecord = {
      id: `focus-${now}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      durationMinutes,
      mode,
      completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending'
    }
    await db.focusSessions.add(session)
    syncService.triggerSync()
    return session
  },

  async delete(id: string): Promise<void> {
    const now = Date.now()
    await db.focusSessions.update(id, {
      deletedAt: now,
      updatedAt: now,
      syncStatus: 'pending'
    })
    syncService.triggerSync()
  }
}

// 4. Activity Repository (Health & Biometrics)
export const activityRepository = {
  async getToday(): Promise<ActivityRecord | undefined> {
    const todayStr = new Date().toISOString().split('T')[0]
    return db.activityLogs.where('date').equals(todayStr).first()
  },

  async getWeekly(): Promise<ActivityRecord[]> {
    return db.activityLogs
      .filter((a) => !a.deletedAt)
      .sortBy('date')
  },

  async recordDailyMetrics(metrics: Partial<ActivityRecord>): Promise<ActivityRecord> {
    const todayStr = new Date().toISOString().split('T')[0]
    const existing = await db.activityLogs.where('date').equals(todayStr).first()
    const now = Date.now()

    if (existing) {
      const updated: ActivityRecord = {
        ...existing,
        ...metrics,
        updatedAt: now,
        syncStatus: 'pending'
      }
      await db.activityLogs.put(updated)
      syncService.triggerSync()
      return updated
    } else {
      const newRecord: ActivityRecord = {
        id: `act-${todayStr}`,
        date: todayStr,
        steps: metrics.steps ?? 0,
        stepGoal: metrics.stepGoal ?? 10000,
        heartRateAvg: metrics.heartRateAvg ?? 72,
        calories: metrics.calories ?? Math.round((metrics.steps ?? 0) * 0.04),
        distanceKm: metrics.distanceKm ?? parseFloat(((metrics.steps ?? 0) * 0.00075).toFixed(1)),
        activeMinutes: metrics.activeMinutes ?? Math.round((metrics.steps ?? 0) / 160),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'pending'
      }
      await db.activityLogs.add(newRecord)
      syncService.triggerSync()
      return newRecord
    }
  }
}

// 5. User Settings Repository
export const userSettingsRepository = {
  async get(userId: string): Promise<UserSettingsRecord | undefined> {
    return db.userSettings.get(userId)
  },

  async save(settings: Partial<UserSettingsRecord> & { userId: string }): Promise<void> {
    const now = Date.now()
    const existing = await db.userSettings.get(settings.userId)
    const record: UserSettingsRecord = {
      userId: settings.userId,
      preset: settings.preset ?? existing?.preset ?? 'aurora',
      mode: settings.mode ?? existing?.mode ?? 'dark',
      customPrimary: settings.customPrimary ?? existing?.customPrimary ?? '#A855F7',
      customSecondary: settings.customSecondary ?? existing?.customSecondary ?? '#EC4899',
      autoSync: settings.autoSync ?? existing?.autoSync ?? true,
      notifications: settings.notifications ?? existing?.notifications ?? true,
      wristVibrate: settings.wristVibrate ?? existing?.wristVibrate ?? true,
      geminiApiKey: settings.geminiApiKey ?? existing?.geminiApiKey ?? '',
      updatedAt: now,
      syncStatus: 'pending'
    }
    await db.userSettings.put(record)
    syncService.triggerSync()
  }
}
