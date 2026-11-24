import { 
  db, 
  TaskRecord, 
  MemoryRecord, 
  FocusSessionRecord, 
  ActivityRecord,
  HabitRecord,
  HydrationRecord,
  MedicationRecord,
  CalendarEventRecord,
  RoutineRecord
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
        fact: 'WatchOS smartwatch uses Nordic nRF52832 SoC running InfiniTime firmware over BLE CTS & ANS.',
        createdAt: now - 86400000 * 3,
        updatedAt: now - 86400000 * 3,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'm-3',
        tag: 'Work',
        fact: 'Lead Android & AI developer for WristOS ecosystem with Dhruv as development partner in Group 1.',
        createdAt: now - 86400000 * 4,
        updatedAt: now - 86400000 * 4,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'm-4',
        tag: 'Team',
        fact: 'Core Project Team: Group 1 (Gaurav & Dhruv - AI/Android), Group 2 (Daksh & Atharv - Firmware/Sensors), Group 3 (Ashish, Arjun, Ravikant - Product/QA).',
        createdAt: now - 86400000 * 3,
        updatedAt: now - 86400000 * 3,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'm-5',
        tag: 'Hardware',
        fact: 'Group 2 firmware milestone: InfiniTime v1.16 compiled with FreeRTOS 10 and LVGL 7, supporting battery ADC and tap-to-clear notifications.',
        createdAt: now - 86400000 * 2,
        updatedAt: now - 86400000 * 2,
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
      { offset: 0, steps: 0, hr: 0 } // Today starts at 0 until live watch telemetry syncs
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

  const todayStr = new Date().toISOString().split('T')[0]

  // 5. Seed Habits
  const habitCount = await db.habits.count()
  if (habitCount === 0) {
    const initialHabits: HabitRecord[] = [
      {
        id: 'h-1',
        title: 'Morning Hydration (500ml)',
        category: 'Health',
        targetDaysPerWeek: 7,
        streakCount: 6,
        completedDates: [todayStr],
        createdAt: now - 86400000 * 6,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'h-2',
        title: 'Daily 10,000 Steps Goal',
        category: 'Health',
        targetDaysPerWeek: 7,
        streakCount: 5,
        completedDates: [],
        createdAt: now - 86400000 * 5,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'h-3',
        title: '30 Mins Deep Technical Reading',
        category: 'Mindset',
        targetDaysPerWeek: 5,
        streakCount: 3,
        completedDates: [],
        createdAt: now - 86400000 * 3,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'h-4',
        title: 'Evening Device Disconnect (10 PM)',
        category: 'Routine',
        targetDaysPerWeek: 7,
        streakCount: 2,
        completedDates: [],
        createdAt: now - 86400000 * 2,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'pending'
      }
    ]
    await db.habits.bulkAdd(initialHabits)
  }

  // 6. Seed Hydration Logs
  const hydrationCount = await db.hydrationLogs.count()
  if (hydrationCount === 0) {
    const initialHydration: HydrationRecord = {
      id: `hydro-${todayStr}`,
      date: todayStr,
      amountMl: 1500,
      goalMl: 2500,
      logs: [
        { id: 'hl-1', time: '08:30 AM', amountMl: 500 },
        { id: 'hl-2', time: '11:15 AM', amountMl: 500 },
        { id: 'hl-3', time: '02:30 PM', amountMl: 500 }
      ],
      createdAt: now - 18000000,
      updatedAt: now,
      deletedAt: null,
      syncStatus: 'pending'
    }
    await db.hydrationLogs.add(initialHydration)
  }

  // 7. Seed Medications
  const medCount = await db.medications.count()
  if (medCount === 0) {
    const initialMeds: MedicationRecord[] = [
      {
        id: 'med-1',
        name: 'Vitamin D3 (1000 IU)',
        dosage: '1 Capsule',
        scheduleTime: '09:00 AM',
        instructions: 'Take with morning breakfast',
        takenDates: [todayStr],
        createdAt: now - 86400000 * 7,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'med-2',
        name: 'Omega-3 Fish Oil',
        dosage: '1 Softgel',
        scheduleTime: '01:00 PM',
        instructions: 'Post lunch with water',
        takenDates: [],
        createdAt: now - 86400000 * 7,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'med-3',
        name: 'Magnesium Glycinate',
        dosage: '200mg',
        scheduleTime: '09:30 PM',
        instructions: '30 mins before sleep for recovery',
        takenDates: [],
        createdAt: now - 86400000 * 7,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'pending'
      }
    ]
    await db.medications.bulkAdd(initialMeds)
  }

  // 8. Seed Calendar Events
  const eventCount = await db.calendarEvents.count()
  if (eventCount === 0) {
    const tomorrow = new Date(now + 86400000).toISOString().split('T')[0]
    const initialEvents: CalendarEventRecord[] = [
      {
        id: 'evt-1',
        title: 'Embedded Systems & Firmware Lab',
        description: 'WatchOS ARM Cortex-M4 FreeRTOS task scheduling review',
        date: todayStr,
        startTime: '10:00',
        endTime: '11:30',
        category: 'class',
        location: 'Lab 304, Tech Block',
        createdAt: now - 86400000,
        updatedAt: now - 86400000,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'evt-2',
        title: 'AI Architecture Sync with Dhruv',
        description: 'Review Gemini 3.8 Flash live tool calling and BLE bridge',
        date: todayStr,
        startTime: '14:00',
        endTime: '15:00',
        category: 'meeting',
        location: 'Conference Room B',
        createdAt: now - 86400000,
        updatedAt: now - 86400000,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'evt-3',
        title: 'Evening Cardio & Recovery Walk',
        description: 'Hit WatchOS 10k target pace',
        date: todayStr,
        startTime: '18:30',
        endTime: '19:15',
        category: 'personal',
        location: 'Campus Sports Oval',
        createdAt: now - 86400000,
        updatedAt: now - 86400000,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'evt-4',
        title: 'Sprint 4 Final Submission & Demo',
        description: 'Final presentation of WristOS companion and LVGL firmware',
        date: tomorrow,
        startTime: '16:00',
        endTime: '17:00',
        category: 'deadline',
        location: 'Auditorium 2',
        createdAt: now - 86400000,
        updatedAt: now - 86400000,
        deletedAt: null,
        syncStatus: 'pending'
      }
    ]
    await db.calendarEvents.bulkAdd(initialEvents)
  }

  // 9. Seed Routines
  const routineCount = await db.routines.count()
  if (routineCount === 0) {
    const initialRoutines: RoutineRecord[] = [
      {
        id: 'rot-1',
        name: 'Morning Intelligence',
        type: 'morning',
        description: 'Briefing, weather update, daily tasks & activity check',
        isActive: true,
        steps: [
          { id: 's-1', label: 'Review Daily AI Briefing', action: 'briefing', completed: true },
          { id: 's-2', label: 'Check Weather & Hydration Target', action: 'health', completed: true },
          { id: 's-3', label: 'Prioritize Top 3 Daily Tasks', action: 'tasks', completed: false }
        ],
        lastRunDate: todayStr,
        createdAt: now - 86400000 * 3,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'rot-2',
        name: 'College & Focus Routine',
        type: 'college',
        description: 'Classes, assignment reminders & Pomodoro focus block',
        isActive: true,
        steps: [
          { id: 's-4', label: 'Check Class Schedule & Lab Rooms', action: 'briefing', completed: true },
          { id: 's-5', label: '25-min Pomodoro Deep Work', action: 'focus', completed: false }
        ],
        lastRunDate: todayStr,
        createdAt: now - 86400000 * 3,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'pending'
      },
      {
        id: 'rot-3',
        name: 'Evening Reflection & Sync',
        type: 'evening',
        description: 'Activity recap, habits check & watch sync',
        isActive: true,
        steps: [
          { id: 's-6', label: 'Review Step Count & Calorie Goal', action: 'health', completed: false },
          { id: 's-7', label: 'Check off completed Habits', action: 'tasks', completed: false },
          { id: 's-8', label: 'Haptic Watch Goodnight Alert', action: 'vibrate', completed: false }
        ],
        createdAt: now - 86400000 * 3,
        updatedAt: now,
        deletedAt: null,
        syncStatus: 'pending'
      }
    ]
    await db.routines.bulkAdd(initialRoutines)
  }
}
