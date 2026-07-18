import { API_BASE_URL } from '@/config/aiTools'
import type { ResumeAnalysisResult } from './mockApiResponses'

/* ──────────────────────────────────────────────
   AI Tools API Layer
   All functions talk to the FastAPI backend.
   Base URL is controlled by VITE_API_BASE_URL in .env.
   ────────────────────────────────────────────── */

/**
 * Parse a FastAPI error response and return a human-readable message.
 * FastAPI errors use { detail: string | object[] }.
 */
async function parseErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json()
    if (typeof body.detail === 'string') return body.detail
    if (Array.isArray(body.detail)) {
      return body.detail.map((d: { msg?: string }) => d.msg ?? String(d)).join(', ')
    }
    return `HTTP ${res.status}`
  } catch {
    return `HTTP ${res.status} ${res.statusText}`
  }
}

/* ─── Resume Analyser ─── */

/**
 * POST /resume-analysis
 * Sends the resume file (and optional job description) to the FastAPI backend
 * and returns the AI analysis result.
 */
export async function analyseResume(
  file: File,
  jobDescription?: string,
): Promise<ResumeAnalysisResult> {
  const form = new FormData()
  form.append('resume', file)
  if (jobDescription) {
    form.append('job_description', jobDescription)
  }

  const res = await fetch(`${API_BASE_URL}/resume-analysis`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    const detail = await parseErrorDetail(res)
    throw new Error(detail)
  }

  return res.json() as Promise<ResumeAnalysisResult>
}

/* ─── Repo Explainer ─── */

export type RepoExplanation = {
  session_id: string
  metadata: {
    full_name: string
    description: string
    language: string
    stars: number
    forks: number
    topics: string[]
  }
  explanation: {
    what_it_does: string
    tech_stack: string[]
    architecture: string
    getting_started: string
    notable: string
  }
  files_read: string[]
  analysis_rounds: number
}

/**
 * POST /repo-explain
 * Sends a GitHub repo URL to the backend for AI-powered analysis.
 * Returns a structured explanation of the repository.
 */
export async function analyzeRepo(repoUrl: string): Promise<RepoExplanation> {
  const res = await fetch(`${API_BASE_URL}/repo-explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ repo_url: repoUrl }),
  })

  if (!res.ok) {
    const detail = await parseErrorDetail(res)
    throw new Error(detail)
  }

  return res.json() as Promise<RepoExplanation>
}

export type AskRepoResponse = {
  answer: string
  session_id: string
}

/**
 * POST /repo-explain/ask
 * Sends a follow-up question to the backend for an analyzed repo session.
 */
export async function askRepoQuestion(sessionId: string, question: string): Promise<AskRepoResponse> {
  const res = await fetch(`${API_BASE_URL}/repo-explain/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, question }),
  })

  if (!res.ok) {
    const detail = await parseErrorDetail(res)
    throw new Error(detail)
  }

  return res.json() as Promise<AskRepoResponse>
}
