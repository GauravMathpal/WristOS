import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface AuthState {
  user: User | null
  isLoading: boolean
  isConfigured: boolean
  setUser: (user: User | null) => void
  signInWithOtp: (email: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isConfigured: isSupabaseConfigured,

  setUser: (user) => set({ user, isLoading: false }),

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

// Auto-initialize auth listener
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
