import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ToolPageLayout } from '@/components/ToolPageLayout'
import { Button } from '@/components/Button'
import { AI_TOOLS } from '@/config/aiTools'
import { analyzeRepo, type RepoExplanation } from '@/utils/aiToolsApi'
import { cn } from '@/utils/cn'

const tool = AI_TOOLS.find((t) => t.id === 'repo-explainer')!

type PageState = 'input' | 'loading' | 'results' | 'error'

/* ─── GitHub URL validation ─── */
const GITHUB_URL_RE = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/?$/

function isValidGitHubUrl(url: string): boolean {
  return GITHUB_URL_RE.test(url.trim())
}

/* ─── Progressive Loading Steps ─── */
function AnalysisLoader() {
  const [dots, setDots] = useState('')
  const [step, setStep] = useState(0)

  const steps = [
    'Fetching repo structure',
    'Deciding what to look at',
    'Reading key files',
    'Writing explanation',
  ]

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 400)
    return () => clearInterval(dotInterval)
  }, [])

  useEffect(() => {
    // Each step progresses after increasing delays to feel realistic
    const delays = [2500, 4000, 6000]
    const timers: ReturnType<typeof setTimeout>[] = []

    delays.forEach((delay, i) => {
      timers.push(
        setTimeout(() => {
          setStep((s) => Math.max(s, i + 1))
        }, delay),
      )
    })

    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 space-y-6"
    >
      {/* Spinner */}
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-2 border-border" />
        <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-t-accent animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
          >
            <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
          </svg>
        </div>
      </div>

      <div className="text-center font-mono space-y-3">
        {steps.map((s, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: i <= step ? 1 : 0.2, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="text-xs text-muted-foreground flex items-center justify-center gap-2"
          >
            {i < step ? (
              <span className="text-emerald-400">✓</span>
            ) : i === step ? (
              <span className="text-accent">{'>'}</span>
            ) : (
              <span className="opacity-30">○</span>
            )}
            {s}
            {i === step ? dots : ''}
          </motion.p>
        ))}
      </div>

      <p className="text-[10px] font-mono text-muted-foreground/40 mt-4">
        This usually takes 15–30 seconds
      </p>
    </motion.div>
  )
}

/* ─── Collapsible Section ─── */
function Section({
  icon,
  title,
  children,
  defaultOpen = true,
}: {
  icon: string
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/30"
      >
        <span className="text-lg">{icon}</span>
        <span className="flex-1 text-sm font-semibold text-foreground font-mono">
          {title}
        </span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="px-5 pb-5 border-t border-border/50 pt-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ─── Results Display ─── */
function ResultsView({
  data,
  onReset,
}: {
  data: RepoExplanation
  onReset: () => void
}) {
  const { metadata, explanation, files_read, analysis_rounds } = data

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      {/* Repo Header */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent border border-accent/20">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold font-mono text-foreground">
              {metadata.full_name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {metadata.description}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {metadata.stars.toLocaleString()}
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="18" r="3" />
                  <circle cx="6" cy="6" r="3" />
                  <circle cx="18" cy="6" r="3" />
                  <path d="M18 9v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9" />
                  <path d="M12 12v3" />
                </svg>
                {metadata.forks.toLocaleString()}
              </span>
              {metadata.language && (
                <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full bg-accent" />
                  {metadata.language}
                </span>
              )}
            </div>
            {metadata.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {metadata.topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full bg-accent/10 text-accent border border-accent/20 px-2.5 py-0.5 text-[10px] font-mono"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Explanation Sections */}
      <Section icon="🎯" title="What it does">
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
          {explanation.what_it_does}
        </p>
      </Section>

      <Section icon="🛠" title="Tech stack">
        <div className="flex flex-wrap gap-2">
          {explanation.tech_stack.map((tech, i) => (
            <span
              key={i}
              className="rounded-lg bg-muted border border-border px-3 py-1.5 text-xs font-mono text-foreground/80"
            >
              {tech}
            </span>
          ))}
        </div>
      </Section>

      <Section icon="🏗" title="Architecture overview">
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
          {explanation.architecture}
        </p>
      </Section>

      <Section icon="🚀" title="How to get started">
        <div className="rounded-lg bg-background border border-border p-4 font-mono text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
          {explanation.getting_started}
        </div>
      </Section>

      {explanation.notable && (
        <Section icon="💡" title="Notable observations" defaultOpen={false}>
          <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {explanation.notable}
          </p>
        </Section>
      )}

      {/* Files Read Transparency Panel */}
      <Section icon="📂" title={`Files read (${files_read.length} files)`} defaultOpen={false}>
        <div className="space-y-2">
          <p className="text-[10px] font-mono text-muted-foreground/60 mb-3">
            Analysis completed in {analysis_rounds} round{analysis_rounds !== 1 ? 's' : ''} — the AI chose these files to understand the repo:
          </p>
          <div className="rounded-lg bg-background border border-border p-3 max-h-48 overflow-y-auto">
            {files_read.map((file, i) => (
              <p
                key={i}
                className="text-xs font-mono text-foreground/70 py-0.5 flex items-center gap-2"
              >
                <span className="text-accent/50">▸</span>
                {file}
              </p>
            ))}
          </div>
        </div>
      </Section>

      {/* Reset Button */}
      <div className="flex justify-center pt-4">
        <Button onClick={onReset} className="font-mono px-8">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span className="opacity-70 mr-1">./</span>analyze_another.sh
        </Button>
      </div>
    </motion.div>
  )
}

/* ─── Main Page ─── */
export function RepoExplainerPage() {
  const [url, setUrl] = useState('')
  const [state, setState] = useState<PageState>('input')
  const [result, setResult] = useState<RepoExplanation | null>(null)
  const [error, setError] = useState<string | null>(null)

  const urlValid = isValidGitHubUrl(url)

  const handleAnalyze = async () => {
    if (!urlValid) return
    setState('loading')
    setError(null)

    try {
      const data = await analyzeRepo(url)
      setResult(data)
      setState('results')
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred.'
      setError(message)
      setState('error')
    }
  }

  const handleReset = () => {
    setUrl('')
    setResult(null)
    setError(null)
    setState('input')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && urlValid) {
      e.preventDefault()
      handleAnalyze()
    }
  }

  return (
    <ToolPageLayout
      title={tool.title}
      description={tool.description}
      badgeLabel={tool.badgeLabel}
    >
      <AnimatePresence mode="wait">
        {/* ── Input State ── */}
        {state === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* URL Input */}
            <div className="rounded-xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground/60">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
                --repo-url:
              </div>

              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="https://github.com/owner/repo"
                  className={cn(
                    'w-full rounded-lg border bg-background px-4 py-3 text-sm text-foreground font-mono',
                    'placeholder:text-muted-foreground/40 outline-none transition-all',
                    'focus:ring-2 focus:ring-accent/20',
                    url && !urlValid
                      ? 'border-red-400/50 focus:border-red-400/50'
                      : 'border-border focus:border-accent/50',
                  )}
                  id="repo-url-input"
                  autoFocus
                />
                {url && !urlValid && (
                  <p className="absolute -bottom-5 left-0 text-[10px] font-mono text-red-400">
                    Must be a valid GitHub URL: https://github.com/owner/repo
                  </p>
                )}
              </div>

              <p className="text-[10px] font-mono text-muted-foreground/40 pt-1">
                Paste any public GitHub repo URL • The AI will explore its structure and explain it
              </p>
            </div>

            {/* Analyze Button */}
            <div className="flex justify-center pt-2">
              <Button
                onClick={handleAnalyze}
                disabled={!urlValid}
                className={cn(
                  'font-mono px-8',
                  !urlValid && 'opacity-40 cursor-not-allowed',
                )}
                id="analyze-button"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span className="opacity-70 mr-1">./</span>analyze_repo.sh
              </Button>
            </div>

            {/* How it works card */}
            <div className="rounded-xl border border-border/50 bg-card/50 p-5 mt-4">
              <p className="text-xs font-mono text-muted-foreground/60 mb-3">
                --how-it-works:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { step: '01', label: 'Fetches the full file tree from GitHub' },
                  { step: '02', label: 'AI selects the most informative files to read' },
                  { step: '03', label: 'Iteratively gathers more context if needed' },
                  { step: '04', label: 'Synthesizes a structured explanation' },
                ].map(({ step, label }) => (
                  <div key={step} className="flex items-start gap-2.5">
                    <span className="text-accent font-mono text-xs font-bold shrink-0 mt-0.5 opacity-70">
                      {step}
                    </span>
                    <p className="text-xs text-foreground/60 leading-relaxed">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Loading State ── */}
        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AnalysisLoader />
          </motion.div>
        )}

        {/* ── Results State ── */}
        {state === 'results' && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ResultsView data={result} onReset={handleReset} />
          </motion.div>
        )}

        {/* ── Error State ── */}
        {state === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="h-12 w-12 rounded-full bg-red-400/10 flex items-center justify-center">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-red-400"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
              </div>
              <p className="text-sm font-mono text-red-400 font-semibold">
                Analysis failed
              </p>
              <p className="text-xs font-mono text-muted-foreground max-w-md mx-auto">
                {error}
              </p>
            </div>

            <div className="flex justify-center">
              <Button onClick={handleReset} className="font-mono px-8">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
                <span className="opacity-70 mr-1">./</span>try_again.sh
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToolPageLayout>
  )
}
