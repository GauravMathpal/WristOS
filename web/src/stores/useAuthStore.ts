import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { syncService } from '../lib/syncService'

interface AuthState {
  user: User | null
  isLoading: boolean
  isConfigured: boolean
  setUser: (user: User | null) => void
  signInAnonymously: () => Promise<{ error: Error | null }>
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isConfigured: isSupabaseConfigured,

  setUser: (user) => {
    set({ user, isLoading: false })
    if (user) {
      syncService.initRealtime()
      // Auto-trigger sync when user becomes available
      setTimeout(() => syncService.triggerSync(), 300)
    } else {
      syncService.tearDownRealtime()
    }
  },

  signInAnonymously: async () => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase credentials not configured in .env') }
    }
    const { data, error } = await supabase.auth.signInAnonymously()
    if (!error && data?.user) {
      set({ user: data.user, isLoading: false })
      syncService.triggerSync()
    }
    return { error }
  },

  signInWithOtp: async (email: string) => {
    if (!isSupabaseConfigured) {
      return { error: new Error('Supabase credentials not configured in .env') }
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    })
    return { error }
  },

  signOut: async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut()
    }
    set({ user: null })
  }
}))

// Auto-initialize auth session listener
if (isSupabaseConfigured) {
  supabase.auth.getSession().then(({ data: { session } }) => {
    useAuthStore.getState().setUser(session?.user || null)
  })

  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setUser(session?.user || null)
  })
} else {
  useAuthStore.setState({ isLoading: false })
}
