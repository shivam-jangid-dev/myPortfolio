/**
 * Pure helpers for magnetic cursor pull — keeps CustomCursor lean and reusable.
 * Adjust `strength` (0–1) per surface type (links vs large CTAs).
 */
export function magneticOffset(
  x: number,
  y: number,
  targetX: number,
  targetY: number,
  strength: number,
): { x: number; y: number } {
  return {
    x: x + (targetX - x) * strength,
    y: y + (targetY - y) * strength,
  }
}
