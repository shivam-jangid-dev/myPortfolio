// API base URL is available via: import { API_BASE_URL } from '@/config/aiTools'
import {
  mockResumeAnalysis,
  type ResumeAnalysisResult,
} from './mockApiResponses'

/* ──────────────────────────────────────────────
   AI Tools API Layer
   Currently returns mock data with simulated delay.
   Swap the implementations to real fetch() calls
   when the FastAPI backend is ready.
   ────────────────────────────────────────────── */

/** Simulates network latency */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* ─── Resume Analyser ─── */

export async function analyseResume(
  _file: File,
): Promise<ResumeAnalysisResult> {
  // TODO: Replace with real API call
  // const form = new FormData()
  // form.append('file', file)
  // const res = await fetch(`${API_BASE_URL}/api/resume/analyse`, {
  //   method: 'POST',
  //   body: form,
  // })
  // if (!res.ok) throw new Error('Analysis failed')
  // return res.json()

  await delay(2500) // simulate processing time
  return { ...mockResumeAnalysis }
}

/* ─── Chat with Notes ─── */

export type ChatSession = {
  sessionId: string
  title: string
  summary: string
  keyPoints: string[]
}

export async function uploadDocument(_file: File): Promise<ChatSession> {
  // TODO: Replace with real API call
  // const form = new FormData()
  // form.append('file', file)
  // const res = await fetch(`${API_BASE_URL}/api/chat/upload`, {
  //   method: 'POST',
  //   body: form,
  // })
  // if (!res.ok) throw new Error('Upload failed')
  // return res.json()

  const fileName = _file.name
  await delay(3000) // simulate document processing
  return {
    sessionId: 'mock-session-' + Date.now(),
    title: fileName.replace(/\.[^/.]+$/, ''),
    summary:
      'This document covers key concepts and detailed information that can be explored through conversational AI queries.',
    keyPoints: [
      'Document successfully processed and indexed',
      'All sections are available for querying',
      'Ask any question about the content',
    ],
  }
}

export type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export async function sendChatMessage(
  _sessionId: string,
  message: string,
): Promise<string> {
  // TODO: Replace with real API call
  // const res = await fetch(`${API_BASE_URL}/api/chat/query`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ session_id: sessionId, query: message }),
  // })
  // if (!res.ok) throw new Error('Query failed')
  // const data = await res.json()
  // return data.response

  await delay(1500)
  const responses = [
    `Based on the document, here's what I found regarding your question:\n\nThe content discusses several key aspects related to "${message.slice(0, 40)}...". The main points include structured approaches to the topic, detailed examples, and practical applications that can be directly applied.\n\nWould you like me to elaborate on any specific aspect?`,
    `Great question! Looking through your document, I can provide the following insight:\n\nThe document addresses this topic in multiple sections. The core idea revolves around practical implementation and theoretical foundations. There are specific examples and case studies that illustrate these concepts clearly.\n\nFeel free to ask follow-up questions for more detail.`,
    `After analyzing the relevant sections of your document, here's a comprehensive answer:\n\nThe material covers this from both a conceptual and practical standpoint. Key takeaways include the importance of systematic approaches, evidence-based methods, and iterative improvement. The document also references several frameworks that support these ideas.\n\nLet me know if you'd like to dive deeper into any particular area.`,
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}
