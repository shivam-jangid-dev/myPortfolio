import { profile } from '@/config/profile'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-border bg-muted/30 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-display text-lg font-semibold text-foreground">{profile.name}</p>
          <p className="text-sm text-muted-foreground">{profile.title}</p>
        </div>
        <p className="text-sm text-muted-foreground">© {year} — Built with React, Tailwind, Framer Motion & GSAP.</p>
      </div>
    </footer>
  )
}
