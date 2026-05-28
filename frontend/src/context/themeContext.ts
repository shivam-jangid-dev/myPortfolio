import { createContext } from 'react'
import type { ThemeId } from '@/stores/themeStore'

export type ThemeContextValue = {
  /** Currently active theme id */
  themeId: ThemeId
  /** Set a specific theme */
  setThemeId: (id: ThemeId) => void
  /** Cycle to the next theme in order */
  nextTheme: () => void
  /** All available theme ids */
  themes: ThemeId[]
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
