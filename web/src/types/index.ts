export type ActiveTab = 'dashboard' | 'assistant' | 'tasks' | 'focus' | 'health' | 'memory' | 'devices' | 'settings'
export type ViewMode = 'landing' | 'login' | 'app'

export interface Task {
  id: string
  title: string
  dueTime: string
  isCompleted: boolean
  createdAt: number
}

export interface Memory {
  id: string
  tag: string
  fact: string
  createdAt: number
}

export interface WatchState {
  deviceName: string
  connectionState: 'disconnected' | 'scanning' | 'connecting' | 'connected'
  heartRate: number
  stepCount: number
  batteryLevel: number
  lastSyncTime: number | null
}
