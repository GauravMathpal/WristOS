import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AssistantScreen } from '../components/AssistantScreen'

describe('AssistantScreen Voice & Chat Pipeline', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders AssistantScreen with Holographic Voice Center and Conversation Stream', () => {
    render(<AssistantScreen />)
    expect(screen.getByText('WristOS AI Intelligence')).toBeInTheDocument()
    expect(screen.getByText(/Conversation Stream/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Ask anything or command WristOS/i)).toBeInTheDocument()
  })

  it('renders quick voice presets and allows 1-tap voice command simulation', async () => {
    render(<AssistantScreen />)
    const presetBtn = screen.getByText('Plan My Day')
    expect(presetBtn).toBeInTheDocument()

    fireEvent.click(presetBtn)

    // Verify it teleprompts to conversation
    await waitFor(() => {
      expect(screen.getByText('Plan my day and review pending tasks')).toBeInTheDocument()
    })
  })

  it('submits text query to chat stream and displays user message', async () => {
    render(<AssistantScreen />)
    const input = screen.getByPlaceholderText(/Ask anything or command WristOS/i)
    fireEvent.change(input, { target: { value: 'Schedule meeting tomorrow at 10 AM' } })

    const sendBtn = screen.getByTitle('Send message to AI assistant')
    fireEvent.click(sendBtn)

    await waitFor(() => {
      expect(screen.getByText('Schedule meeting tomorrow at 10 AM')).toBeInTheDocument()
    })
  })

  it('renders TTS toggle and toggles speaking state preference in localStorage', () => {
    render(<AssistantScreen />)
    const ttsBtn = screen.getByTitle(/Voice Auto-Reply/i)
    expect(ttsBtn).toBeInTheDocument()

    fireEvent.click(ttsBtn)
    expect(localStorage.getItem('wristos_tts_enabled')).toBe('true')

    fireEvent.click(ttsBtn)
    expect(localStorage.getItem('wristos_tts_enabled')).toBe('false')
  })
})
