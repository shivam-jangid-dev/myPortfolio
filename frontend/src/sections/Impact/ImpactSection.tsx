import { SectionHeading } from '@/components/SectionHeading'
import { Card } from '@/components/Card'
import { CountUp } from '@/components/CountUp'
import { metrics } from '@/config/metrics'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { motion } from 'framer-motion'
import { fadeUpVariant, staggerContainer } from '@/utils/animationHelpers'

export function ImpactSection() {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 })

  return (
    <section id="impact" className="py-24 sm:py-32 bg-muted/20 border-y border-border">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <SectionHeading
          eyebrow="Results"
          title="Impact by the Numbers"
          subtitle="Quantifiable achievements from my engineering career."
          className="mb-16 md:text-center mx-auto"
        />

        <motion.div
          ref={ref}
          variants={staggerContainer(0.1)}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {metrics.map((metric) => (
            <motion.div key={metric.id} variants={fadeUpVariant}>
              <Card className="p-6 h-full flex flex-col justify-center text-center group border-accent/20 bg-background/50 backdrop-blur-sm">
                <div className="text-sm font-semibold tracking-wide text-muted-foreground uppercase mb-2">
                  {metric.label}
                </div>
                <div className="text-4xl md:text-5xl font-bold text-accent font-mono my-2 group-hover:scale-105 transition-transform duration-300">
                  <CountUp value={metric.value} suffix={metric.suffix} />
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {metric.description}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
