import '@testing-library/jest-dom/vitest'
import 'fake-indexeddb/auto'

// Mock matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock Web Audio Context
class MockAudioContext {
  currentTime = 0
  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {}
      },
      connect: () => {},
      start: () => {},
      stop: () => {}
    }
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {}
      },
      connect: () => {}
    }
  }
  destination = {}
}

// @ts-expect-error Mock AudioContext
window.AudioContext = MockAudioContext
// @ts-expect-error Mock webkitAudioContext
window.webkitAudioContext = MockAudioContext
