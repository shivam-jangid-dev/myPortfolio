import type { Project } from './types'

export const projects: Project[] = [
  {
    id: 'ai-portfolio',
    title: 'AI Portfolio Site (shivamjangid)',
    summary:
      'Personal brand site with live AI tools: Resume Analyzer and GitHub Repo Explainer.',
    description:
      'An AI engineering personal platform showcasing production-style AI tools. Backend built with FastAPI and LangChain, using Groq for LLM inference — the Repo Explainer uses a vectorless RAG approach, reasoning directly over repo structure instead of embeddings, while the Resume Analyzer extracts and parses PDFs with PyMuPDF. Frontend built with React, Tailwind CSS, and Vite, deployed on Netlify with the API deployed separately on Render.',
    tech: ['FastAPI', 'LangChain', 'Groq', 'RAG', 'React', 'Tailwind CSS', 'Vite', 'Netlify', 'Render'],
    highlights: [
      'Two production-style AI tools: Resume Analyzer and GitHub Repo Explainer',
      'Vectorless RAG — LLM reasons over repo file structure instead of vector embeddings',
      'Rate-limited API endpoints via slowapi',
      'Split deploy: Netlify (frontend) + Render (backend)',
    ],
    links: [{ label: 'Live site', href: '' }],
  },
  {
    id: 'cli-chatbot',
    title: 'CrackAi',
    summary: 'Ai that help you crack role/job in your dream company ',
    description:
      'CrackAi is a platform that help you crack role/job in your dream company .',
    tech: ['Python', 'Claude API', 'Streaming'],
    highlights: ['Streaming responses', 'Conversation memory', 'Mode switching (code / explain / review)'],
     links: [{ label: 'comming soon...', href: '' }],
  },
  {
    id: 'ai-travel-agent',
    title: 'Ai Travel Agent',
    summary: 'Ai Travel Agent that help you plan your travel.',
    description:
      'Ai Travel Agent that help you plan your travel.',
    tech: ['Python', 'Claude API', 'Streaming'],
    highlights: ['Streaming responses', 'Conversation memory', 'Mode switching (code / explain / review)'],
     links: [{ label: 'comming soon...', href: '' }],
  },
]

export function getProjectById(id: string): Project | undefined {
  return projects.find((p) => p.id === id)
}
