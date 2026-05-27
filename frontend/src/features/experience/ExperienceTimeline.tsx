import { SectionHeading } from '@/components/SectionHeading'
import { experience } from '@/config/experience'
import { useSectionReveal } from '@/hooks/useSectionReveal'
import { useRef } from 'react'

export function ExperienceTimeline() {
  const ref = useRef<HTMLElement>(null)
  useSectionReveal(ref)

  return (
    <section ref={ref} id="experience" className="scroll-mt-24 bg-muted/15 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-12">
        <SectionHeading
          eyebrow="Experience"
          title="Shipping APIs, pipelines, and AI features in production."
        />
        <div className="relative space-y-12 pl-6 sm:pl-10">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border sm:left-[15px]" aria-hidden />
          {experience.map((job) => (
            <article key={job.id} className="relative">
              <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-background bg-accent sm:-left-10 sm:top-2" />
              <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-foreground">{job.role}</h3>
                    <p className="text-sm font-medium text-accent">{job.company}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {job.start} — {job.end}
                  </p>
                </div>
                <ul className="mt-5 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-accent">
                  {job.highlights.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
