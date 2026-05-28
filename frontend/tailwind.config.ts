import type { Config } from 'tailwindcss'

/**
 * Semantic colors only — all values resolve from CSS variables on :root / [data-theme].
 * Adding a company theme = new variable block in styles/theme.css only (no JS changes).
 *
 * Terminal Noir additions:
 *  - font-mono mapped to --font-mono (JetBrains Mono)
 *  - accent-secondary for blue highlights
 *  - Terminal-specific keyframes and utilities
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)',
        'muted-foreground': 'hsl(var(--muted-foreground) / <alpha-value>)',
        card: 'hsl(var(--card) / <alpha-value>)',
        'card-foreground': 'hsl(var(--card-foreground) / <alpha-value>)',
        border: 'hsl(var(--border) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        'accent-foreground': 'hsl(var(--accent-foreground) / <alpha-value>)',
        'accent-secondary': 'hsl(var(--accent-secondary) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        hero: 'hsl(var(--hero-glow) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'Consolas', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(to right, hsl(var(--border) / 0.35) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border) / 0.35) 1px, transparent 1px)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'blink-cursor': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 4px hsl(var(--accent) / 0.4)' },
          '50%': { boxShadow: '0 0 12px hsl(var(--accent) / 0.7), 0 0 24px hsl(var(--accent) / 0.3)' },
        },
        'terminal-open': {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease-out forwards',
        'blink-cursor': 'blink-cursor 1s step-end infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'terminal-open': 'terminal-open 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
    },
  },
  plugins: [],
} satisfies Config
