import { createContext } from 'react'
import type Lenis from 'lenis'

/** Populated by SmoothScroll; null when reduced motion or not yet mounted. */
export const LenisContext = createContext<Lenis | null>(null)
