/* ──────────────────────────────────────────────
   AI Tool Registry
   Add a new tool → add an entry here + a page component.
   The AIToolsSection auto-renders all entries.
   ────────────────────────────────────────────── */

export type AITool = {
  id: string
  title: string
  description: string
  /** SVG icon rendered inside the card */
  icon: 'resume' | 'chat' | string
  /** File extensions the upload zone accepts */
  acceptedFormats: string[]
  /** MIME types for the file input */
  acceptedMimeTypes: string[]
  /** Route path (relative to /tools/) */
  route: string
  /** CTA button label */
  ctaLabel: string
  /** Badge label shown on the card */
  badgeLabel: string
  /** Accent color class override (optional) */
  accentClass?: string
}

export const AI_TOOLS: AITool[] = [
  {
    id: 'resume-analyser',
    title: 'Resume Analyser',
    description:
      'Upload your resume and get an AI-powered analysis with a detailed score, strengths, weaknesses, and actionable recommendations to improve it.',
    icon: 'resume',
    acceptedFormats: ['.pdf', '.doc', '.docx', '.png', '.jpeg', '.jpg'],
    acceptedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
    ],
    route: '/tools/resume-analyser',
    ctaLabel: 'Analyse Resume',
    badgeLabel: 'AI Powered',
  },
  {
    id: 'chat-with-notes',
    title: 'Chat with Notes',
    description:
      'Upload your notes or textbook and start an interactive AI chat session. Ask questions, get summaries, and explore your documents conversationally.',
    icon: 'chat',
    acceptedFormats: ['.pdf', '.doc', '.docx'],
    acceptedMimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    route: '/tools/chat-with-notes',
    ctaLabel: 'Start Chat',
    badgeLabel: 'RAG Based',
  },
]

/**
 * Backend API base URL — update when the FastAPI server is deployed.
 * Falls back to localhost for development.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
