import { SectionHeading } from '@/components/SectionHeading'
import { GlowCard } from '@/components/GlowCard'
import { Badge } from '@/components/Badge'
import { projects } from '@/config/projects'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { motion } from 'framer-motion'
import { fadeUpVariant, staggerContainer } from '@/utils/animationHelpers'
import { Link } from 'react-router-dom'

export function ProjectsSection() {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 })

  return (
    <section id="projects" className="py-24 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <SectionHeading
          eyebrow="Portfolio"
          title="Featured Projects"
          subtitle="A selection of my recent work in AI integrations, backend systems, and full-stack development."
          className="mb-16"
        />

        <motion.div
          ref={ref}
          variants={staggerContainer(0.1)}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {projects.map((project) => (
            <motion.div key={project.id} variants={fadeUpVariant} className="flex">
              <GlowCard className="flex flex-col h-full w-full">
                <div className="flex-1 flex flex-col">
                  {/* Status/Featured Indicator */}
                  {project.featured && (
                    <div className="mb-4">
                      <Badge variant="accent">Featured</Badge>
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-foreground tracking-tight mb-3">
                    {project.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed flex-1">
                    {project.summary}
                  </p>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tech.map((t) => (
                      <span
                        key={t}
                        className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Links */}
                <div className="pt-4 mt-auto border-t border-border flex items-center justify-between gap-4">
                  {project.links?.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-accent hover:underline flex items-center gap-1"
                    >
                      {link.label}
                      <span className="text-xs">↗</span>
                    </a>
                  ))}
                  {/* If it's the AI Portfolio, link to case study */}
                  {project.id === 'ai-portfolio' && (
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-sm font-medium text-foreground hover:text-accent transition-colors ml-auto"
                    >
                      Case Study <span className="text-accent opacity-50 ml-1">./</span>
                    </Link>
                  )}
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
