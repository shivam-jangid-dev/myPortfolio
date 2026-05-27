import type { SkillGroup } from './types'

export const skillGroups: SkillGroup[] = [
  {
    id: 'ai',
    label: 'AI & LLM',
    items: [
      'LangChain',
      'Claude API',
      'OpenAI API',
      'RAG',
      'Vector DBs (ChromaDB)',
      'Prompt Engineering',
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    items: ['Python', 'FastAPI', 'Flask', 'Node.js', 'RESTful APIs', 'Apache Airflow', 'WebSockets'],
  },
  {
    id: 'cloud',
    label: 'Cloud & DevOps',
    items: ['AWS (EC2, S3, Lambda, IAM)', 'Docker', 'Git', 'GitHub Actions', 'Firebase'],
  },
  {
    id: 'datastores',
    label: 'Databases',
    items: ['PostgreSQL', 'MySQL', 'MongoDB', 'OpenSearch', 'Redis'],
  },
  {
    id: 'data',
    label: 'Data & Analytics',
    items: ['Pandas', 'NumPy', 'Tableau', 'SQL'],
  },
  {
    id: 'fe',
    label: 'Frontend & Mobile',
    items: ['Flutter', 'HTML', 'CSS', 'Tailwind CSS'],
  },
  {
    id: 'languages',
    label: 'Languages',
    items: ['Python', 'JavaScript', 'Java', 'Dart', 'SQL'],
  },
]
