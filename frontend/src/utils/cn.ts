import { clsx, type ClassValue } from 'clsx'

/** Merge Tailwind-friendly class names (no tailwind-merge to keep deps minimal). */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}
