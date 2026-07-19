import type { Profile } from './types'

export const profile: Profile = {
  name: 'Shivam Jangid',
  title: 'AI Backend Engineer',
  tagline: 'Scalable APIs, AI integrations, and cloud-native systems.',
  location: 'Jaipur, India',
  email: 'somujangid12@gmail.com',
  phone: '+91 9887553886',
  linkedin: 'https://linkedin.com/in/shivam-jangid12',
  linkedinLabel: 'linkedin.com/in/shivam-jangid12',
  github: 'https://github.com/shivam-jangid-dev',
  summary: [
    'AI Backend Engineer with 1+ years building scalable Python systems, RESTful APIs, and AI-powered applications.',
    'Hands-on experience with LLM integrations, FastAPI, Apache Airflow, and AWS cloud infrastructure.',
    'Currently deepening expertise in LangChain, RAG systems, and agentic AI workflows.',
  ],
  cliIntro: [
    { prompt: 'visitor@shivamjangid.dev:~$', command: 'whoami' },
    { output: 'Shivam Jangid — AI Engineer' },
    { prompt: 'visitor@shivamjangid.dev:~$', command: 'cat skills.txt' },
    { output: 'Python • FastAPI • LangChain • Claude API • AWS • Docker • PostgreSQL' },
    { prompt: 'visitor@shivamjangid.dev:~$', command: 'cat summary.txt' },
    { output: 'Building scalable APIs and AI-powered products. 1+ year shipping production systems at Airat.in.' },
    { prompt: 'visitor@shivamjangid.dev:~$', command: './portfolio --start' },
    { output: '▸ Initializing portfolio...' },
  ],
}
