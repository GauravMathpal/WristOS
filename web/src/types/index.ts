export type ActiveTab = 'dashboard' | 'assistant' | 'tasks' | 'focus' | 'health' | 'memory' | 'devices' | 'settings' | 'profile'
export type ViewMode = 'landing' | 'login' | 'app'

export interface UserProfile {
  id: string
  name: string
  email: string
  avatarColor: string
  role: string
  bio?: string
  dailyStepGoal: number
  targetHeartRate: number
  pairedWatchName: string
  createdAt: number
}

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
