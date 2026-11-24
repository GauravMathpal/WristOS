import { create } from 'zustand'
import { ActiveTab, ViewMode, WatchState, UserProfile } from '../types'
import { watchBleService } from '../lib/bleService'
import { activityRepository } from '../lib/repository'

export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'user-1',
    name: 'Gaurav Mathpal',
    email: 'gaurav@wristos.com',
    avatarColor: 'from-purple-500 via-fuchsia-500 to-pink-500',
    role: 'Lead Systems Architect & Creator (Group 1: AI & App)',
    bio: 'Architecting the WristOS ambient intelligence ecosystem, companion Android app, Gemini AI integration, and BLE bridge.',
    dailyStepGoal: 10000,
    targetHeartRate: 72,
    pairedWatchName: 'Gaurav’s WristOS Watch',
    createdAt: 1700000000000
  },
  {
    id: 'user-2',
    name: 'Dhruv',
    email: 'dhruv@wristos.com',
    avatarColor: 'from-indigo-500 via-purple-500 to-pink-500',
    role: 'AI & Android Development Lead (Group 1: AI & App)',
    bio: 'Specializing in Kotlin Jetpack Compose, Room database synchronization, and Gemini AI assistant pipeline.',
    dailyStepGoal: 11000,
    targetHeartRate: 70,
    pairedWatchName: 'Dhruv’s WristOS Pro',
    createdAt: 1700100000000
  },
  {
    id: 'user-3',
    name: 'Daksh',
    email: 'daksh@wristos.com',
    avatarColor: 'from-cyan-500 via-teal-500 to-blue-600',
    role: 'Embedded Firmware Lead (Group 2: Watch & Firmware)',
    bio: 'Leading InfiniTime C++ firmware development on Nordic nRF52832, FreeRTOS tasks, and LVGL display drivers.',
    dailyStepGoal: 10000,
    targetHeartRate: 68,
    pairedWatchName: 'Daksh’s PineTime Dev',
    createdAt: 1700200000000
  },
  {
    id: 'user-4',
    name: 'Atharv',
    email: 'atharv@wristos.com',
    avatarColor: 'from-emerald-500 via-teal-500 to-cyan-600',
    role: 'Sensors, BLE Protocol & Display (Group 2: Watch & Firmware)',
    bio: 'Optimizing Everlight HRS3300 optical heart rate sensor, BMA421 accelerometer step counting, and BLE GATT services.',
    dailyStepGoal: 12000,
    targetHeartRate: 65,
    pairedWatchName: 'Atharv’s WristOS BLE',
    createdAt: 1700300000000
  },
  {
    id: 'user-5',
    name: 'Ashish',
    email: 'ashish@wristos.com',
    avatarColor: 'from-amber-500 via-orange-500 to-rose-500',
    role: 'Product Co-Lead & Quality Assurance (Group 3: Product & QA)',
    bio: 'Directing end-to-end product verification, Bluetooth sync test harnesses, and presentation quality control.',
    dailyStepGoal: 9500,
    targetHeartRate: 74,
    pairedWatchName: 'Ashish’s WatchOS',
    createdAt: 1700400000000
  },
  {
    id: 'user-6',
    name: 'Arjun',
    email: 'arjun@wristos.com',
    avatarColor: 'from-violet-500 via-fuchsia-500 to-rose-500',
    role: 'UI/UX Research & Systems QA (Group 3: Product & QA)',
    bio: 'Designing glanceable smartwatch typography, testing multi-screen touch interactions, and user experience research.',
    dailyStepGoal: 10500,
    targetHeartRate: 72,
    pairedWatchName: 'Arjun’s PineTime',
    createdAt: 1700500000000
  },
  {
    id: 'user-7',
    name: 'Ravikant',
    email: 'ravikant@wristos.com',
    avatarColor: 'from-rose-500 via-pink-500 to-orange-500',
    role: 'Documentation & Ecosystem Testing (Group 3: Product & QA)',
    bio: 'Maintaining hardware and BLE specifications, developer documentation, and firmware test suite execution.',
    dailyStepGoal: 9000,
    targetHeartRate: 75,
    pairedWatchName: 'Ravikant’s WristOS',
    createdAt: 1700600000000
  }
]

const loadSavedUsers = (): UserProfile[] => {
  if (typeof window === 'undefined') return DEFAULT_USERS
  try {
    const raw = localStorage.getItem('wristos_users_list')
    if (raw) {
      const parsed = JSON.parse(raw)
      // Check if localStorage has outdated demo profiles like 'Sarah Connor' or 'Alex Rivera'
      const hasOutdatedUsers = Array.isArray(parsed) && parsed.some((u: any) => u.name === 'Sarah Connor' || u.name === 'Alex Rivera')
      // Ensure real team members are present
      if (!hasOutdatedUsers && Array.isArray(parsed) && parsed.length >= 7) {
        return parsed
      }
    }
    localStorage.setItem('wristos_users_list', JSON.stringify(DEFAULT_USERS))
  } catch (_) {}
  return DEFAULT_USERS
}

const loadSavedCurrentUser = (users: UserProfile[]): UserProfile | null => {
  if (typeof window === 'undefined') return DEFAULT_USERS[0]
  try {
    const currentId = localStorage.getItem('wristos_active_user_id')
    if (currentId) {
      const found = users.find(u => u.id === currentId)
      if (found) return found
    }
  } catch (_) {}
  return users[0] || DEFAULT_USERS[0]
}

const initialUsers = loadSavedUsers()
const initialCurrentUser = loadSavedCurrentUser(initialUsers)

interface AppState {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void
  activeTab: ActiveTab
  setActiveTab: (tab: ActiveTab) => void
  currentUser: UserProfile | null
  isAuthenticated: boolean
  allUsers: UserProfile[]
  loginUser: (user: UserProfile) => void
  logoutUser: () => void
  registerUser: (newUser: Omit<UserProfile, 'id' | 'createdAt'>) => UserProfile
  updateCurrentUser: (updates: Partial<UserProfile>) => void
  switchUser: (userId: string) => void
  watch: WatchState
  setWatch: (data: Partial<WatchState>) => void
  isSimulated: boolean
  lastAlertMessage: string | null
  toggleSimulation: (enabled?: boolean) => void
  addSimulatedSteps: (count: number) => void
  connectWatch: () => Promise<void>
  disconnectWatch: () => Promise<void>
  syncWatchTelemetry: () => Promise<void>
  sendWatchAlert: (msg?: string) => Promise<void>
  triggerWatchAiRemotely: () => void
}

let simulationHeartbeat: number | null = null

export const useAppStore = create<AppState>((set, get) => ({
  viewMode: 'landing', // Default to landing page on website entry
  setViewMode: (mode) => set({ viewMode: mode }),
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),
  currentUser: initialCurrentUser,
  isAuthenticated: Boolean(initialCurrentUser),
  allUsers: initialUsers,

  loginUser: (user: UserProfile) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('wristos_active_user_id', user.id)
    }
    set({
      currentUser: user,
      isAuthenticated: true,
      viewMode: 'app',
      activeTab: 'dashboard'
    })
  },

  logoutUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('wristos_active_user_id')
    }
    set({
      currentUser: null,
      isAuthenticated: false,
      viewMode: 'landing',
      activeTab: 'dashboard'
    })
  },

  registerUser: (newUser) => {
    const user: UserProfile = {
      ...newUser,
      id: `user-${Date.now()}`,
      createdAt: Date.now()
    }
    const updatedUsers = [...get().allUsers, user]
    if (typeof window !== 'undefined') {
      localStorage.setItem('wristos_users_list', JSON.stringify(updatedUsers))
      localStorage.setItem('wristos_active_user_id', user.id)
    }
    set({
      allUsers: updatedUsers,
      currentUser: user,
      isAuthenticated: true,
      viewMode: 'app',
      activeTab: 'dashboard'
    })
    return user
  },

  updateCurrentUser: (updates) => {
    const current = get().currentUser
    if (!current) return
    const updated = { ...current, ...updates }
    const updatedUsers = get().allUsers.map(u => u.id === updated.id ? updated : u)
    if (typeof window !== 'undefined') {
      localStorage.setItem('wristos_users_list', JSON.stringify(updatedUsers))
    }
    set({
      currentUser: updated,
      allUsers: updatedUsers
    })
  },

  switchUser: (userId) => {
    const target = get().allUsers.find(u => u.id === userId)
    if (target) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('wristos_active_user_id', target.id)
      }
      set({
        currentUser: target,
        isAuthenticated: true,
        activeTab: 'dashboard'
      })
    }
  },

  isSimulated: false, // Default to real device connection
  lastAlertMessage: null,
  watch: {
    deviceName: 'WatchOS',
    connectionState: 'disconnected',
    heartRate: 0,
    stepCount: 0,
    batteryLevel: 100,
    lastSyncTime: null
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
          stepCount: get().watch.stepCount > 0 ? get().watch.stepCount : 1250,
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
    const currentSteps = get().watch.stepCount || 0
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
    set((state) => ({ 
      watch: { 
        ...state.watch, 
        connectionState: 'connecting' 
      } 
    }))
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
          // Live sync real telemetry into Dexie activity repository
          const steps = telemetry.stepCount !== undefined ? telemetry.stepCount : get().watch.stepCount
          const hr = telemetry.heartRate !== undefined ? telemetry.heartRate : get().watch.heartRate
          if (steps > 0 || hr > 0) {
            activityRepository.recordDailyMetrics({
              steps,
              stepGoal: get().currentUser?.dailyStepGoal || 10000,
              heartRateAvg: hr > 0 ? hr : undefined,
              calories: Math.round(steps * 0.04),
              distanceKm: parseFloat((steps * 0.00075).toFixed(2))
            }).catch(console.warn)
          }
        },
        () => {
          set({ activeTab: 'assistant', viewMode: 'app' })
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('wristos-ai-trigger'))
          }
        },
        () => {
          set((state) => ({
            isSimulated: false,
            watch: {
              ...state.watch,
              connectionState: 'disconnected'
            }
          }))
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
      // Actively pull fresh telemetry once connected
      try {
        const fresh = await watchBleService.readTelemetry()
        if (fresh.stepCount !== undefined || fresh.batteryLevel !== undefined) {
          set((state) => ({
            watch: {
              ...state.watch,
              ...fresh,
              lastSyncTime: Date.now()
            }
          }))
          if (fresh.stepCount !== undefined) {
            await activityRepository.recordDailyMetrics({
              steps: fresh.stepCount,
              stepGoal: get().currentUser?.dailyStepGoal || 10000,
              calories: Math.round(fresh.stepCount * 0.04),
              distanceKm: parseFloat((fresh.stepCount * 0.00075).toFixed(2))
            })
          }
        }
      } catch (pollErr) {
        console.warn('Initial post-connect telemetry poll:', pollErr)
      }
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

  syncWatchTelemetry: async () => {
    if (get().watch.connectionState !== 'connected') {
      await get().connectWatch()
      return
    }
    try {
      const fresh = await watchBleService.readTelemetry()
      set((state) => ({
        watch: {
          ...state.watch,
          ...fresh,
          lastSyncTime: Date.now()
        }
      }))
      const steps = fresh.stepCount !== undefined ? fresh.stepCount : get().watch.stepCount
      const hr = fresh.heartRate !== undefined ? fresh.heartRate : get().watch.heartRate
      await activityRepository.recordDailyMetrics({
        steps,
        stepGoal: get().currentUser?.dailyStepGoal || 10000,
        heartRateAvg: hr > 0 ? hr : undefined,
        calories: Math.round(steps * 0.04),
        distanceKm: parseFloat((steps * 0.00075).toFixed(2))
      })
    } catch (e) {
      console.warn('Sync watch telemetry failed:', e)
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
  },

  triggerWatchAiRemotely: () => {
    set({ activeTab: 'assistant', viewMode: 'app' })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('wristos-ai-trigger'))
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
