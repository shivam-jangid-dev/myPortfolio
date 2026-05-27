import { useLenis } from '@/hooks/useLenis'
import { ThemeToggle } from '@/components/ThemeToggle'
import { profile } from '@/config/profile'
import { cn } from '@/utils/cn'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const nav = [
  { id: 'hero', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'experience', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
]

export function Navbar() {
  const lenis = useLenis()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  const scrollTo = (id: string) => {
    setOpen(false)
    if (pathname !== '/') {
      navigate('/', { state: { scrollTo: id } })
      return
    }
    const sel = `#${id}`
    if (lenis) lenis.scrollTo(sel, { offset: -72, duration: 1.1 })
    else document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="font-display text-lg font-semibold tracking-tight text-foreground"
          onClick={(e) => {
            if (pathname === '/') {
              e.preventDefault()
              scrollTo('hero')
            }
          }}
        >
          {profile.name.split(' ')[0]}
          <span className="text-accent">.</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
            >
              {item.label}
            </button>
          ))}
          <Link
            to="/projects/ai-portfolio"
            className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            Case study
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-md border border-border md:hidden"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="sr-only">Toggle menu</span>
            <span
              className={cn(
                'absolute left-2.5 top-[13px] h-0.5 w-5 origin-center bg-foreground transition',
                open && 'translate-y-[7px] rotate-45',
              )}
            />
            <span className={cn('absolute left-2.5 top-[19px] h-0.5 w-5 bg-foreground transition', open && 'opacity-0')} />
            <span
              className={cn(
                'absolute left-2.5 top-[25px] h-0.5 w-5 origin-center bg-foreground transition',
                open && '-translate-y-[7px] -rotate-45',
              )}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border bg-background md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {nav.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-md px-3 py-3 text-left text-sm font-medium text-foreground hover:bg-muted"
                  onClick={() => scrollTo(item.id)}
                >
                  {item.label}
                </button>
              ))}
              <Link
                to="/projects/ai-portfolio"
                className="rounded-md px-3 py-3 text-sm font-medium text-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                Case study
              </Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
