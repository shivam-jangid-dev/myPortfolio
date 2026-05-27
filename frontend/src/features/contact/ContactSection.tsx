import { Button, LinkButton } from '@/components/Button'
import { SectionHeading } from '@/components/SectionHeading'
import { certifications } from '@/config/certifications'
import { education } from '@/config/education'
import { profile } from '@/config/profile'
import { useSectionReveal } from '@/hooks/useSectionReveal'
import { useRef, useState } from 'react'

export function ContactSection() {
  const ref = useRef<HTMLElement>(null)
  useSectionReveal(ref)
  const [copied, setCopied] = useState(false)

  const mailto = `mailto:${profile.email}?subject=Project%20inquiry%20%E2%80%94%20${encodeURIComponent(profile.name)}`

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <section ref={ref} id="contact" className="scroll-mt-24 px-4 py-24 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-8">
          <SectionHeading
            eyebrow="Contact"
            title="Let’s build reliable backends and AI-powered products."
            subtitle="Available for full-time roles and selective high-trust contract work."
          />
          <div className="flex flex-wrap gap-3">
            <LinkButton href={mailto} variant="primary">
              Email me
            </LinkButton>
            <Button type="button" variant="outline" onClick={copyEmail}>
              {copied ? 'Copied' : 'Copy email'}
            </Button>
            <LinkButton href={profile.linkedin} variant="ghost" target="_blank" rel="noreferrer">
              LinkedIn
            </LinkButton>
          </div>
          <p className="text-sm text-muted-foreground">
            {profile.phone} · {profile.location}
          </p>
        </div>

        <aside className="space-y-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Education
            </h3>
            {education.map((e) => (
              <div key={e.id} className="mt-3">
                <p className="font-medium text-foreground">{e.degree}</p>
                <p className="text-sm text-muted-foreground">
                  {e.school} · {e.year}
                </p>
                {e.details?.map((d) => (
                  <p key={d} className="mt-2 text-sm text-muted-foreground">
                    {d}
                  </p>
                ))}
              </div>
            ))}
          </div>
          <div>
            <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Certifications
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {certifications.map((c) => (
                <li key={c.id}>
                  <span className="text-foreground">{c.name}</span> — {c.issuer}
                  {c.date ? ` (${c.date})` : ''}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  )
}
