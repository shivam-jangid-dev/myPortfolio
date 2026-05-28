import { profile } from '@/config/profile'

export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-border bg-background py-8 font-mono">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-bold text-foreground">
            <span className="text-accent opacity-70 mr-2">{'>_'}</span>
            {profile.name.toLowerCase().replace(' ', '_')}
          </p>
          <p className="text-xs text-muted-foreground mt-1 ml-6">{profile.title}</p>
        </div>
        <div className="text-xs text-muted-foreground text-left sm:text-right">
          <p>
            <span className="text-accent opacity-50 mr-1">©</span> {year} — Built with React & Tailwind
          </p>
          <p className="mt-1 opacity-70">Terminal Noir Theme</p>
        </div>
      </div>
    </footer>
  )
}
