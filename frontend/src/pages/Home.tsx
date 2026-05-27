import { useLenis } from '@/hooks/useLenis'
import { BackendArchitectureSection } from '@/features/about/BackendArchitectureSection'
import { ContactSection } from '@/features/contact/ContactSection'
import { ExperienceTimeline } from '@/features/experience/ExperienceTimeline'
import { HeroSection } from '@/features/hero/HeroSection'
import { ProjectsSection } from '@/features/projects/ProjectsSection'
import { SkillsGrid } from '@/features/skills/SkillsGrid'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.28 } },
}

/**
 * Landing page: compose feature sections. Section ids align with Navbar hash targets.
 */
export function Home() {
  const location = useLocation()
  const navigate = useNavigate()
  const lenis = useLenis()

  useEffect(() => {
    const id = (location.state as { scrollTo?: string } | null)?.scrollTo
    if (!id) return

    const run = () => {
      const sel = `#${id}`
      if (lenis) lenis.scrollTo(sel, { offset: -72, duration: 1.1 })
      else document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' })
      navigate(location.pathname, { replace: true, state: {} })
    }

    const t = window.setTimeout(run, 50)
    return () => window.clearTimeout(t)
  }, [location, lenis, navigate])

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <HeroSection />
      <BackendArchitectureSection />
      <SkillsGrid />
      <ProjectsSection />
      <ExperienceTimeline />
      <ContactSection />
    </motion.div>
  )
}
