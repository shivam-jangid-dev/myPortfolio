import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useLenis } from '@/hooks/useLenis'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'
import { profile } from '@/config/profile'
import { navLinks } from '@/config/navLinks'
import { NAV_OFFSET } from '@/utils/constants'
import { cn } from '@/utils/cn'

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
    if (lenis) {
      lenis.scrollTo(sel, { offset: NAV_OFFSET, duration: 1.1 })
    } else {
      document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="font-mono text-lg font-bold tracking-tight text-foreground flex items-center gap-2"
          onClick={(e) => {
            if (pathname === '/') {
              e.preventDefault()
              scrollTo('hero')
            }
          }}
        >
          <span className="text-accent">{'>_'}</span>
          <span>{profile.name.toLowerCase().replace(' ', '_')}</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {navLinks.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollTo(item.id)}
              className="text-sm font-mono text-muted-foreground transition hover:text-accent"
            >
              <span className="opacity-50 mr-1">./</span>
              {item.label.toLowerCase()}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          
          {/* Mobile Menu Toggle */}
          <button
            type="button"
            className="relative flex h-10 w-10 items-center justify-center rounded-md border border-border md:hidden text-foreground hover:bg-muted"
            aria-expanded={open}
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="sr-only">Toggle menu</span>
            <span
              className={cn(
                'absolute left-2.5 top-[13px] h-[2px] w-5 origin-center bg-current transition-all',
                open && 'translate-y-[6px] rotate-45',
              )}
            />
            <span
              className={cn('absolute left-2.5 top-[19px] h-[2px] w-5 bg-current transition-all', open && 'opacity-0')}
            />
            <span
              className={cn(
                'absolute left-2.5 top-[25px] h-[2px] w-5 origin-center bg-current transition-all',
                open && '-translate-y-[6px] -rotate-45',
              )}
            />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-b border-border bg-background md:hidden overflow-hidden"
          >
            <div className="flex flex-col gap-2 px-4 py-4 font-mono">
              {navLinks.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="rounded-md px-4 py-3 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-accent transition-colors flex items-center gap-2"
                  onClick={() => scrollTo(item.id)}
                >
                  <span className="opacity-50">./</span>
                  {item.label.toLowerCase()}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
