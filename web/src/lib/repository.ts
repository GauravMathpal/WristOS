import { 
  db, 
  TaskRecord, 
  MemoryRecord, 
  FocusSessionRecord, 
  ActivityRecord,
  UserSettingsRecord,
  HabitRecord,
  HydrationRecord,
  MedicationRecord,
  CalendarEventRecord,
  RoutineRecord,
  RoutineStep
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

  async add(
    title: string, 
    dueTime: string = 'Today', 
    priority: string = 'normal', 
    category: string = 'general'
  ): Promise<TaskRecord> {
    const now = Date.now()
    const task: TaskRecord = {
      id: `task-${now}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      dueTime: dueTime.trim() || 'Today',
      isCompleted: false,
      priority,
      category,
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

  async update(id: string, tag: string, fact: string): Promise<void> {
    const now = Date.now()
    await db.memories.update(id, {
      tag: tag.trim() || 'General',
      fact: fact.trim(),
      updatedAt: now,
      syncStatus: 'pending'
    })
    syncService.triggerSync()
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
      ttsEnabled: settings.ttsEnabled ?? existing?.ttsEnabled ?? false,
      updatedAt: now,
      syncStatus: 'pending'
    }
    await db.userSettings.put(record)
    syncService.triggerSync()
  }
}

// 6. Habit Repository
export const habitRepository = {
  async getAllActive(): Promise<HabitRecord[]> {
    return db.habits
      .filter((h) => !h.deletedAt)
      .reverse()
      .sortBy('createdAt')
  },

  async add(title: string, category: string = 'Health', targetDaysPerWeek: number = 7): Promise<HabitRecord> {
    const now = Date.now()
    const habit: HabitRecord = {
      id: `habit-${now}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      category: category.trim(),
      targetDaysPerWeek,
      streakCount: 0,
      completedDates: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending'
    }
    await db.habits.add(habit)
    syncService.triggerSync()
    return habit
  },

  async toggleToday(id: string): Promise<void> {
    const habit = await db.habits.get(id)
    if (!habit) return
    const todayStr = new Date().toISOString().split('T')[0]
    const now = Date.now()
    const isCompletedToday = habit.completedDates.includes(todayStr)

    let updatedDates: string[]
    let updatedStreak = habit.streakCount

    if (isCompletedToday) {
      updatedDates = habit.completedDates.filter(d => d !== todayStr)
      updatedStreak = Math.max(0, updatedStreak - 1)
    } else {
      updatedDates = [...habit.completedDates, todayStr]
      updatedStreak += 1
    }

    await db.habits.update(id, {
      completedDates: updatedDates,
      streakCount: updatedStreak,
      updatedAt: now,
      syncStatus: 'pending'
    })
    syncService.triggerSync()
  },

  async delete(id: string): Promise<void> {
    const now = Date.now()
    await db.habits.update(id, {
      deletedAt: now,
      updatedAt: now,
      syncStatus: 'pending'
    })
    syncService.triggerSync()
  }
}

// 7. Hydration Repository
export const hydrationRepository = {
  async getToday(): Promise<HydrationRecord | undefined> {
    const todayStr = new Date().toISOString().split('T')[0]
    return db.hydrationLogs.where('date').equals(todayStr).first()
  },

  async addIntake(amountMl: number): Promise<HydrationRecord> {
    const todayStr = new Date().toISOString().split('T')[0]
    const now = Date.now()
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const existing = await db.hydrationLogs.where('date').equals(todayStr).first()

    const newLogItem = {
      id: `hydro-log-${now}-${Math.random().toString(36).substring(2, 6)}`,
      time: timeStr,
      amountMl
    }

    if (existing) {
      const updated: HydrationRecord = {
        ...existing,
        amountMl: existing.amountMl + amountMl,
        logs: [...existing.logs, newLogItem],
        updatedAt: now,
        syncStatus: 'pending'
      }
      await db.hydrationLogs.put(updated)
      syncService.triggerSync()
      return updated
    } else {
      const newRecord: HydrationRecord = {
        id: `hydro-${todayStr}`,
        date: todayStr,
        amountMl,
        goalMl: 2500,
        logs: [newLogItem],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'pending'
      }
      await db.hydrationLogs.add(newRecord)
      syncService.triggerSync()
      return newRecord
    }
  },

  async setGoal(goalMl: number): Promise<void> {
    const todayStr = new Date().toISOString().split('T')[0]
    const now = Date.now()
    const existing = await db.hydrationLogs.where('date').equals(todayStr).first()
    if (existing) {
      await db.hydrationLogs.update(existing.id, {
        goalMl,
        updatedAt: now,
        syncStatus: 'pending'
      })
    } else {
      await db.hydrationLogs.add({
        id: `hydro-${todayStr}`,
        date: todayStr,
        amountMl: 0,
        goalMl,
        logs: [],
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'pending'
      })
    }
    syncService.triggerSync()
  },

  async getWeeklyLogs(): Promise<HydrationRecord[]> {
    return db.hydrationLogs
      .filter((h) => !h.deletedAt)
      .sortBy('date')
  }
}

// 8. Medication Repository
export const medicationRepository = {
  async getAllActive(): Promise<MedicationRecord[]> {
    return db.medications
      .filter((m) => !m.deletedAt)
      .sortBy('scheduleTime')
  },

  async add(name: string, dosage: string, scheduleTime: string, instructions?: string): Promise<MedicationRecord> {
    const now = Date.now()
    const med: MedicationRecord = {
      id: `med-${now}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      dosage: dosage.trim(),
      scheduleTime: scheduleTime.trim(),
      instructions: instructions?.trim() || '',
      takenDates: [],
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending'
    }
    await db.medications.add(med)
    syncService.triggerSync()
    return med
  },

  async toggleTaken(id: string, dateStr?: string): Promise<void> {
    const med = await db.medications.get(id)
    if (!med) return
    const targetDate = dateStr || new Date().toISOString().split('T')[0]
    const now = Date.now()
    const isTaken = med.takenDates.includes(targetDate)

    const updatedTakenDates = isTaken
      ? med.takenDates.filter(d => d !== targetDate)
      : [...med.takenDates, targetDate]

    await db.medications.update(id, {
      takenDates: updatedTakenDates,
      updatedAt: now,
      syncStatus: 'pending'
    })
    syncService.triggerSync()
  },

  async delete(id: string): Promise<void> {
    const now = Date.now()
    await db.medications.update(id, {
      deletedAt: now,
      updatedAt: now,
      syncStatus: 'pending'
    })
    syncService.triggerSync()
  }
}

// 9. Calendar Repository
export const calendarRepository = {
  async getAllActive(): Promise<CalendarEventRecord[]> {
    return db.calendarEvents
      .filter((e) => !e.deletedAt)
      .sortBy('date')
  },

  async getForDate(dateStr: string): Promise<CalendarEventRecord[]> {
    return db.calendarEvents
      .where('date')
      .equals(dateStr)
      .filter((e) => !e.deletedAt)
      .sortBy('startTime')
  },

  async getUpcoming(limit: number = 5): Promise<CalendarEventRecord[]> {
    const todayStr = new Date().toISOString().split('T')[0]
    return (await db.calendarEvents
      .filter((e) => !e.deletedAt && e.date >= todayStr)
      .sortBy('date')).slice(0, limit)
  },

  async add(
    title: string, 
    date: string, 
    startTime: string, 
    endTime: string, 
    category: 'class' | 'meeting' | 'deadline' | 'personal' = 'meeting',
    location?: string,
    description?: string
  ): Promise<CalendarEventRecord> {
    const now = Date.now()
    const event: CalendarEventRecord = {
      id: `evt-${now}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim(),
      description: description?.trim() || '',
      date: date.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim(),
      category,
      location: location?.trim() || '',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending'
    }
    await db.calendarEvents.add(event)
    syncService.triggerSync()
    return event
  },

  async delete(id: string): Promise<void> {
    const now = Date.now()
    await db.calendarEvents.update(id, {
      deletedAt: now,
      updatedAt: now,
      syncStatus: 'pending'
    })
    syncService.triggerSync()
  }
}

// 10. Routine Repository
export const routineRepository = {
  async getAllActive(): Promise<RoutineRecord[]> {
    return db.routines
      .filter((r) => !r.deletedAt)
      .sortBy('createdAt')
  },

  async add(
    name: string,
    type: 'morning' | 'college' | 'evening' | 'custom',
    description: string,
    steps: RoutineStep[]
  ): Promise<RoutineRecord> {
    const now = Date.now()
    const routine: RoutineRecord = {
      id: `routine-${now}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      type,
      description: description.trim(),
      steps,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending'
    }
    await db.routines.add(routine)
    syncService.triggerSync()
    return routine
  },

  async toggleStep(routineId: string, stepId: string): Promise<void> {
    const routine = await db.routines.get(routineId)
    if (!routine) return
    const now = Date.now()
    const updatedSteps = routine.steps.map(step => 
      step.id === stepId ? { ...step, completed: !step.completed } : step
    )
    await db.routines.update(routineId, {
      steps: updatedSteps,
      updatedAt: now,
      syncStatus: 'pending'
    })
    syncService.triggerSync()
  },

  async executeRoutine(id: string): Promise<{ success: boolean; executedSteps: string[] }> {
    const routine = await db.routines.get(id)
    if (!routine) return { success: false, executedSteps: [] }
    const now = Date.now()
    const todayStr = new Date().toISOString().split('T')[0]
    const updatedSteps = routine.steps.map(s => ({ ...s, completed: true }))
    
    await db.routines.update(id, {
      steps: updatedSteps,
      lastRunDate: todayStr,
      updatedAt: now,
      syncStatus: 'pending'
    })
    syncService.triggerSync()
    return {
      success: true,
      executedSteps: routine.steps.map(s => s.label)
    }
  },

  async delete(id: string): Promise<void> {
    const now = Date.now()
    await db.routines.update(id, {
      deletedAt: now,
      updatedAt: now,
      syncStatus: 'pending'
    })
    syncService.triggerSync()
  }
}
