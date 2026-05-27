import type { ExperienceItem } from './types'

export const experience: ExperienceItem[] = [
  {
    id: 'airat',
    role: 'AI Backend Engineer',
    company: 'Airat.in',
    start: 'Jan 2025',
    end: 'Present',
    highlights: [
      'Built and deployed scalable RESTful APIs with Python (Flask & FastAPI), reducing API latency by ~15% and improving throughput for production services.',
      'Automated ETL workflows with Apache Airflow, saving 10+ engineering hours weekly while maintaining 99.9% pipeline uptime.',
      'Integrated LLM APIs (GPT-3.5 / Claude) into backend services for production AI features.',
      'Strengthened AWS security posture with Prowler audits; remediated 50+ high-risk issues aligned with CIS benchmarks.',
      'Implemented OpenSearch pipelines for real-time log analytics, reducing MTTR by ~30%.',
      'Built unit and integration testing frameworks reaching ~90% coverage; production incidents down ~25%.',
    ],
  },
  {
    id: 'dayton',
    role: 'Associate Application Developer',
    company: 'Dayton Natural Resources Pvt. Ltd.',
    start: 'Jan 2024',
    end: 'Aug 2024',
    highlights: [
      'Built backend APIs for a medical courier application, improving operational efficiency by ~35%.',
      'Architected front-end modules for a real-time ambulance tracking app; improved GPS-related accuracy by ~30%.',
      'Delivered full UI for an online pharmacy app serving 1,000+ daily users; navigation efficiency up ~40%.',
      'Accelerated front-end delivery by ~25% through reusable components and engineering best practices.',
    ],
  },
]
