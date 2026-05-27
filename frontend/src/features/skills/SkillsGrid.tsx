import { SectionHeading } from '@/components/SectionHeading'
import { skillGroups } from '@/config/skills'
import { useSectionReveal } from '@/hooks/useSectionReveal'
import { useRef } from 'react'

export function SkillsGrid() {
  const ref = useRef<HTMLElement>(null)
  useSectionReveal(ref)

  return (
    <section ref={ref} id="skills" className="scroll-mt-24 border-y border-border/80 bg-muted/20 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-12">
        <SectionHeading
          eyebrow="Skills"
          title="Stack tuned for AI backends and production APIs."
          subtitle="Grouped for quick scanning — extend groups in config/skills.ts."
        />
        <div className="grid gap-6 md:grid-cols-2">
          {skillGroups.map((group) => (
            <div
              key={group.id}
              className="rounded-xl border border-border bg-background/80 p-6 backdrop-blur-sm"
            >
              <h3 className="font-display text-base font-semibold text-accent">{group.label}</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-foreground"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
