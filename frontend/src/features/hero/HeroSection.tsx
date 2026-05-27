// import heroPortrait from '@/assets/hero.png'
import heroPortrait from '@/assets/mp_.mp4'
import { Button } from '@/components/Button'
import { profile } from '@/config/profile'
import { useReducedMotion } from '@/hooks/useReducedMotion'
import { useLenis } from '@/hooks/useLenis'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'

/**
 * Full-viewport hero with staggered typography and parallax portrait.
 * Parallax is softened when prefers-reduced-motion is active.
 */
export function HeroSection() {
  const reduced = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const lenis = useLenis()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const imgY = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [0, 120])
  const imgScale = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [1, 1.08])

  const scrollTo = (id: string) => {
    const sel = `#${id}`
    if (lenis) lenis.scrollTo(sel, { offset: -72, duration: 1.1 })
    else document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden px-4 pb-24 pt-28 sm:px-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[size:48px_48px] bg-grid-fade opacity-40" />
      <div className="pointer-events-none absolute inset-0 grain" />
      <div className="pointer-events-none absolute -right-20 top-1/4 h-[28rem] w-[28rem] rounded-full bg-hero/15 blur-3xl" />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
        <div className="space-y-8">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-semibold uppercase tracking-[0.25em] text-accent"
          >
            AI Backend · APIs · Cloud
          </motion.p>
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
            >
              {profile.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="max-w-xl text-lg text-muted-foreground sm:text-xl"
            >
              {profile.tagline}
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="flex flex-wrap gap-3"
          >
            <Button type="button" onClick={() => scrollTo('projects')}>
              View work
            </Button>
            <Button type="button" variant="outline" onClick={() => scrollTo('contact')}>
              Hire me
            </Button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          {/* <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-foreground/5">
            <motion.img
              src={heroPortrait}
              alt="Stylized cyberpunk portrait of Shivam Jangid"
              data-cursor="image"
              className="h-full w-full object-cover object-top"
              style={{ y: imgY, scale: imgScale }}
            />
            <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-foreground/5" />
          </div> */}
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-foreground/5">
  <motion.video
    src={heroPortrait} // Replace heroPortrait with your video source variable
    autoPlay
    muted
    loop
    playsInline
    className="h-full w-full object-cover object-top"
    style={{ y: imgY, scale: imgScale }}
    data-cursor="video"
  />
  <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-foreground/5" />
</div>
          {/* <p className="mt-4 text-center text-xs text-muted-foreground">
            Abstract cyberpunk portrait — parallax layer for depth.
          </p> */}
        </motion.div>
      </div>
    </section>
  )
}
