import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'

type ToolPageLayoutProps = {
  title: string
  description: string
  badgeLabel?: string
  children: ReactNode
  className?: string
}

/**
 * Shared layout shell for all AI tool pages.
 * Provides a back button, title header, and a content slot.
 */
export function ToolPageLayout({
  title,
  description,
  badgeLabel,
  children,
  className,
}: ToolPageLayoutProps) {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-screen bg-background"
    >
      <div className={cn('mx-auto max-w-4xl px-4 sm:px-6 py-8 sm:py-12', className)}>
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="group mb-8 inline-flex items-center gap-2 rounded-lg border border-border bg-card/50 px-4 py-2 font-mono text-sm text-muted-foreground transition-all hover:border-accent/40 hover:text-accent"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-hover:-translate-x-1"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          <span className="opacity-60">./</span>back_to_home.sh
        </button>

        {/* Page Header */}
        <div className="mb-10 space-y-3">
          {badgeLabel && (
            <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent border border-accent/20">
              {badgeLabel}
            </span>
          )}
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl flex items-center gap-3">
            <span className="text-accent font-mono text-2xl sm:text-3xl opacity-70">
              ~%
            </span>
            {title}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground max-w-2xl">
            {description}
          </p>
        </div>

        {/* Content Slot */}
        {children}
      </div>
    </motion.div>
  )
}
