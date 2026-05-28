import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** All available theme identifiers. */
export type ThemeId =
  | 'terminal-noir'
  | 'meta'
  | 'apple'
  | 'amazon'
  | 'netflix'
  | 'google'

/** Ordered list of all themes — used by ThemeSwitcher to render options. */
export const THEME_IDS: ThemeId[] = [
  'terminal-noir',
  'meta',
  'apple',
  'amazon',
  'netflix',
  'google',
]

/** Human-readable labels for each theme. */
export const THEME_LABELS: Record<ThemeId, string> = {
  'terminal-noir': 'Terminal Noir',
  meta: 'Meta',
  apple: 'Apple',
  amazon: 'Amazon',
  netflix: 'Netflix',
  google: 'Google',
}

const STORAGE_KEY = 'portfolio-theme'

type ThemeState = {
  preference: ThemeId
  setPreference: (p: ThemeId) => void
}

/**
 * Zustand: persisted theme selection.
 * DOM application lives in ThemeProvider so data-theme stays in sync.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      preference: 'terminal-noir',
      setPreference: (preference) => set({ preference }),
    }),
    { name: STORAGE_KEY },
  ),
)
