import { cn } from '@/utils/cn'

type Props = {
  eyebrow?: string
  title: string
  subtitle?: string
  className?: string
}

export function SectionHeading({ eyebrow, title, subtitle, className }: Props) {
  return (
    <div className={cn('max-w-2xl space-y-3', className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</p>
      ) : null}
      <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {subtitle ? <p className="text-base leading-relaxed text-muted-foreground">{subtitle}</p> : null}
    </div>
  )
}
