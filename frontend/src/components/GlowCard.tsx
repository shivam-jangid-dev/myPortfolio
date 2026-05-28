import { useEffect, useRef, type HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface GlowCardProps extends HTMLAttributes<HTMLDivElement> {}

export function GlowCard({ className, children, ...props }: GlowCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    const handleMouseMove = (e: MouseEvent) => {
      // Don't track on touch devices for performance
      if (window.matchMedia('(pointer: coarse)').matches) return

      const rect = card.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      card.style.setProperty('--mouse-x', `${x}px`)
      card.style.setProperty('--mouse-y', `${y}px`)
    }

    card.addEventListener('mousemove', handleMouseMove)
    return () => card.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div
      ref={cardRef}
      className={cn(
        'group relative overflow-hidden rounded-xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg',
        className,
      )}
      {...props}
    >
      {/* Background Glow */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 group-hover:opacity-100 hidden sm:block"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x, 0) var(--mouse-y, 0), hsl(var(--accent) / 0.1), transparent 40%)`,
        }}
      />
      
      {/* Border Glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-xl border opacity-0 transition duration-300 group-hover:opacity-100 hidden sm:block"
        style={{
          borderImage: `radial-gradient(100px circle at var(--mouse-x, 0) var(--mouse-y, 0), hsl(var(--accent)), transparent) 1`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          padding: '1px',
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  )
}
