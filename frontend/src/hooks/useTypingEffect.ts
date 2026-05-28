import { useEffect, useState } from 'react'
import { useReducedMotion } from './useReducedMotion'

type Options = {
  speed?: number
  delay?: number
  enabled?: boolean
}

export function useTypingEffect(text: string, opts: Options = {}) {
  const { speed = 30, delay = 0, enabled = true } = opts
  const [displayText, setDisplayText] = useState('')
  const [isComplete, setIsComplete] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!enabled) return
    if (reduced) {
      setDisplayText(text)
      setIsComplete(true)
      return
    }

    let index = 0
    setDisplayText('')
    setIsComplete(false)

    const delayTimer = setTimeout(() => {
      const interval = setInterval(() => {
        index++
        setDisplayText(text.slice(0, index))
        if (index >= text.length) {
          clearInterval(interval)
          setIsComplete(true)
        }
      }, speed)
      return () => clearInterval(interval)
    }, delay)

    return () => clearTimeout(delayTimer)
  }, [text, speed, delay, enabled, reduced])

  return { displayText, isComplete }
}
