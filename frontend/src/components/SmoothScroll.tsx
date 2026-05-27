import { LenisContext } from '@/context/lenisContext'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useState, type ReactNode } from 'react'

/**
 * Lenis smooth scroll + GSAP ScrollTrigger sync (scrollerProxy).
 * Skipped entirely when prefers-reduced-motion is set.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion()
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null)

  useEffect(() => {
    if (reduced) {
      queueMicrotask(() => setLenisInstance(null))
      return
    }

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      autoRaf: false,
    })
    queueMicrotask(() => setLenisInstance(lenis))

    lenis.on('scroll', ScrollTrigger.update)

    const scroller = document.documentElement

    ScrollTrigger.scrollerProxy(scroller, {
      scrollTop(value) {
        if (arguments.length && value !== undefined) {
          lenis.scrollTo(value, { immediate: true })
        }
        return lenis.scroll
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        }
      },
      pinType: scroller.style.transform ? 'transform' : 'fixed',
    })

    const ticker = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(ticker)
    gsap.ticker.lagSmoothing(0)

    const onRefresh = () => {
      lenis.resize()
    }
    ScrollTrigger.addEventListener('refresh', onRefresh)
    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(ticker)
      ScrollTrigger.removeEventListener('refresh', onRefresh)
      ScrollTrigger.scrollerProxy(scroller, {})
      lenis.destroy()
      queueMicrotask(() => setLenisInstance(null))
    }
  }, [reduced])

  return <LenisContext.Provider value={lenisInstance}>{children}</LenisContext.Provider>
}
