import { ThemeContext, type ThemeContextValue } from '@/context/themeContext'
import { useThemeStore, THEME_IDS, type ThemeId } from '@/stores/themeStore'
import { useCallback, useEffect, useMemo, type ReactNode } from 'react'

/**
 * Apply the selected theme to the DOM.
 * Sets data-theme on <html> and color-scheme for native UA elements.
 */
const applyDomTheme = (themeId: ThemeId) => {
  document.documentElement.dataset.theme = themeId
  // Apple and Google are light themes; everything else is dark
  const scheme = themeId === 'apple' || themeId === 'google' ? 'light' : 'dark'
  document.documentElement.style.colorScheme = scheme
}

/**
 * Validate that a preference string is a known ThemeId.
 * Falls back to 'terminal-noir' if invalid (e.g., stale localStorage).
 */
function normalizeThemeId(raw: string): ThemeId {
  return THEME_IDS.includes(raw as ThemeId) ? (raw as ThemeId) : 'terminal-noir'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preferenceRaw = useThemeStore((s) => s.preference)
  const setPreferenceStore = useThemeStore((s) => s.setPreference)

  const themeId = normalizeThemeId(preferenceRaw)

  // Sync to DOM whenever theme changes
  useEffect(() => {
    applyDomTheme(themeId)
  }, [themeId])

  const setThemeId = useCallback(
    (id: ThemeId) => {
      setPreferenceStore(normalizeThemeId(id))
    },
    [setPreferenceStore],
  )

  const nextTheme = useCallback(() => {
    const i = THEME_IDS.indexOf(themeId)
    const next = THEME_IDS[(i + 1) % THEME_IDS.length]
    setThemeId(next)
  }, [themeId, setThemeId])

  const value = useMemo<ThemeContextValue>(
    () => ({ themeId, setThemeId, nextTheme, themes: THEME_IDS }),
    [themeId, setThemeId, nextTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
