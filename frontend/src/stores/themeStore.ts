import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** All available theme identifiers. */
export type ThemeId =
  | 'terminal-noir'
  | 'ocean-blue'
  | 'sleek-minimal'
  | 'charcoal-orange'
  | 'cinematic-red'
  | 'vibrant-primary'

/** Ordered list of all themes — used by ThemeSwitcher to render options. */
export const THEME_IDS: ThemeId[] = [
  'terminal-noir',
  'ocean-blue',
  'sleek-minimal',
  'charcoal-orange',
  'cinematic-red',
  'vibrant-primary',
]

/** Human-readable labels for each theme. */
export const THEME_LABELS: Record<ThemeId, string> = {
  'terminal-noir': 'Terminal Noir',
  'ocean-blue': 'Ocean Blue',
  'sleek-minimal': 'Sleek Minimal',
  'charcoal-orange': 'Charcoal Orange',
  'cinematic-red': 'Cinematic Red',
  'vibrant-primary': 'Vibrant Primary',
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
