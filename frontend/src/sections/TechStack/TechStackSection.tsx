import { SectionHeading } from '@/components/SectionHeading'
import { skillGroups } from '@/config/skills'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { motion } from 'framer-motion'
import { fadeUpVariant, staggerContainer } from '@/utils/animationHelpers'

function SkillPanel({ group }: { group: typeof skillGroups[0] }) {
  return (
    <motion.div
      variants={fadeUpVariant}
      className="rounded-lg border border-border bg-card overflow-hidden hover:border-accent/40 transition-colors duration-300"
    >
      <div className="border-b border-border bg-muted/50 px-4 py-2 flex items-center gap-2">
        <span className="text-lg">{group.icon}</span>
        <h3 className="font-mono text-sm font-semibold text-foreground">{group.label}</h3>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          {group.items.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground ring-1 ring-inset ring-border transition-colors hover:bg-accent/10 hover:text-accent hover:ring-accent/20"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export function TechStackSection() {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 })

  return (
    <section id="tech-stack" className="py-24 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <SectionHeading
          eyebrow="Skills"
          title="Tech Stack"
          subtitle="The tools and technologies I use to build scalable systems."
          className="mb-16"
        />

        <motion.div
          ref={ref}
          variants={staggerContainer(0.05)}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {skillGroups.map((group) => (
            <SkillPanel key={group.id} group={group} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
