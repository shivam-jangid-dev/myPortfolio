import type { SkillGroup } from './types'

export const skillGroups: SkillGroup[] = [
  {
    id: 'ai',
    label: 'AI & LLM',
    icon: '🤖',
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
    icon: '⚙️',
    items: ['Python', 'FastAPI', 'Flask', 'Node.js', 'RESTful APIs', 'Apache Airflow', 'WebSockets'],
  },
  {
    id: 'cloud',
    label: 'Cloud & DevOps',
    icon: '☁️',
    items: ['AWS (EC2, S3, Lambda, IAM)', 'Docker', 'Git', 'GitHub Actions', 'Firebase'],
  },
  {
    id: 'datastores',
    label: 'Databases',
    icon: '🗄️',
    items: ['PostgreSQL', 'MySQL', 'MongoDB', 'OpenSearch', 'Redis'],
  },
  {
    id: 'data',
    label: 'Data & Analytics',
    icon: '📊',
    items: ['Pandas', 'NumPy', 'Tableau', 'SQL'],
  },
  {
    id: 'fe',
    label: 'Frontend & Mobile',
    icon: '📱',
    items: ['React', 'Flutter', 'HTML', 'CSS', 'Tailwind CSS'],
  },
  {
    id: 'languages',
    label: 'Languages',
    icon: '💻',
    items: ['Python', 'JavaScript', 'Java', 'Dart', 'SQL'],
  },
]
