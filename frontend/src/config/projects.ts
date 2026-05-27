import type { Project } from './types'

export const projects: Project[] = [
  {
    id: 'ai-portfolio',
    title: 'AI Portfolio Site (shivam.dev)',
    summary:
      'Personal brand site with live AI tools: Resume Analyzer, PDF Summarizer, and Cold Email Writer.',
    description:
      'A full-stack personal platform showcasing AI-assisted utilities. Backend combines FastAPI with LangChain and RAG patterns; integrated Claude API for high-quality completions. Frontend deployed on Vercel with API services on Railway for a split deployment model suited to serverless and long-running tasks.',
    tech: ['FastAPI', 'Claude API', 'LangChain', 'RAG', 'Next.js', 'Railway', 'Vercel'],
    highlights: [
      'Three production-style AI tools in one product surface',
      'RAG-oriented document workflows',
      'Split deploy: Vercel + Railway',
    ],
    links: [{ label: 'Live site', href: 'https://shivam.dev' }],
  },
  {
    id: 'cli-chatbot',
    title: 'CLI AI Chatbot',
    summary: 'Terminal chatbot with streaming, memory, modes, and session save.',
    description:
      'A developer-focused CLI that streams responses from Claude, keeps short-term conversation memory, and supports mode switching between code, explain, and review workflows. Sessions can be saved for continuity across invocations.',
    tech: ['Python', 'Claude API', 'Streaming'],
    highlights: ['Streaming responses', 'Conversation memory', 'Mode switching (code / explain / review)'],
  },
  {
    id: 'chatgpt-clone',
    title: 'ChatGPT Clone',
    summary: 'Full-stack AI chatbot with Flask backend and responsive Tailwind UI.',
    description:
      'End-to-end chat experience integrating OpenAI GPT-3.5 from a Flask backend with a responsive Tailwind CSS frontend. Demonstrates classic request/response and UI state patterns for conversational AI.',
    tech: ['Flask', 'GPT-3.5', 'Tailwind CSS', 'JavaScript'],
    highlights: ['REST integration with OpenAI', 'Responsive chat UI'],
  },
]

export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id)
}
