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

/* ─── Chat with Notes ─── */

export type ChatSession = {
  sessionId: string
  title: string
  summary: string
  keyPoints: string[]
}

/**
 * POST /chat-with-notes  (Phase 1 — upload)
 * Sends the notes file to the backend for ingestion.
 * Returns a ChatSession with the backend-issued session_id.
 */
export async function uploadDocument(file: File): Promise<ChatSession> {
  const form = new FormData()
  form.append('notes', file)

  const res = await fetch(`${API_BASE_URL}/chat-with-notes`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    const detail = await parseErrorDetail(res)
    throw new Error(detail)
  }

  const data: { message: string; session_id: string } = await res.json()

  // Build the ChatSession shape the UI expects.
  // The backend returns only session_id; title/summary/keyPoints
  // are derived client-side (the backend does not generate them).
  const baseName = file.name.replace(/\.[^/.]+$/, '')
  return {
    sessionId: data.session_id,
    title: baseName,
    summary:
      'Document successfully ingested and indexed. Ask any question about its content below.',
    keyPoints: [
      'All pages parsed and embedded',
      'Knowledge index ready for queries',
      'Ask specific questions for best results',
    ],
  }
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

/**
 * POST /chat-with-notes  (Phase 2 — query)
 * Sends the user query and session_id to the backend.
 * Returns the AI-generated answer string.
 */
export async function sendChatMessage(
  sessionId: string,
  message: string,
): Promise<string> {
  const form = new FormData()
  form.append('session_id', sessionId)
  form.append('user_query', message)

  const res = await fetch(`${API_BASE_URL}/chat-with-notes`, {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    const detail = await parseErrorDetail(res)
    throw new Error(detail)
  }

  const data: { message: string; results: string; session_id: string } =
    await res.json()
  return data.results
}
