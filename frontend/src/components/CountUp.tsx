import { useEffect, useRef, useState } from 'react'
import { motion, useInView, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/utils/cn'

interface CountUpProps {
  value: number
  suffix?: string
  duration?: number
  className?: string
}

export function CountUp({
  value,
  suffix = '',
  duration = 2,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })
  const [hasAnimated, setHasAnimated] = useState(false)

  // Spring animation for smooth counting
  const springValue = useSpring(0, {
    duration: duration * 1000,
    bounce: 0,
  })

  // Format to whole number
  const displayValue = useTransform(springValue, (current) => {
    return Math.floor(current)
  })

  useEffect(() => {
    if (isInView && !hasAnimated) {
      springValue.set(value)
      setHasAnimated(true)
    }
  }, [isInView, value, springValue, hasAnimated])

  return (
    <span ref={ref} className={cn('tabular-nums tracking-tight', className)}>
      <motion.span>{displayValue}</motion.span>
      {suffix && <span>{suffix}</span>}
    </span>
  )
}
