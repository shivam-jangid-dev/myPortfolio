import { useLenis } from '@/hooks/useLenis'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { NAV_OFFSET } from '@/utils/constants'

// Sections
import { HeroSection } from '@/sections/Hero/HeroSection'
import { AIToolsSection } from '@/sections/AITools/AIToolsSection'
import { ProjectsSection } from '@/sections/Projects/ProjectsSection'
import { ExperienceSection } from '@/sections/Experience/ExperienceSection'
import { TechStackSection } from '@/sections/TechStack/TechStackSection'
import { ImpactSection } from '@/sections/Impact/ImpactSection'
import { CertificationsSection } from '@/sections/Certifications/CertificationsSection'
import { ContactSection } from '@/sections/Contact/ContactSection'

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
 * Landing page: compose all 8 feature sections in order.
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
      if (lenis) {
        lenis.scrollTo(sel, { offset: NAV_OFFSET, duration: 1.1 })
      } else {
        document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' })
      }
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
      className="flex flex-col"
    >
      <HeroSection />
      <AIToolsSection />
      <ProjectsSection />
      <ExperienceSection />
      <TechStackSection />
      <ImpactSection />
      <CertificationsSection />
      <ContactSection />
    </motion.div>
  )
}
