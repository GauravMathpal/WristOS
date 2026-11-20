import { 
  db, 
  TaskRecord, 
  MemoryRecord, 
  FocusSessionRecord, 
  ActivityRecord 
} from '../lib/db'

export async function seedInitialDataIfEmpty() {
  const now = Date.now()

  // 1. Seed Tasks
  const taskCount = await db.tasks.count()
  if (taskCount === 0) {
    const initialTasks: TaskRecord[] = [
      {
        id: 't-1',
        title: 'Review InfiniTime BLE Service specifications with Group 2',
        dueTime: 'Today, 4:00 PM',
        isCompleted: false,
        createdAt: now - 3600000,
        updatedAt: now - 3600000,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 't-2',
        title: 'Complete 10,000 steps daily activity goal',
        dueTime: 'Daily Goal',
        isCompleted: false,
        createdAt: now - 7200000,
        updatedAt: now - 7200000,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 't-3',
        title: 'Configure Supabase Edge Function secret for Gemini API',
        dueTime: 'Tomorrow',
        isCompleted: true,
        createdAt: now - 86400000,
        updatedAt: now - 86400000,
        deletedAt: null,
        syncStatus: 'pending'
      }
    ]
    await db.tasks.bulkAdd(initialTasks)
  }

  // 2. Seed Memories
  const memoryCount = await db.memories.count()
  if (memoryCount === 0) {
    const initialMemories: MemoryRecord[] = [
      {
        id: 'm-1',
        tag: 'Health',
        fact: 'Daily hydration goal is 3.5 liters; optimal cardio heart rate range is 125-145 BPM.',
        createdAt: now - 86400000 * 2,
        updatedAt: now - 86400000 * 2,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'm-2',
        tag: 'Hardware',
        fact: 'PineTime smartwatch uses Nordic nRF52832 SoC running InfiniTime firmware over BLE CTS & ANS.',
        createdAt: now - 86400000 * 3,
        updatedAt: now - 86400000 * 3,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'm-3',
        tag: 'Work',
        fact: 'Lead Android & AI developer for WristOS ecosystem with Dhruv as development partner.',
        createdAt: now - 86400000 * 4,
        updatedAt: now - 86400000 * 4,
        deletedAt: null,
        syncStatus: 'pending'
      }
    ]
    await db.memories.bulkAdd(initialMemories)
  }

  // 3. Seed Focus Sessions
  const focusCount = await db.focusSessions.count()
  if (focusCount === 0) {
    const initialFocus: FocusSessionRecord[] = [
      {
        id: 'f-1',
        title: 'Data Structures Revision',
        durationMinutes: 25,
        mode: 'pomodoro',
        completedAt: '10:30 AM',
        createdAt: now - 14400000,
        updatedAt: now - 14400000,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'f-2',
        title: 'C Algorithm Debugging',
        durationMinutes: 45,
        mode: 'deep_work',
        completedAt: '2:15 PM',
        createdAt: now - 7200000,
        updatedAt: now - 7200000,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'f-3',
        title: 'System Architecture Notes',
        durationMinutes: 25,
        mode: 'pomodoro',
        completedAt: '4:45 PM',
        createdAt: now - 1800000,
        updatedAt: now - 1800000,
        deletedAt: null,
        syncStatus: 'pending'
      }
    ]
    await db.focusSessions.bulkAdd(initialFocus)
  }

  // 4. Seed Activity Logs (Past 7 Days matching reference UI)
  const activityCount = await db.activityLogs.count()
  if (activityCount === 0) {
    const dayOffsets = [
      { offset: 6, steps: 4500, hr: 74 },
      { offset: 5, steps: 6500, hr: 76 },
      { offset: 4, steps: 5000, hr: 72 },
      { offset: 3, steps: 8500, hr: 80 },
      { offset: 2, steps: 9500, hr: 82 },
      { offset: 1, steps: 6000, hr: 75 },
      { offset: 0, steps: 7842, hr: 78 } // Today
    ]

    const initialActivities: ActivityRecord[] = dayOffsets.map(({ offset, steps, hr }) => {
      const d = new Date(now - offset * 86400000)
      const dateStr = d.toISOString().split('T')[0]
      return {
        id: `act-${dateStr}`,
        date: dateStr,
        steps,
        stepGoal: 10000,
        heartRateAvg: hr,
        calories: Math.round(steps * 0.04),
        distanceKm: parseFloat((steps * 0.00075).toFixed(1)),
        activeMinutes: Math.round(steps / 160),
        createdAt: now - offset * 86400000,
        updatedAt: now - offset * 86400000,
        deletedAt: null,
        syncStatus: 'pending'
      }
    })

    await db.activityLogs.bulkAdd(initialActivities)
  }
}
