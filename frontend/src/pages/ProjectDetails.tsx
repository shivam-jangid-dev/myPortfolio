import { getProjectById } from '@/config/projects'
import { motion } from 'framer-motion'
import { Link, useParams } from 'react-router-dom'

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: { opacity: 0, y: -10, transition: { duration: 0.3 } },
}

export function ProjectDetails() {
  const { projectId } = useParams<{ projectId: string }>()
  const project = projectId ? getProjectById(projectId) : undefined

  if (!project) {
    return (
      <motion.div
        className="mx-auto max-w-2xl px-4 py-32 text-center sm:px-6"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <h1 className="font-display text-3xl font-semibold text-foreground">Project not found</h1>
        <p className="mt-4 text-muted-foreground">Check the URL or pick a project from the home page.</p>
        <Link
          to="/"
          className="mt-8 inline-flex rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
        >
          Back to home
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.article
      className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Case study</p>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
        {project.title}
      </h1>
      <ul className="mt-6 flex flex-wrap gap-2">
        {project.tech.map((t) => (
          <li key={t} className="rounded-md bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {t}
          </li>
        ))}
      </ul>
      <p className="mt-8 text-lg leading-relaxed text-muted-foreground">{project.description}</p>
      {project.highlights?.length ? (
        <ul className="mt-8 list-disc space-y-2 pl-6 text-muted-foreground">
          {project.highlights.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      ) : null}
      {project.links?.length ? (
        <div className="mt-10 flex flex-wrap gap-3">
          {project.links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-accent underline-offset-4 hover:underline"
            >
              {l.label}
            </a>
          ))}
        </div>
      ) : null}
      <div className="mt-14">
        <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </div>
    </motion.article>
  )
}
