import type { NavLink } from './types'

/**
 * Section navigation targets — used by Navbar and MobileMenu.
 * Each `id` matches the `id` attribute on the corresponding section element.
 */
export const navLinks: NavLink[] = [
  { id: 'hero', label: 'Home' },
  { id: 'ai-tools', label: 'AI Tools' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'tech-stack', label: 'Skills' },
  { id: 'impact', label: 'Impact' },
  { id: 'certifications', label: 'Certs' },
  { id: 'contact', label: 'Contact' },
]
