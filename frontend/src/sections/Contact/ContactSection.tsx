import { SectionHeading } from '@/components/SectionHeading'
import { Card } from '@/components/Card'
import { LinkButton } from '@/components/Button'
import { profile } from '@/config/profile'
import { education } from '@/config/education'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { motion } from 'framer-motion'
import { fadeUpVariant } from '@/utils/animationHelpers'

export function ContactSection() {
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({ threshold: 0.1 })

  return (
    <section id="contact" className="py-24 sm:py-32 bg-muted/20 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 max-w-6xl">
        <motion.div
          ref={ref}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
          variants={fadeUpVariant}
          className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-start"
        >
          {/* Left: Contact Info & CTAs */}
          <div>
            <SectionHeading
              eyebrow="Connect"
              title="Get In Touch"
              subtitle="I'm currently open to new opportunities. Whether you have a question or just want to say hi, I'll try my best to get back to you!"
              className="mb-8"
            />

            <div className="flex flex-col gap-4 mb-10">
              <a href={`mailto:${profile.email}`} className="text-xl font-medium text-foreground hover:text-accent transition-colors flex items-center gap-3">
                <span className="text-accent opacity-70">✉</span> {profile.email}
              </a>
              <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-xl font-medium text-foreground hover:text-accent transition-colors flex items-center gap-3">
                <span className="text-accent opacity-70">in</span> {profile.linkedinLabel || profile.linkedin.split('/').pop()}
              </a>
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-xl font-medium text-foreground hover:text-accent transition-colors flex items-center gap-3">
                  <span className="text-accent opacity-70">git</span> {profile.github.replace('https://github.com/', '')}
                </a>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <LinkButton href={`mailto:${profile.email}`} className="font-mono">
                <span className="mr-2 opacity-70">./</span>send_email.sh
              </LinkButton>
              <LinkButton variant="outline" href="/Shivam_Jangid_Resume.pdf" target="_blank" rel="noopener noreferrer" className="font-mono">
                <span className="mr-2 opacity-70">cat</span>resume.pdf
              </LinkButton>
            </div>
          </div>

          {/* Right: Education Sidebar */}
          <div className="lg:pl-12">
            <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="text-accent font-mono text-xl">~%</span> Education
            </h3>
            
            <div className="space-y-6">
              {education?.map((edu) => (
                <Card key={edu.id} className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <h4 className="font-bold text-foreground">{edu.degree}</h4>
                    <span className="text-sm font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                      {edu.year}
                    </span>
                  </div>
                  <div className="text-accent font-medium mb-3">{edu.school}</div>
                  
                  {edu.details && (
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {edu.details.map((detail, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-accent opacity-50 mt-1 font-mono">{'>'}</span>
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
