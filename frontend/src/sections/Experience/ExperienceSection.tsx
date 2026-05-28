import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { SectionHeading } from '@/components/SectionHeading'
import { Card } from '@/components/Card'
import { Badge } from '@/components/Badge'
import { experience } from '@/config/experience'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { fadeUpVariant } from '@/utils/animationHelpers'

function ExperienceItem({ item, index }: { item: typeof experience[0]; index: number }) {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.2, rootMargin: '0px 0px -100px 0px' })

  return (
    <div ref={ref} className="relative pl-8 md:pl-0">
      {/* Timeline Dot */}
      <div className="absolute left-[-5px] md:left-1/2 md:-translate-x-1/2 top-8 z-10 flex h-3 w-3 items-center justify-center rounded-full bg-background ring-4 ring-background">
        <div className={`h-2.5 w-2.5 rounded-full ${item.isCurrent ? 'bg-accent pulse-glow' : 'bg-muted-foreground'}`} />
      </div>

      <motion.div
        variants={fadeUpVariant}
        initial="hidden"
        animate={isVisible ? 'visible' : 'hidden'}
        className={`md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:ml-auto'}`}
      >
        <Card className="p-6 text-left relative overflow-hidden group">
          {item.isCurrent && (
            <div className="absolute top-0 right-0 w-16 h-16 bg-accent/10 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-500" />
          )}
          
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
            <h3 className="text-xl font-bold text-foreground">{item.role}</h3>
            <Badge variant={item.isCurrent ? 'accent' : 'default'} className="w-fit">
              {item.start} — {item.end}
            </Badge>
          </div>
          
          <div className="text-base font-medium text-accent mb-4">{item.company}</div>
          
          <ul className="space-y-2 text-sm text-muted-foreground">
            {item.highlights.map((highlight, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-accent opacity-50 mt-1 font-mono">{'>'}</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ul>
        </Card>
      </motion.div>
    </div>
  )
}

export function ExperienceSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  })

  // Scale the line vertically as we scroll down
  const scaleY = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section id="experience" className="py-24 sm:py-32 bg-muted/20 relative">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <SectionHeading
          eyebrow="Career"
          title="Experience"
          subtitle="My professional journey building scalable systems and AI products."
          className="mb-16 md:text-center mx-auto"
        />

        <div ref={containerRef} className="relative max-w-4xl mx-auto">
          {/* Background Timeline Line */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-border -translate-x-px md:-translate-x-1/2" />
          
          {/* Animated Foreground Timeline Line */}
          <motion.div
            className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-accent -translate-x-px md:-translate-x-1/2 origin-top"
            style={{ scaleY }}
          />

          <div className="space-y-12 md:space-y-24">
            {experience.map((item, index) => (
              <ExperienceItem key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
