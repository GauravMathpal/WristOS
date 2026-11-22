import { create } from 'zustand'
import { ActiveTab, ViewMode, WatchState } from '../types'
import { watchBleService } from '../lib/bleService'
import { activityRepository } from '../lib/repository'

interface AppState {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  watch: WatchState
  setWatch: (data: Partial<WatchState>) => void
  isSimulated: boolean
  lastAlertMessage: string | null
  toggleSimulation: (enabled?: boolean) => void
  addSimulatedSteps: (count: number) => void
  connectWatch: () => Promise<void>
  disconnectWatch: () => Promise<void>
  sendWatchAlert: (msg?: string) => Promise<void>
}

let simulationHeartbeat: number | null = null

export const useAppStore = create<AppState>((set, get) => ({
  viewMode: 'landing', // Default to landing page on website entry
  setViewMode: (mode) => set({ viewMode: mode }),
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  isSimulated: true, // Default to simulated mode so all features work immediately without hardware
  lastAlertMessage: null,
  watch: {
    deviceName: 'WatchOS (Virtual)',
    connectionState: 'connected',
    heartRate: 78,
    stepCount: 7842,
    batteryLevel: 94,
    lastSyncTime: Date.now()
  },

  setWatch: (data) => set((state) => ({ watch: { ...state.watch, ...data } })),

  toggleSimulation: (enabled) => {
    const nextState = enabled !== undefined ? enabled : !get().isSimulated
    if (nextState) {
      set({
        isSimulated: true,
        watch: {
          deviceName: 'WatchOS (Virtual)',
          connectionState: 'connected',
          heartRate: 78,
          stepCount: get().watch.stepCount > 0 ? get().watch.stepCount : 7842,
          batteryLevel: 94,
          lastSyncTime: Date.now()
        }
      })
    } else {
      set({
        isSimulated: false,
        watch: {
          ...get().watch,
          deviceName: 'WatchOS',
          connectionState: 'disconnected'
        }
      })
    }
  },

  addSimulatedSteps: (count: number) => {
    const currentSteps = get().watch.stepCount || 7842
    const newSteps = currentSteps + count
    set((state) => ({
      watch: {
        ...state.watch,
        stepCount: newSteps,
        lastSyncTime: Date.now()
      }
    }))
    activityRepository.recordDailyMetrics({ steps: newSteps })
  },

  connectWatch: async () => {
    set((state) => ({ watch: { ...state.watch, connectionState: 'connecting' } }))
    try {
      const name = await watchBleService.scanAndConnect(
        (telemetry) => {
          set((state) => ({
            watch: {
              ...state.watch,
              ...telemetry,
              lastSyncTime: Date.now()
            }
          }))
        },
        () => {
          window.dispatchEvent(new CustomEvent('wristos-ai-trigger'))
        }
      )
      set((state) => ({
        isSimulated: false,
        watch: {
          ...state.watch,
          connectionState: 'connected',
          deviceName: name,
          lastSyncTime: Date.now()
        }
      }))
    } catch (e: any) {
      console.warn('Physical BLE connection attempt failed:', e)
      set((state) => ({
        isSimulated: false,
        watch: {
          ...state.watch,
          connectionState: 'disconnected',
          deviceName: 'WatchOS'
        }
      }))
      throw e
    }
  },

  disconnectWatch: async () => {
    await watchBleService.disconnect()
    set((state) => ({
      isSimulated: false,
      watch: {
        ...state.watch,
        connectionState: 'disconnected',
        deviceName: 'WatchOS'
      }
    }))
  },

  sendWatchAlert: async (msg = 'WristOS Alert') => {
    // Phone haptics (works in browser & Capacitor native)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150])
      } catch {
        // Ignored if user hasn't interacted
      }
    }

    set({ lastAlertMessage: msg })
    setTimeout(() => {
      set({ lastAlertMessage: null })
    }, 4000)

    try {
      await watchBleService.sendAlert(msg)
    } catch {
      // Handled by virtual watch state
    }
  }
}))

// Start gentle realistic simulation heartbeat
if (typeof window !== 'undefined' && !simulationHeartbeat) {
  simulationHeartbeat = window.setInterval(() => {
    const state = useAppStore.getState()
    if (state.isSimulated && state.watch.connectionState === 'connected') {
      // Subtly fluctuate resting heart rate between 74 and 82 BPM
      const hrJitter = Math.floor(Math.random() * 5) - 2
      const newHr = Math.min(84, Math.max(72, state.watch.heartRate + hrJitter))
      state.setWatch({ heartRate: newHr })
    }
  }, 8000)
}
