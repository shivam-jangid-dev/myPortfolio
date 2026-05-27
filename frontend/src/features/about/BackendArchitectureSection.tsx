import { SectionHeading } from '@/components/SectionHeading'
import { profile } from '@/config/profile'
import { useSectionReveal } from '@/hooks/useSectionReveal'
import { useRef } from 'react'

const layers = [
  {
    title: 'API & services',
    body: 'FastAPI / Flask gateways, REST contracts, auth, and rate-aware clients for LLM vendors.',
  },
  {
    title: 'Workflow & data',
    body: 'Apache Airflow for dependable ETL, scheduling, and observability across pipelines.',
  },
  {
    title: 'Persistence & search',
    body: 'PostgreSQL / Redis / MongoDB patterns plus OpenSearch for log analytics and faster MTTR.',
  },
  {
    title: 'Cloud & hardening',
    body: 'AWS primitives (EC2, S3, Lambda, IAM) with security audits (e.g., Prowler) mapped to CIS.',
  },
  {
    title: 'AI layer',
    body: 'LangChain, RAG, vector stores (ChromaDB), and streaming responses for production UX.',
  },
]

/**
 * Translates backend concerns into scannable architecture cards for recruiters.
 */
export function BackendArchitectureSection() {
  const ref = useRef<HTMLElement>(null)
  useSectionReveal(ref)

  return (
    <section ref={ref} id="about" className="scroll-mt-24 px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-14">
        <SectionHeading
          eyebrow="About"
          title="Backend systems, explained without the noise."
          subtitle={profile.summary.join(' ')}
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {layers.map((layer) => (
            <article
              key={layer.title}
              data-cursor="text"
              className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:border-accent/40 hover:shadow-md"
            >
              <h3 className="font-display text-lg font-semibold text-foreground">{layer.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{layer.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
