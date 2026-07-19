export type ResumeAnalysisResult = {
  score: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
}

export const mockResumeAnalysis: ResumeAnalysisResult = {
  score: 85,
  summary: 'Strong backend engineering profile with solid cloud experience. The resume clearly demonstrates impact through quantified metrics.',
  strengths: [
    'Quantified impact in bullet points (e.g., "reducing API latency by ~15%").',
    'Clear progression of skills, specifically in AI and cloud native systems.',
    'Consistent action verbs used across experience items.',
  ],
  weaknesses: [
    'Could expand on the specific LLMs used and how they were integrated.',
    'Education section is a bit sparse.',
  ],
  recommendations: [
    'Add links to live projects or GitHub repositories if possible.',
    'Include a section for technical blog posts or open source contributions.',
  ],
}

export type PDFSummaryResult = {
  title: string
  summary: string
  keyPoints: string[]
}

export const mockPDFSummary: PDFSummaryResult = {
  title: 'Attention Is All You Need',
  summary: 'This paper introduces the Transformer architecture, which eschews recurrence and convolutions entirely, relying solely on self-attention mechanisms to compute representations of its input and output.',
  keyPoints: [
    'The Transformer relies entirely on an attention mechanism to draw global dependencies between input and output.',
    'It allows for significantly more parallelization than recurrent models.',
    'It achieves state-of-the-art results on translation tasks while requiring less training time.',
  ],
}

export type ColdEmailResult = {
  subject: string
  body: string
}

export const mockColdEmail: ColdEmailResult = {
  subject: 'Backend Engineering Role at [Company] — Shivam Jangid',
  body: `Hi [Name],

I recently saw the opening for the Backend Engineer role at [Company] and was immediately drawn to your work in [Specific Area].

I'm an AI Engineer with a strong track record of building scalable systems. At Airat.in, I reduced API latency by 15% and automated ETL workflows that saved the team 10+ hours a week. I'm proficient in Python, FastAPI, and AWS, and have recently been focusing on integrating LLMs into production services.

I've attached my resume for your review. I'd love to chat about how my experience aligns with the team's goals.

Best regards,
Shivam Jangid
somujangid12@gmail.com
+91 9887553886`,
}
