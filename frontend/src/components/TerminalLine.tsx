import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import { slideInLeftVariant } from '@/utils/animationHelpers'

interface TerminalLineProps {
  prompt?: string
  command?: string
  output?: ReactNode
  className?: string
  showCursor?: boolean
  delay?: number
}

export function TerminalLine({
  prompt = 'visitor@shivamjangid.dev:~$',
  command,
  output,
  className,
  showCursor = false,
  delay = 0,
}: TerminalLineProps) {
  return (
    <motion.div
      variants={slideInLeftVariant}
      transition={{ delay }}
      className={cn('mb-2 flex flex-col gap-1', className)}
    >
      {(prompt || command) && (
        <div className="flex flex-wrap items-center gap-2">
          {prompt && <span className="text-accent">{prompt}</span>}
          {command && (
            <span className="text-foreground">
              {command}
              {showCursor && !output && (
                <span className="inline-block w-2 h-4 ml-1 align-middle bg-accent cursor-blink" />
              )}
            </span>
          )}
        </div>
      )}

      {output && (
        <div className="text-muted-foreground whitespace-pre-wrap">
          {output}
          {showCursor && (
            <span className="inline-block w-2 h-4 ml-1 align-middle bg-muted-foreground cursor-blink" />
          )}
        </div>
      )}
    </motion.div>
  )
}
