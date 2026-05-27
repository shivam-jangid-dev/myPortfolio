import { useTheme } from '@/hooks/useTheme'
import type { ThemePreference } from '@/stores/themeStore'

/**
 * Cycles light → dark → system so recruiters can preview either mode or follow OS.
 */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme()

  const cycle = () => {
    const order: ThemePreference[] = ['light', 'dark', 'system']
    const i = order.indexOf(preference)
    setPreference(order[(i + 1) % order.length])
  }

  const label =
    preference === 'system' ? 'Theme: system' : preference === 'dark' ? 'Theme: dark' : 'Theme: light'

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-md border border-border bg-card text-foreground transition hover:border-accent/50 hover:bg-muted/50"
    >
      {preference === 'light' ? (
        <SunIcon />
      ) : preference === 'dark' ? (
        <MoonIcon />
      ) : (
        <SystemIcon />
      )}
    </button>
  )
}

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function SystemIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}
