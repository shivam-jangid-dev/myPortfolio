import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ToolPageLayout } from '@/components/ToolPageLayout'
import { FileUpload } from '@/components/FileUpload'
import { Button } from '@/components/Button'
import { AI_TOOLS } from '@/config/aiTools'
import { analyseResume } from '@/utils/aiToolsApi'
import type { ResumeAnalysisResult } from '@/utils/mockApiResponses'
import { cn } from '@/utils/cn'

const tool = AI_TOOLS.find((t) => t.id === 'resume-analyser')!

type PageState = 'upload' | 'loading' | 'results'

/* ─── Animated Score Ring ─── */
function ScoreRing({ score, size = 160 }: { score: number; size?: number }) {
  const [displayScore, setDisplayScore] = useState(0)
  const circumference = 2 * Math.PI * 62
  const offset = circumference - (displayScore / 100) * circumference

  useEffect(() => {
    let frame: number
    const duration = 1500
    const start = performance.now()

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(eased * score))
      if (progress < 1) frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const getScoreColor = () => {
    if (displayScore >= 80) return 'text-emerald-400'
    if (displayScore >= 60) return 'text-amber-400'
    return 'text-red-400'
  }

  const getStrokeColor = () => {
    if (displayScore >= 80) return '#34d399'
    if (displayScore >= 60) return '#fbbf24'
    return '#f87171'
  }

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={62}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="8"
        />
        {/* Score ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={62}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-100"
          style={{ filter: `drop-shadow(0 0 8px ${getStrokeColor()}40)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-4xl font-bold font-mono tabular-nums', getScoreColor())}>
          {displayScore}
        </span>
        <span className="text-xs text-muted-foreground font-mono mt-1">/100</span>
      </div>
    </div>
  )
}

/* ─── Terminal Loader ─── */
function TerminalLoader() {
  const [dots, setDots] = useState('')

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 400)
    return () => clearInterval(interval)
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
      </div>

      <div className="text-center font-mono space-y-2">
        <p className="text-sm text-foreground">
          <span className="text-accent">{'>'}</span> analysing_resume{dots}
        </p>
        <p className="text-xs text-muted-foreground opacity-60">
          Running AI analysis pipeline
        </p>
      </div>
    </motion.div>
  )
}

/* ─── Results Section ─── */
function ResultsView({
  result,
  onReset,
}: {
  result: ResumeAnalysisResult
  onReset: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-8"
    >
      {/* Score + Summary Row */}
      <div className="flex flex-col sm:flex-row items-center gap-8 rounded-xl border border-border bg-card p-6 sm:p-8">
        <ScoreRing score={result.score} />
        <div className="flex-1 text-center sm:text-left space-y-3">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h3 className="text-lg font-bold text-foreground">Resume Score</h3>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                result.score >= 80
                  ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20'
                  : result.score >= 60
                    ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                    : 'bg-red-400/10 text-red-400 border border-red-400/20',
              )}
            >
              {result.score >= 80 ? 'Excellent' : result.score >= 60 ? 'Good' : 'Needs Work'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
        </div>
      </div>

      {/* Strengths + Weaknesses Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Strengths */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <h4 className="font-semibold text-emerald-400 text-sm">Strengths</h4>
          </div>
          <ul className="space-y-3">
            {result.strengths.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="text-sm text-foreground/80 leading-relaxed flex gap-2"
              >
                <span className="text-emerald-400/60 mt-0.5 shrink-0">▸</span>
                {s}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Weaknesses */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <h4 className="font-semibold text-amber-400 text-sm">Areas to Improve</h4>
          </div>
          <ul className="space-y-3">
            {result.weaknesses.map((w, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="text-sm text-foreground/80 leading-relaxed flex gap-2"
              >
                <span className="text-amber-400/60 mt-0.5 shrink-0">▸</span>
                {w}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-accent/20 bg-accent/5 p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <h4 className="font-semibold text-accent text-sm">Recommendations</h4>
        </div>
        <ul className="space-y-3">
          {result.recommendations.map((r, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="text-sm text-foreground/80 leading-relaxed flex gap-2"
            >
              <span className="text-accent/60 mt-0.5 shrink-0">▸</span>
              {r}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      {/* Reset Button */}
      <div className="pt-4 flex justify-center">
        <Button variant="outline" onClick={onReset} className="font-mono">
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
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          <span className="opacity-70 mr-1">./</span>upload_another.sh
        </Button>
      </div>
    </motion.div>
  )
}

/* ─── Main Page ─── */
export function ResumeAnalyserPage() {
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<PageState>('upload')
  const [result, setResult] = useState<ResumeAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyse = async () => {
    if (!file) return
    setState('loading')
    setError(null)
    try {
      const data = await analyseResume(file)
      setResult(data)
      setState('results')
    } catch (err) {
      setError('Analysis failed. Please try again.')
      setState('upload')
    }
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    setState('upload')
    setError(null)
  }

  return (
    <ToolPageLayout
      title={tool.title}
      description={tool.description}
      badgeLabel={tool.badgeLabel}
    >
      <AnimatePresence mode="wait">
        {state === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <FileUpload
              acceptedFormats={tool.acceptedFormats}
              acceptedMimeTypes={tool.acceptedMimeTypes}
              onFileSelect={setFile}
              selectedFile={file}
              onFileRemove={() => setFile(null)}
            />

            {error && (
              <p className="text-xs font-mono text-red-400">
                <span className="opacity-60">error:</span> {error}
              </p>
            )}

            <div className="flex justify-center pt-2">
              <Button
                onClick={handleAnalyse}
                disabled={!file}
                className={cn(
                  'font-mono px-8',
                  !file && 'opacity-40 cursor-not-allowed',
                )}
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
                <span className="opacity-70 mr-1">./</span>analyse_resume.sh
              </Button>
            </div>
          </motion.div>
        )}

        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <TerminalLoader />
          </motion.div>
        )}

        {state === 'results' && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ResultsView result={result} onReset={handleReset} />
          </motion.div>
        )}
      </AnimatePresence>
    </ToolPageLayout>
  )
}
