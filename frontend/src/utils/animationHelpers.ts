import type { Variants } from 'framer-motion'
import { ANIMATION } from './constants'

/**
 * Standard Framer Motion fade-up variant for scroll reveals.
 */
export const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: ANIMATION.REVEAL_DURATION / 1000,
      ease: [0.22, 1, 0.36, 1], // ease-out-cubic
    },
  },
}

/**
 * Factory for a stagger container variant.
 * Apply to a parent element, and its children will reveal one by one.
 */
export const staggerContainer = (
  staggerChildren = ANIMATION.STAGGER_DELAY / 1000,
  delayChildren = 0,
): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren,
      delayChildren,
    },
  },
})

/**
 * Slide in from left variant (used in terminal lines).
 */
export const slideInLeftVariant: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}
