export type ProjectLink = { label: string; href: string }

export type Project = {
  id: string
  title: string
  /** Short card blurb */
  summary: string
  /** Longer detail page copy */
  description: string
  tech: string[]
  highlights?: string[]
  links?: ProjectLink[]
  /** Whether to feature prominently in the grid */
  featured?: boolean
}

export type ExperienceItem = {
  id: string
  role: string
  company: string
  location?: string
  start: string
  end: string
  /** Whether this is the current/active role */
  isCurrent?: boolean
  highlights: string[]
}

export type SkillGroup = {
  id: string
  label: string
  /** Emoji or icon identifier for the category */
  icon?: string
  items: string[]
}

export type EducationItem = {
  id: string
  degree: string
  school: string
  year: string
  details?: string[]
}

export type Certification = {
  id: string
  name: string
  issuer: string
  date?: string
  /** Emoji icon for the cert card */
  icon?: string
}

export type Profile = {
  name: string
  title: string
  tagline: string
  location: string
  email: string
  phone: string
  linkedin: string
  /** Display label for LinkedIn */
  linkedinLabel?: string
  github?: string
  summary: string[]
  /** CLI intro lines for the Hero terminal animation */
  cliIntro?: CliLine[]
}

export type CliLine = {
  prompt?: string
  command?: string
  output?: string
}

export type Metric = {
  id: string
  /** Numeric value to animate to */
  value: number
  /** Suffix after the number (%, +, x, etc.) */
  suffix: string
  /** Short label displayed above the number */
  label: string
  /** Context description below the number */
  description: string
}

export type NavLink = {
  /** Section element id for scroll targeting */
  id: string
  /** Display label in the navbar */
  label: string
}
