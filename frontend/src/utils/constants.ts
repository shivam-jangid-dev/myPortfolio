/** Breakpoint values (min-width) for responsive design — mobile-first. */
export const BREAKPOINTS = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

/** LocalStorage key for theme persistence. */
export const STORAGE_KEY_THEME = 'portfolio-theme'

/** Section IDs — must match the `id` attributes on section elements. */
export const SECTION_IDS = {
  HERO: 'hero',
  AI_TOOLS: 'ai-tools',
  PROJECTS: 'projects',
  EXPERIENCE: 'experience',
  TECH_STACK: 'tech-stack',
  IMPACT: 'impact',
  CERTIFICATIONS: 'certifications',
  CONTACT: 'contact',
} as const

/** Navbar scroll offset for smooth-scroll targets. */
export const NAV_OFFSET = -80

/** Animation durations in ms. */
export const ANIMATION = {
  TYPING_SPEED: 30,
  TYPING_SPEED_MOBILE: 50,
  COUNTER_DURATION: 2000,
  REVEAL_DURATION: 750,
  STAGGER_DELAY: 100,
} as const
