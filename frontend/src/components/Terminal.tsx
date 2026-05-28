import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface TerminalProps {
  title?: string
  children: ReactNode
  className?: string
  showWindowControls?: boolean
}

export function Terminal({
  title = 'bash',
  children,
  className,
  showWindowControls = true,
}: TerminalProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg border border-border bg-background shadow-xl animate-terminal-open scanline-overlay',
        className,
      )}
    >
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
        {showWindowControls ? (
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
        ) : (
          <div />
        )}
        <div className="font-mono text-xs text-muted-foreground">{title}</div>
        <div className="w-[52px]" /> {/* Spacer to balance window controls */}
      </div>

      {/* Terminal Body */}
      <div className="p-4 md:p-6 text-sm font-mono leading-relaxed overflow-x-auto text-foreground">
        {children}
      </div>
    </div>
  )
}
