import type { Project } from './types'

export const projects: Project[] = [
  {
    id: 'ai-portfolio',
    title: 'AI Portfolio Site (shivamjangid.dev)',
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
