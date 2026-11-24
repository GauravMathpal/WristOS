import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '../stores/useAppStore'
import { UserProfile } from '../types'

describe('useAppStore - Authentication & Ecosystem State', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('loads all 7 project team members by default', () => {
    const state = useAppStore.getState()
    expect(state.allUsers.length).toBeGreaterThanOrEqual(7)
    
    const names = state.allUsers.map(u => u.name)
    expect(names).toContain('Gaurav Mathpal')
    expect(names).toContain('Dhruv')
    expect(names).toContain('Daksh')
    expect(names).toContain('Atharv')
    expect(names).toContain('Ashish')
    expect(names).toContain('Arjun')
    expect(names).toContain('Ravikant')
  })

  it('handles loginUser correctly and switches viewMode to app', () => {
    const testUser: UserProfile = {
      id: 'usr-test-1',
      name: 'Tester Person',
      email: 'test@wristos.com',
      avatarColor: 'from-purple-500 to-pink-500',
      role: 'Test Specialist',
      dailyStepGoal: 8500,
      targetHeartRate: 70,
      pairedWatchName: 'WatchOS BLE Primary',
      createdAt: Date.now()
    }

    useAppStore.getState().loginUser(testUser)
    const state = useAppStore.getState()

    expect(state.currentUser?.id).toBe('usr-test-1')
    expect(state.currentUser?.name).toBe('Tester Person')
    expect(state.isAuthenticated).toBe(true)
    expect(state.viewMode).toBe('app')
    expect(state.activeTab).toBe('dashboard')
  })

  it('handles logoutUser cleanly', () => {
    useAppStore.getState().logoutUser()
    const state = useAppStore.getState()

    expect(state.currentUser).toBeNull()
    expect(state.isAuthenticated).toBe(false)
    expect(state.viewMode).toBe('landing')
  })

  it('registers a new user and appends to allUsers list', () => {
    const newUser = useAppStore.getState().registerUser({
      name: 'New Engineer',
      email: 'new@wristos.com',
      avatarColor: 'from-cyan-500 to-blue-500',
      role: 'Firmware Contributor',
      dailyStepGoal: 11000,
      targetHeartRate: 74,
      pairedWatchName: 'WatchOS BLE Primary'
    })

    const state = useAppStore.getState()
    expect(newUser.id).toBeDefined()
    expect(newUser.name).toBe('New Engineer')
    expect(state.allUsers.some(u => u.email === 'new@wristos.com')).toBe(true)
  })

  it('triggers watch AI remotely and transitions to assistant view', () => {
    let eventFired = false
    const handler = () => { eventFired = true }
    window.addEventListener('wristos-ai-trigger', handler)

    useAppStore.getState().triggerWatchAiRemotely()
    const state = useAppStore.getState()

    expect(state.activeTab).toBe('assistant')
    expect(state.viewMode).toBe('app')
    expect(eventFired).toBe(true)

    window.removeEventListener('wristos-ai-trigger', handler)
  })

  it('adds simulated steps accurately', () => {
    const initialSteps = useAppStore.getState().watch.stepCount
    useAppStore.getState().addSimulatedSteps(500)
    const updatedSteps = useAppStore.getState().watch.stepCount

    expect(updatedSteps).toBe(initialSteps + 500)
  })
})
