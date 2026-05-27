import { createContext } from 'react'
import type { ThemePreference } from '@/stores/themeStore'

export type ThemeContextValue = {
  preference: ThemePreference
  resolved: 'light' | 'dark'
  setPreference: (p: ThemePreference) => void
  toggle: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
