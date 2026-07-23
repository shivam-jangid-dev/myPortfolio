import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { THEME_LABELS } from '@/stores/themeStore'
import { cn } from '@/utils/cn'

export function ThemeSwitcher({ className }: { className?: string }) {
  const { themeId, setThemeId, themes } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Change Theme"
      >
        {/* Active theme color dot */}
        <span className="h-3 w-3 rounded-full bg-accent pulse-glow" />
        <span className="hidden sm:inline-block">{THEME_LABELS[themeId]}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-md border border-border bg-card p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          >
            <div className="py-1" role="menu" aria-orientation="vertical">
              {themes.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setThemeId(t)
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-sm px-4 py-2 text-sm text-left transition-colors',
                    themeId === t
                      ? 'bg-muted text-accent font-medium'
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                  )}
                  role="menuitem"
                >
                  {/* Theme preview dot - we'll simulate the color based on the theme ID for now.
                      In a full implementation, we could read the actual CSS variable or hardcode previews here */}
                  <span
                    className={cn('h-2.5 w-2.5 rounded-full', {
                      'bg-[#00d26a]': t === 'terminal-noir',
                      'bg-[#0866FF]': t === 'ocean-blue',
                      'bg-[#000000] dark:bg-[#ffffff]': t === 'sleek-minimal',
                      'bg-[#FF9900]': t === 'charcoal-orange',
                      'bg-[#E50914]': t === 'cinematic-red',
                      'bg-[#4285F4]': t === 'vibrant-primary',
                    })}
                  />
                  {THEME_LABELS[t]}
                  {themeId === t && (
                    <span className="ml-auto text-accent">✓</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
