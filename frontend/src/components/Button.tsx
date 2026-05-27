import { cn } from '@/utils/cn'
import { motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'outline'

const variantClass: Record<Variant, string> = {
  primary:
    'bg-accent text-accent-foreground shadow-sm shadow-accent/25 hover:opacity-95',
  ghost: 'bg-muted/60 text-foreground hover:bg-muted',
  outline: 'border border-border bg-transparent hover:bg-muted/40',
}

type ButtonProps = HTMLMotionProps<'button'> & {
  variant?: Variant
  children: ReactNode
}

export function Button({ className, variant = 'primary', children, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold tracking-tight',
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  )
}

type LinkButtonProps = HTMLMotionProps<'a'> & {
  variant?: Variant
  children: ReactNode
}

/** Same visuals as Button for mailto / external anchors. */
export function LinkButton({ className, variant = 'primary', children, ...props }: LinkButtonProps) {
  return (
    <motion.a
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={cn(
        'inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold tracking-tight',
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {children}
    </motion.a>
  )
}
