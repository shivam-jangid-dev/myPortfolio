import { SectionHeading } from '@/components/SectionHeading'
import { projects } from '@/config/projects'
import { useSectionReveal } from '@/hooks/useSectionReveal'
import { useRef } from 'react'
import { Link } from 'react-router-dom'

export function ProjectsSection() {
  const ref = useRef<HTMLElement>(null)
  useSectionReveal(ref)

  return (
    <section ref={ref} id="projects" className="scroll-mt-24 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-12">
        <SectionHeading
          eyebrow="Projects"
          title="Featured work — swap entries in config/projects.ts."
          subtitle="Each card deep-links to a case-study style detail route."
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/projects/${p.id}`}
              className="group flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-lg"
            >
              <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-accent">
                {p.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{p.summary}</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {p.tech.slice(0, 5).map((t) => (
                  <li key={t} className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {t}
                  </li>
                ))}
              </ul>
              <span className="mt-6 text-sm font-semibold text-accent">View case study →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
