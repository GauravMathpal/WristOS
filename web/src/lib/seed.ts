import { db, TaskRecord, MemoryRecord } from '../lib/db'

export async function seedInitialDataIfEmpty() {
  const taskCount = await db.tasks.count()
  if (taskCount === 0) {
    const initialTasks: TaskRecord[] = [
      {
        id: 't-1',
        title: 'Review InfiniTime BLE Service specifications with Group 2',
        dueTime: 'Today, 4:00 PM',
        isCompleted: false,
        createdAt: Date.now() - 3600000
      },
      {
        id: 't-2',
        title: 'Complete 10,000 steps daily activity goal',
        dueTime: 'Daily Goal',
        isCompleted: false,
        createdAt: Date.now() - 7200000
      },
      {
        id: 't-3',
        title: 'Configure Supabase Edge Function secret for Gemini API',
        dueTime: 'Tomorrow',
        isCompleted: true,
        createdAt: Date.now() - 86400000
      }
    ]
    await db.tasks.bulkAdd(initialTasks)
  }

  const memoryCount = await db.memories.count()
  if (memoryCount === 0) {
    const initialMemories: MemoryRecord[] = [
      {
        id: 'm-1',
        tag: 'Health',
        fact: 'Daily hydration goal is 3.5 liters; optimal cardio heart rate range is 125-145 BPM.',
        createdAt: Date.now() - 86400000 * 2
      },
      {
        id: 'm-2',
        tag: 'Hardware',
        fact: 'PineTime smartwatch uses Nordic nRF52832 SoC running InfiniTime firmware over BLE CTS & ANS.',
        createdAt: Date.now() - 86400000 * 3
      },
      {
        id: 'm-3',
        tag: 'Work',
        fact: 'Lead Android & AI developer for WristOS ecosystem with Dhruv as development partner.',
        createdAt: Date.now() - 86400000 * 4
      }
    ]
    await db.memories.bulkAdd(initialMemories)
  }
}
