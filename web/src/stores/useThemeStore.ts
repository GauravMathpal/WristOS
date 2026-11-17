import { create } from 'zustand'

export type ThemePreset = 'aurora' | 'ocean' | 'emerald' | 'sunset' | 'rose' | 'monochrome' | 'custom'
export type ThemeMode = 'dark' | 'light' | 'system'

export interface ThemeColors {
  primary: string
  secondary: string
  gradient: string
  bgPrimary: string
  bgSecondary: string
  cardBg: string
  elevatedBg: string
  border: string
  textPrimary: string
  textSecondary: string
}

export interface ThemePresetConfig {
  id: ThemePreset
  name: string
  description: string
  previewColors: string[]
  dark: ThemeColors
  light: ThemeColors
}

export const PRESET_THEMES: Record<Exclude<ThemePreset, 'custom'>, ThemePresetConfig> = {
  aurora: {
    id: 'aurora',
    name: 'Aurora',
    description: 'Purple, Violet & Pink (Default)',
    previewColors: ['#6366F1', '#A855F7', '#EC4899'],
    dark: {
      primary: '#A855F7',
      secondary: '#7C3AED',
      gradient: 'linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)',
      bgPrimary: '#080812',
      bgSecondary: '#11111F',
      cardBg: '#171729',
      elevatedBg: '#202039',
      border: 'rgba(168, 85, 247, 0.16)',
      textPrimary: '#F8FAFC',
      textSecondary: '#A1A1B5'
    },
    light: {
      primary: '#8B5CF6',
      secondary: '#7C3AED',
      gradient: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)',
      bgPrimary: '#F8FAFC',
      bgSecondary: '#FFFFFF',
      cardBg: '#FFFFFF',
      elevatedBg: '#F1F5F9',
      border: 'rgba(139, 92, 246, 0.14)',
      textPrimary: '#0F172A',
      textSecondary: '#64748B'
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep Blue & Cyan Wave',
    previewColors: ['#0284C7', '#06B6D4', '#38BDF8'],
    dark: {
      primary: '#06B6D4',
      secondary: '#0284C7',
      gradient: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 50%, #38BDF8 100%)',
      bgPrimary: '#050B14',
      bgSecondary: '#0A1526',
      cardBg: '#0F1E36',
      elevatedBg: '#172A4B',
      border: 'rgba(6, 182, 212, 0.16)',
      textPrimary: '#F0F9FF',
      textSecondary: '#94A3B8'
    },
    light: {
      primary: '#0284C7',
      secondary: '#0369A1',
      gradient: 'linear-gradient(135deg, #0284C7 0%, #06B6D4 50%, #38BDF8 100%)',
      bgPrimary: '#F0F9FF',
      bgSecondary: '#FFFFFF',
      cardBg: '#FFFFFF',
      elevatedBg: '#E0F2FE',
      border: 'rgba(2, 132, 199, 0.14)',
      textPrimary: '#0C4A6E',
      textSecondary: '#64748B'
    }
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    description: 'Forest Green & Mint Neon',
    previewColors: ['#059669', '#10B981', '#34D399'],
    dark: {
      primary: '#10B981',
      secondary: '#059669',
      gradient: 'linear-gradient(135deg, #059669 0%, #10B981 50%, #34D399 100%)',
      bgPrimary: '#040E0A',
      bgSecondary: '#091A14',
      cardBg: '#0F261D',
      elevatedBg: '#15362A',
      border: 'rgba(16, 185, 129, 0.16)',
      textPrimary: '#F0FDF4',
      textSecondary: '#86EFAC'
    },
    light: {
      primary: '#059669',
      secondary: '#047857',
      gradient: 'linear-gradient(135deg, #047857 0%, #059669 50%, #10B981 100%)',
      bgPrimary: '#F0FDF4',
      bgSecondary: '#FFFFFF',
      cardBg: '#FFFFFF',
      elevatedBg: '#DCFCE7',
      border: 'rgba(5, 150, 105, 0.14)',
      textPrimary: '#064E3B',
      textSecondary: '#64748B'
    }
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Vibrant Orange & Golden Glow',
    previewColors: ['#EA580C', '#F97316', '#FBBF24'],
    dark: {
      primary: '#F97316',
      secondary: '#EA580C',
      gradient: 'linear-gradient(135deg, #EA580C 0%, #F97316 50%, #FBBF24 100%)',
      bgPrimary: '#120904',
      bgSecondary: '#1F1108',
      cardBg: '#2B180D',
      elevatedBg: '#3A2112',
      border: 'rgba(249, 115, 22, 0.16)',
      textPrimary: '#FFF7ED',
      textSecondary: '#FDBA74'
    },
    light: {
      primary: '#EA580C',
      secondary: '#C2410C',
      gradient: 'linear-gradient(135deg, #EA580C 0%, #F97316 50%, #FBBF24 100%)',
      bgPrimary: '#FFF7ED',
      bgSecondary: '#FFFFFF',
      cardBg: '#FFFFFF',
      elevatedBg: '#FFEDD5',
      border: 'rgba(234, 88, 12, 0.14)',
      textPrimary: '#7C2D12',
      textSecondary: '#78716C'
    }
  },
  rose: {
    id: 'rose',
    name: 'Rose',
    description: 'Electric Pink & Rich Crimson',
    previewColors: ['#E11D48', '#F43F5E', '#FB7185'],
    dark: {
      primary: '#F43F5E',
      secondary: '#E11D48',
      gradient: 'linear-gradient(135deg, #E11D48 0%, #F43F5E 50%, #FB7185 100%)',
      bgPrimary: '#120508',
      bgSecondary: '#1F0A0E',
      cardBg: '#2C0E15',
      elevatedBg: '#3C131D',
      border: 'rgba(244, 63, 94, 0.16)',
      textPrimary: '#FFF1F2',
      textSecondary: '#FDA4AF'
    },
    light: {
      primary: '#E11D48',
      secondary: '#BE123C',
      gradient: 'linear-gradient(135deg, #E11D48 0%, #F43F5E 50%, #FB7185 100%)',
      bgPrimary: '#FFF1F2',
      bgSecondary: '#FFFFFF',
      cardBg: '#FFFFFF',
      elevatedBg: '#FFE4E6',
      border: 'rgba(225, 29, 72, 0.14)',
      textPrimary: '#881337',
      textSecondary: '#78716C'
    }
  },
  monochrome: {
    id: 'monochrome',
    name: 'Monochrome',
    description: 'Minimal Carbon & Silver Titanium',
    previewColors: ['#64748B', '#94A3B8', '#E2E8F0'],
    dark: {
      primary: '#E2E8F0',
      secondary: '#94A3B8',
      gradient: 'linear-gradient(135deg, #475569 0%, #94A3B8 50%, #E2E8F0 100%)',
      bgPrimary: '#09090B',
      bgSecondary: '#121215',
      cardBg: '#18181B',
      elevatedBg: '#27272A',
      border: 'rgba(255, 255, 255, 0.1)',
      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8'
    },
    light: {
      primary: '#0F172A',
      secondary: '#334155',
      gradient: 'linear-gradient(135deg, #0F172A 0%, #334155 50%, #64748B 100%)',
      bgPrimary: '#F8FAFC',
      bgSecondary: '#FFFFFF',
      cardBg: '#FFFFFF',
      elevatedBg: '#F1F5F9',
      border: 'rgba(15, 23, 42, 0.08)',
      textPrimary: '#0F172A',
      textSecondary: '#64748B'
    }
  }
}

interface ThemeState {
  currentPreset: ThemePreset
  mode: ThemeMode
  customColors: ThemeColors
  setPreset: (preset: ThemePreset) => void
  setMode: (mode: ThemeMode) => void
  setCustomColors: (colors: Partial<ThemeColors>) => void
  resetToDefault: () => void
  getActiveColors: () => ThemeColors
}

const STORAGE_KEY = 'wristos_theme_preferences'

function loadSavedTheme(): { preset: ThemePreset; mode: ThemeMode; custom?: ThemeColors } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { preset: 'aurora', mode: 'dark' }
}

const defaultCustomColors: ThemeColors = {
  primary: '#A855F7',
  secondary: '#7C3AED',
  gradient: 'linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%)',
  bgPrimary: '#080812',
  bgSecondary: '#11111F',
  cardBg: '#171729',
  elevatedBg: '#202039',
  border: 'rgba(168, 85, 247, 0.18)',
  textPrimary: '#F8FAFC',
  textSecondary: '#A1A1B5'
}

export function applyThemeToDOM(colors: ThemeColors, isDark: boolean) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  
  if (isDark) {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.add('light')
    root.classList.remove('dark')
  }

  root.style.setProperty('--color-primary', colors.primary)
  root.style.setProperty('--color-secondary', colors.secondary)
  root.style.setProperty('--gradient-theme', colors.gradient)
  root.style.setProperty('--bg-primary', colors.bgPrimary)
  root.style.setProperty('--bg-secondary', colors.bgSecondary)
  root.style.setProperty('--bg-card', colors.cardBg)
  root.style.setProperty('--bg-elevated', colors.elevatedBg)
  root.style.setProperty('--border-theme', colors.border)
  root.style.setProperty('--text-primary', colors.textPrimary)
  root.style.setProperty('--text-secondary', colors.textSecondary)
}

const initialSaved = loadSavedTheme()
const initialIsDark = initialSaved.mode === 'dark' || (initialSaved.mode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches)
const initialPresetConfig = initialSaved.preset !== 'custom' ? PRESET_THEMES[initialSaved.preset] : PRESET_THEMES.aurora
const initialColors = initialSaved.preset === 'custom' 
  ? (initialSaved.custom || defaultCustomColors) 
  : (initialIsDark ? initialPresetConfig.dark : initialPresetConfig.light)

// Run immediately on boot
applyThemeToDOM(initialColors, initialIsDark)

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentPreset: initialSaved.preset || 'aurora',
  mode: initialSaved.mode || 'dark',
  customColors: initialSaved.custom || defaultCustomColors,

  getActiveColors: () => {
    const state = get()
    const isDark = state.mode === 'dark' || (state.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    
    if (state.currentPreset === 'custom') {
      return state.customColors
    }
    
    const preset = PRESET_THEMES[state.currentPreset] || PRESET_THEMES.aurora
    return isDark ? preset.dark : preset.light
  },

  setPreset: (preset) => {
    set({ currentPreset: preset })
    const state = get()
    const colors = state.getActiveColors()
    const isDark = state.mode === 'dark' || (state.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    applyThemeToDOM(colors, isDark)
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      preset,
      mode: state.mode,
      custom: state.customColors
    }))
  },

  setMode: (mode) => {
    set({ mode })
    const state = get()
    const colors = state.getActiveColors()
    const isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    applyThemeToDOM(colors, isDark)

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      preset: state.currentPreset,
      mode,
      custom: state.customColors
    }))
  },

  setCustomColors: (colors) => {
    set((s) => ({
      currentPreset: 'custom',
      customColors: { ...s.customColors, ...colors }
    }))
    const state = get()
    const isDark = state.mode === 'dark' || (state.mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    applyThemeToDOM(state.customColors, isDark)

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      preset: 'custom',
      mode: state.mode,
      custom: state.customColors
    }))
  },

  resetToDefault: () => {
    set({ currentPreset: 'aurora', mode: 'dark' })
    const colors = PRESET_THEMES.aurora.dark
    applyThemeToDOM(colors, true)
    localStorage.removeItem(STORAGE_KEY)
  }
}))
