import type { Metric } from './types'

export const metrics: Metric[] = [
  {
    id: 'latency',
    value: 15,
    suffix: '%',
    label: 'API Latency Reduced',
    description: 'Flask & FastAPI optimization at Airat.in',
  },
  {
    id: 'uptime',
    value: 99.9,
    suffix: '%',
    label: 'Pipeline Uptime',
    description: 'Apache Airflow ETL automation',
  },
  {
    id: 'hours',
    value: 10,
    suffix: '+',
    label: 'Eng Hours Saved/Week',
    description: 'Via automated ETL workflows',
  },
  {
    id: 'coverage',
    value: 90,
    suffix: '%',
    label: 'Test Coverage',
    description: 'Unit + integration testing frameworks',
  },
  {
    id: 'incidents',
    value: 25,
    suffix: '%',
    label: 'Incidents Reduced',
    description: 'Production stability improvement',
  },
  {
    id: 'users',
    value: 1000,
    suffix: '+',
    label: 'Daily Users Served',
    description: 'Online pharmacy app at Dayton',
  },
]
