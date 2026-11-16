import { create } from 'zustand'
import { ActiveTab, WatchState } from '../types'
import { watchBleService } from '../lib/bleService'

interface AppState {
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  watch: WatchState
  setWatch: (data: Partial<WatchState>) => void
  connectWatch: () => Promise<void>
  disconnectWatch: () => Promise<void>
  sendWatchAlert: (msg?: string) => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  watch: {
    deviceName: 'PineTime',
    connectionState: 'disconnected',
    heartRate: 0,
    stepCount: 0,
    batteryLevel: 0,
    lastSyncTime: null
  },
  setWatch: (data) => set((state) => ({ watch: { ...state.watch, ...data } })),
  connectWatch: async () => {
    set((state) => ({ watch: { ...state.watch, connectionState: 'connecting' } }))
    try {
      const name = await watchBleService.scanAndConnect((telemetry) => {
        set((state) => ({
          watch: {
            ...state.watch,
            ...telemetry,
            lastSyncTime: Date.now()
          }
        }))
      })
      set((state) => ({
        watch: {
          ...state.watch,
          connectionState: 'connected',
          deviceName: name,
          lastSyncTime: Date.now()
        }
      }))
    } catch (e) {
      console.error(e)
      set((state) => ({ watch: { ...state.watch, connectionState: 'disconnected' } }))
    }
  },
  disconnectWatch: async () => {
    await watchBleService.disconnect()
    set((state) => ({
      watch: {
        ...state.watch,
        connectionState: 'disconnected',
        deviceName: 'PineTime'
      }
    }))
  },
  sendWatchAlert: async (msg = 'WristOS Alert') => {
    await watchBleService.sendAlert(msg)
  }
}))
