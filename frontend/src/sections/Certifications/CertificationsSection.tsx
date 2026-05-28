import { SectionHeading } from '@/components/SectionHeading'
import { Card } from '@/components/Card'
import { certifications } from '@/config/certifications'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { motion } from 'framer-motion'
import { fadeUpVariant, staggerContainer } from '@/utils/animationHelpers'

export function CertificationsSection() {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 })

  return (
    <section id="certifications" className="py-24 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <SectionHeading
          eyebrow="Learning"
          title="Certifications"
          className="mb-16"
        />

        <motion.div
          ref={ref}
          variants={staggerContainer(0.1)}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {certifications.map((cert) => (
            <motion.div key={cert.id} variants={fadeUpVariant}>
              <Card hoverLift className="p-5 h-full flex flex-col relative overflow-hidden group">
                <div className="absolute right-[-10px] top-[-10px] text-6xl opacity-5 group-hover:opacity-10 group-hover:scale-110 transition-all duration-500">
                  {cert.icon}
                </div>
                
                <div className="text-2xl mb-3">{cert.icon}</div>
                <h3 className="font-bold text-foreground mb-1 leading-tight relative z-10">{cert.name}</h3>
                <div className="text-sm text-muted-foreground relative z-10">{cert.issuer}</div>
                
                {cert.date && (
                  <div className="mt-auto pt-4 text-xs font-mono text-muted-foreground/70 relative z-10">
                    {cert.date}
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
