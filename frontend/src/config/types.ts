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
}

export type ExperienceItem = {
  id: string
  role: string
  company: string
  location?: string
  start: string
  end: string
  highlights: string[]
}

export type SkillGroup = {
  id: string
  label: string
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
  summary: string[]
}
