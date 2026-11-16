import { create } from 'zustand'
import { ActiveTab, WatchState } from '../types'

interface AppState {
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  watch: WatchState
  setWatch: (data: Partial<WatchState>) => void
  connectWatch: () => void
  disconnectWatch: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  watch: {
    deviceName: 'PineTime',
    connectionState: 'connected',
    heartRate: 72,
    stepCount: 6840,
    batteryLevel: 88,
    lastSyncTime: Date.now()
  },
  setWatch: (data) => set((state) => ({ watch: { ...state.watch, ...data } })),
  connectWatch: () => {
    set((state) => ({ watch: { ...state.watch, connectionState: 'connecting' } }))
    setTimeout(() => {
      set((state) => ({
        watch: {
          ...state.watch,
          connectionState: 'connected',
          deviceName: 'PineTime (BLE)',
          lastSyncTime: Date.now()
        }
      }))
    }, 1200)
  },
  disconnectWatch: () => {
    set((state) => ({
      watch: {
        ...state.watch,
        connectionState: 'disconnected',
        deviceName: 'PineTime'
      }
    }))
  }
}))
