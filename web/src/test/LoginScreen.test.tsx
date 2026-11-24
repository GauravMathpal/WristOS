import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginScreen } from '../components/LoginScreen'
import { useAppStore } from '../stores/useAppStore'

describe('LoginScreen Component', () => {
  beforeEach(() => {
    localStorage.clear()
    useAppStore.setState({
      currentUser: null,
      isAuthenticated: false,
      viewMode: 'login'
    })
  })

  it('renders the portal title and authentication header', () => {
    render(<LoginScreen />)
    expect(screen.getByText('WristOS Portal')).toBeInTheDocument()
    expect(screen.getByText('Select Your Team Profile')).toBeInTheDocument()
  })

  it('displays team member profiles in Profiles tab', () => {
    render(<LoginScreen />)
    expect(screen.getByText('Gaurav Mathpal')).toBeInTheDocument()
    expect(screen.getByText('Dhruv')).toBeInTheDocument()
    expect(screen.getByText('Daksh')).toBeInTheDocument()
  })

  it('filters profiles in real time when typing in search bar', () => {
    render(<LoginScreen />)
    const searchInput = screen.getByPlaceholderText('Filter team...')
    
    fireEvent.change(searchInput, { target: { value: 'Gaurav' } })
    expect(screen.getByText('Gaurav Mathpal')).toBeInTheDocument()
    expect(screen.queryByText('Atharv')).not.toBeInTheDocument()
  })

  it('switches between auth tabs cleanly', () => {
    render(<LoginScreen />)

    // Switch to Sign In tab
    const signInTab = screen.getByText('Sign In')
    fireEvent.click(signInTab)
    expect(screen.getByText('Sign In to WristOS')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. gaurav@wristos.com')).toBeInTheDocument()

    // Switch to Register tab
    const registerTab = screen.getByText('Register')
    fireEvent.click(registerTab)
    expect(screen.getByText('Create Your Profile')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('e.g. Alex Rivera')).toBeInTheDocument()

    // Switch to Pair BLE tab
    const pairTab = screen.getByText('Pair BLE')
    fireEvent.click(pairTab)
    expect(screen.getByText(/Smartwatch Hardware/)).toBeInTheDocument()
  })
})
