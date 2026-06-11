import { SectionHeading } from '@/components/SectionHeading'
import { GlowCard } from '@/components/GlowCard'
import { Badge } from '@/components/Badge'
import { Button } from '@/components/Button'
import { AI_TOOLS } from '@/config/aiTools'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { motion } from 'framer-motion'
import { fadeUpVariant, staggerContainer } from '@/utils/animationHelpers'
import { useNavigate } from 'react-router-dom'
import { ToolIcon } from './ToolIcon'

export function AIToolsSection() {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 })
  const navigate = useNavigate()

  return (
    <section id="ai-tools" className="py-24 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <SectionHeading
          eyebrow="AI Lab"
          title="AI-Powered Tools"
          subtitle="Interactive tools built with LLMs and modern AI — try them right from your browser."
          className="mb-16"
        />

        <motion.div
          ref={ref}
          variants={staggerContainer(0.15)}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
          className="grid gap-6 md:grid-cols-2"
        >
          {AI_TOOLS.map((tool) => (
            <motion.div key={tool.id} variants={fadeUpVariant} className="flex">
              <GlowCard className="flex flex-col h-full w-full p-8">
                <div className="flex-1 flex flex-col">
                  {/* Header: Icon + Badge */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
                      <ToolIcon name={tool.icon} size={26} />
                    </div>
                    <Badge variant="accent">{tool.badgeLabel}</Badge>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-foreground tracking-tight mb-3">
                    {tool.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed flex-1">
                    {tool.description}
                  </p>

                  {/* Accepted Formats */}
                  <div className="mb-6">
                    <p className="text-xs font-mono text-muted-foreground mb-2 opacity-60">
                      --accepted-formats:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {tool.acceptedFormats.map((fmt) => (
                        <span
                          key={fmt}
                          className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/50"
                        >
                          {fmt}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={() => navigate(tool.route)}
                    className="w-full font-mono"
                  >
                    <span className="mr-2 opacity-70">./</span>
                    {tool.ctaLabel.toLowerCase().replace(/\s/g, '_')}.sh
                  </Button>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
