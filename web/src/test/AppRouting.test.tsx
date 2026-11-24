import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { App } from '../App'
import { useAppStore } from '../stores/useAppStore'

describe('App Top-Level Routing & Auth Guard', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders LandingPage when viewMode is landing', () => {
    useAppStore.setState({
      viewMode: 'landing',
      currentUser: null,
      isAuthenticated: false
    })

    render(<App />)
    expect(screen.getByText(/Your Personal Intelligence/i)).toBeInTheDocument()
  })

  it('renders LoginScreen when viewMode is login', () => {
    useAppStore.setState({
      viewMode: 'login',
      currentUser: null,
      isAuthenticated: false
    })

    render(<App />)
    expect(screen.getByText('WristOS Portal')).toBeInTheDocument()
    expect(screen.getByText('Select Your Team Profile')).toBeInTheDocument()
  })

  it('guards companion application and forces LoginScreen if user is unauthenticated', () => {
    useAppStore.setState({
      viewMode: 'app',
      currentUser: null,
      isAuthenticated: false
    })

    render(<App />)
    expect(screen.getByText('WristOS Portal')).toBeInTheDocument()
  })

  it('renders dashboard screen when user is authenticated in app mode', () => {
    const demoUser = useAppStore.getState().allUsers[0]
    useAppStore.setState({
      viewMode: 'app',
      currentUser: demoUser,
      isAuthenticated: true,
      activeTab: 'dashboard'
    })

    render(<App />)
    expect(screen.getByText('AI Assistant')).toBeInTheDocument()
    expect(screen.getByText('My Profile')).toBeInTheDocument()
  })
})
