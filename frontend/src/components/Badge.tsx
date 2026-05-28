import { type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'outline' | 'ghost'
}

export function Badge({
  className,
  variant = 'default',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        {
          'bg-muted text-muted-foreground': variant === 'default',
          'bg-accent/10 text-accent border border-accent/20': variant === 'accent',
          'border border-border text-foreground': variant === 'outline',
          'bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground': variant === 'ghost',
        },
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
