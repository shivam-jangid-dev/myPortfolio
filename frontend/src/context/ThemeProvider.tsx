import { ThemeContext, type ThemeContextValue } from '@/context/themeContext'
import { useThemeStore, type ThemePreference } from '@/stores/themeStore'
import { useCallback, useMemo, useSyncExternalStore, useEffect, type ReactNode } from 'react'

function subscribeSystemTheme(onChange: () => void) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', onChange)
  return () => mq.removeEventListener('change', onChange)
}

function getSystemSnapshot() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function getServerSnapshot() {
  return false
}

const applyDomTheme = (resolved: 'light' | 'dark') => {
  document.documentElement.dataset.theme = resolved
  document.documentElement.style.colorScheme = resolved
}

const order: ThemePreference[] = ['light', 'dark', 'system']

function normalizePreference(p: ThemePreference): ThemePreference {
  return order.includes(p) ? p : 'system'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const preferenceRaw = useThemeStore((s) => s.preference)
  const setPreferenceStore = useThemeStore((s) => s.setPreference)
  const preference = normalizePreference(preferenceRaw)

  const systemIsDark = useSyncExternalStore(subscribeSystemTheme, getSystemSnapshot, getServerSnapshot)

  const resolved: 'light' | 'dark' = useMemo(() => {
    if (preference === 'system') return systemIsDark ? 'dark' : 'light'
    return preference
  }, [preference, systemIsDark])

  useEffect(() => {
    applyDomTheme(resolved)
  }, [resolved])

  const setPreference = useCallback(
    (p: ThemePreference) => {
      setPreferenceStore(normalizePreference(p))
    },
    [setPreferenceStore],
  )

  const toggle = useCallback(() => {
    const i = order.indexOf(preference)
    const next = order[(i + 1) % order.length]
    setPreference(next)
  }, [preference, setPreference])

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolved, setPreference, toggle }),
    [preference, resolved, setPreference, toggle],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
