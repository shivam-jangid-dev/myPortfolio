import { magneticOffset } from '@/hooks/useMagneticCursor'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { cn } from '@/utils/cn'
import { motion, useSpring } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'

type CursorVariant = 'default' | 'link' | 'image' | 'text'

function detectVariant(target: Element | null): CursorVariant {
  if (!target || !(target instanceof Element)) return 'default'
  if (target.closest('a, button, [data-cursor="link"]')) return 'link'
  if (target.closest('img, [data-cursor="image"]')) return 'image'
  if (target.closest('p, h1, h2, h3, h4, li, [data-cursor="text"]')) return 'text'
  return 'default'
}

/**
 * Premium custom cursor with magnetic pull toward interactive targets.
 * Disabled for reduced motion and coarse pointers (touch).
 */
export function CustomCursor() {
  const reduced = useReducedMotion()
  const [variant, setVariant] = useState<CursorVariant>('default')

  const enabled = useMemo(
    () => !reduced && typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches,
    [reduced],
  )

  const springConfig = reduced ? { stiffness: 5000, damping: 200 } : { stiffness: 400, damping: 28 }
  const x = useSpring(0, springConfig)
  const y = useSpring(0, springConfig)

  const onMove = useCallback(
    (e: PointerEvent) => {
      let tx = e.clientX
      let ty = e.clientY

      const stack = document.elementsFromPoint(e.clientX, e.clientY)
      const top = stack.find((n) => n !== document.body) ?? null
      const v = detectVariant(top)
      setVariant(v)

      if (v === 'link') {
        const link = top?.closest?.('a, button, [data-cursor="link"]') as HTMLElement | null
        if (link) {
          const r = link.getBoundingClientRect()
          const pulled = magneticOffset(tx, ty, r.left + r.width / 2, r.top + r.height / 2, 0.22)
          tx = pulled.x
          ty = pulled.y
        }
      }

      x.set(tx)
      y.set(ty)
    },
    [x, y],
  )

  useEffect(() => {
    if (!enabled) return
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [enabled, onMove])

  if (!enabled) return null

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[9999] mix-blend-difference max-md:hidden"
      >
        <motion.div
          className="pointer-events-none absolute left-0 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
          style={{
            x,
            y,
            scale: variant === 'link' ? 1.35 : variant === 'image' ? 1.2 : variant === 'text' ? 0.85 : 1,
          }}
        />
        <motion.div
          className={cn(
            'pointer-events-none absolute left-0 top-0 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70',
            variant === 'link' && 'h-12 w-12 border-white',
          )}
          style={{
            x,
            y,
            scale: variant === 'link' ? 1.1 : 1,
          }}
        />
      </div>
      <style>{`@media (pointer: fine) {
        html { cursor: none; }
        html a, html button, html [role="button"] { cursor: none; }
        html input, html textarea, html select { cursor: auto; }
      }`}</style>
    </>
  )
}
