import { useEffect, useRef, useCallback } from 'react'
import styles from './BinaryPortrait.module.css'
import { useThemeStore } from '@/stores/themeStore'
import { useReducedMotion } from '@/hooks/useReducedMotion'

const THEME_RAMPS: Record<string, { bg: string; colors: string[] }> = {
  'terminal-noir': { bg: '#0d1117', colors: ['#00d26a', '#00ff7f', '#39ff14', '#00e676'] },
  meta: { bg: '#1C2B33', colors: ['#0866FF', '#66a3ff', '#4d94ff', '#1a6fff'] },
  apple: { bg: '#1a1a1a', colors: ['#F5F5F7', '#a0a0a8', '#d0d0d5', '#e8e8ed'] },
  amazon: { bg: '#131921', colors: ['#FF9900', '#ffb84d', '#ffaa00', '#e68a00'] },
  netflix: { bg: '#141414', colors: ['#E50914', '#ff2d38', '#cc0811', '#ff6670'] },
  google: { bg: '#202124', colors: ['#4285F4', '#EA4335', '#FBBC05', '#34A853'] },
}

export const CHAR_MODES: Record<string, string[]> = {
  binary: ['0', '1', '0', '1', '1', '0'],
  stack: ['AI', 'PY', '{}', '>>', 'λ', '//'],
  matrix: ['ア', 'イ', 'ウ', 'エ', 'カ', 'キ'],
  blocks: ['█', '▓', '▒', '░', '▪', '▫'],
}

export interface BinaryPortraitProps {
  src: string
  charMode?: keyof typeof CHAR_MODES
  charSize?: number
  animated?: boolean
  width?: number
  height?: number
  className?: string
}

export default function BinaryPortrait({
  src,
  charMode = 'binary',
  charSize = 7,
  animated = true,
  width = 320,
  height = 400,
  className = '',
}: BinaryPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const activeTheme = useThemeStore((state) => state.preference)
  const reducedMotion = useReducedMotion()

  const imgDataRef = useRef<Uint8ClampedArray | null>(null)
  const imgWidthRef = useRef<number>(0)
  const imgHeightRef = useRef<number>(0)
  const rafRef = useRef<number>(0)
  const tickRef = useRef<number>(0)

  // Glitch state refs
  const glitchingRef = useRef<boolean>(false)
  const glitchFramesLeftRef = useRef<number>(0)

  const drawFrame = useCallback(
    (forceGlitch = false) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d', { alpha: false })
      if (!ctx) return
      const imgData = imgDataRef.current
      const imgW = imgWidthRef.current
      const imgH = imgHeightRef.current
      if (!imgData || imgW === 0 || imgH === 0) return

      // Responsive char size
      const isMobile = window.innerWidth < 768
      const actualCharSize = isMobile ? Math.max(4, Math.floor(charSize / 2)) : charSize

      const theme = THEME_RAMPS[activeTheme] || THEME_RAMPS['terminal-noir']
      const chars = CHAR_MODES[charMode] || CHAR_MODES['binary']

      ctx.fillStyle = theme.bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.textBaseline = 'top'
      ctx.textAlign = 'left'

      // We map canvas coordinates to image coordinates
      const scaleX = imgW / canvas.width
      const scaleY = imgH / canvas.height

      const isGlitching = forceGlitch || glitchingRef.current
      const isGoogle = activeTheme === 'google'

      for (let y = 0; y < canvas.height; y += actualCharSize) {
        for (let x = 0; x < canvas.width; x += actualCharSize) {
          const imgX = Math.floor(x * scaleX)
          const imgY = Math.floor(y * scaleY)

          const i = (imgY * imgW + imgX) * 4
          if (i >= imgData.length) continue

          const r = imgData[i]
          const g = imgData[i + 1]
          const b = imgData[i + 2]

          // Calculate brightness 0-1
          const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255

          if (brightness < 0.12) continue // Skip background

          // Random glitch check
          const randomGlitch = animated && !reducedMotion && !isGlitching && Math.random() < 0.04
          const shouldRandomize = isGlitching || randomGlitch

          // Select character
          let charIndex = Math.floor(brightness * chars.length)
          if (charIndex >= chars.length) charIndex = chars.length - 1
          if (shouldRandomize) {
            charIndex = Math.floor(Math.random() * chars.length)
          }
          const char = chars[charIndex]

          // Select color
          let colorIndex = Math.floor(brightness * theme.colors.length)
          if (colorIndex >= theme.colors.length) colorIndex = theme.colors.length - 1
          if (isGoogle) {
            const row = Math.floor(y / actualCharSize)
            const col = Math.floor(x / actualCharSize)
            colorIndex = (row * 3 + col * 7) % 4
          }
          if (isGlitching) {
            colorIndex = Math.floor(Math.random() * theme.colors.length)
          }

          ctx.fillStyle = theme.colors[colorIndex]

          // Depth / alpha
          let alpha = Math.max(0.25, Math.min(1, brightness * 1.2))
          if (isGlitching) alpha = Math.random() > 0.5 ? 1 : 0.4
          ctx.globalAlpha = alpha

          // Font adjustment for block/stack sizes
          const fontSize = actualCharSize
          ctx.font = `${fontSize}px monospace`
          ctx.fillText(char, x, y)
        }
      }
      ctx.globalAlpha = 1.0 // reset
    },
    [activeTheme, charMode, charSize, animated, reducedMotion]
  )

  // Image Loading Effect
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = src

    img.onload = () => {
      // Create a temporary canvas to sample the image
      const tempCanvas = document.createElement('canvas')
      // Target dimensions for sampling based on aspect ratio
      const aspect = img.width / img.height
      const targetW = width
      const targetH = height
      const targetAspect = targetW / targetH

      let drawW, drawH, offsetX, offsetY

      if (aspect > targetAspect) {
        // Image is wider than canvas
        drawH = img.height
        drawW = img.height * targetAspect
        offsetX = (img.width - drawW) / 2
        offsetY = 0 // Top biased crop
      } else {
        // Image is taller than canvas
        drawW = img.width
        drawH = img.width / targetAspect
        offsetX = 0
        offsetY = (img.height - drawH) * 0.15 // Biased 15% from top
      }

      tempCanvas.width = targetW
      tempCanvas.height = targetH
      const ctx = tempCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH, 0, 0, targetW, targetH)
        const imgData = ctx.getImageData(0, 0, targetW, targetH)
        imgDataRef.current = imgData.data
        imgWidthRef.current = targetW
        imgHeightRef.current = targetH
        drawFrame() // Initial draw
      }
    }
  }, [src, width, height, drawFrame])

  // Animation Loop Effect
  useEffect(() => {
    if (!animated || reducedMotion) {
      drawFrame() // Ensure static render
      return
    }

    const loop = () => {
      tickRef.current += 1
      if (glitchingRef.current) {
        // Glitch scramble loop runs every ~60ms
        if (tickRef.current % 4 === 0) {
          glitchFramesLeftRef.current -= 1
          if (glitchFramesLeftRef.current <= 0) {
            glitchingRef.current = false
            drawFrame() // resolve cleanly
          } else {
            drawFrame(true)
          }
        }
      } else {
        // Normal alive flicker loop (~10fps = every 6 ticks at 60fps)
        if (tickRef.current % 6 === 0) {
          drawFrame()
        }
      }
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafRef.current)
  }, [animated, reducedMotion, drawFrame])

  // Theme Change Glitch Effect
  useEffect(() => {
    if (reducedMotion || !animated) {
      drawFrame()
      return
    }
    // Trigger scramble
    glitchingRef.current = true
    glitchFramesLeftRef.current = 8
  }, [activeTheme, reducedMotion, animated, drawFrame])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`${styles.canvas} ${className}`}
    />
  )
}

// Named export requested
export { BinaryPortrait }
