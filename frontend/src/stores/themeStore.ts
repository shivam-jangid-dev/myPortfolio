import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Stored preference: concrete themes or follow OS. */
export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'portfolio-theme'

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') return getSystemTheme()
  return preference
}

type ThemeState = {
  preference: ThemePreference
  setPreference: (p: ThemePreference) => void
}

/**
 * Zustand: UI theme selection only. DOM application lives in ThemeProvider
 * so SSR/hydration and data-theme stay in one place.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'system',
      setPreference: (preference) => set({ preference }),
    }),
    { name: STORAGE_KEY },
  ),
)
