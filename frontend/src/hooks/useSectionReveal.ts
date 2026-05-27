import { gsap } from 'gsap'
import { useEffect, type RefObject } from 'react'

/**
 * Fade/slide reveal on scroll. Honors reduced motion via live media query.
 */
export function useSectionReveal<T extends HTMLElement>(ref: RefObject<T | null>, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const el = ref.current
    if (!el) return

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) {
      gsap.set(el, { opacity: 1, y: 0 })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            scroller: document.documentElement,
            start: 'top 90%',
            toggleActions: 'play none none none',
          },
        },
      )
    }, el)

    return () => ctx.revert()
  }, [enabled, ref])
}
