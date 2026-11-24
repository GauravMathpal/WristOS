import { describe, it, expect, beforeEach } from 'vitest'
import { useThemeStore } from '../stores/useThemeStore'

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('defaults to dark mode', () => {
    const state = useThemeStore.getState()
    expect(state.mode).toBe('dark')
  })

  it('updates theme mode and saves to localStorage', () => {
    useThemeStore.getState().setMode('light')
    expect(useThemeStore.getState().mode).toBe('light')
    const saved = JSON.parse(localStorage.getItem('wristos_theme_preferences') || '{}')
    expect(saved.mode).toBe('light')

    useThemeStore.getState().setMode('system')
    expect(useThemeStore.getState().mode).toBe('system')

    useThemeStore.getState().setMode('dark')
    expect(useThemeStore.getState().mode).toBe('dark')
  })
})
