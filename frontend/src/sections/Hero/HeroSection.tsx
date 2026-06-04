import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/Button'
import { Terminal } from '@/components/Terminal'
import { TerminalLine } from '@/components/TerminalLine'
import { useTypingEffect } from '@/hooks/useTypingEffect'
import { profile } from '@/config/profile'
import { ANIMATION } from '@/utils/constants'
import { BinaryPortrait, type BinaryPortraitProps } from '@/components/BinaryPortrait'
// Temporarily using hero.png to avoid Vite import error until you drop shivam.jpg into the folder!
import profileImg from '@/assets/hero.png' 

/**
 * Renders a single typing line. Notifies parent when complete.
 */
function TypingLine({
  prompt,
  command,
  onComplete,
}: {
  prompt?: string
  command: string
  onComplete: () => void
}) {
  const { displayText, isComplete } = useTypingEffect(command, {
    speed: ANIMATION.TYPING_SPEED,
    delay: 300, // slight pause before typing starts
  })

  useEffect(() => {
    if (isComplete) {
      // Add a tiny delay after typing finishes before showing output
      const t = setTimeout(onComplete, 400)
      return () => clearTimeout(t)
    }
  }, [isComplete, onComplete])

  return <TerminalLine prompt={prompt} command={displayText} showCursor={!isComplete} />
}

export function HeroSection() {
  const [currentLineIndex, setCurrentLineIndex] = useState(0)
  const [charMode, setCharMode] = useState<BinaryPortraitProps['charMode']>('binary')
  const introLines = profile.cliIntro || []

  // Auto-advance if a line is just an output (no typing animation needed)
  useEffect(() => {
    const currentLine = introLines[currentLineIndex]
    if (currentLine && !currentLine.command && currentLine.output) {
      const t = setTimeout(() => {
        setCurrentLineIndex((prev) => prev + 1)
      }, 600) // delay before showing next line
      return () => clearTimeout(t)
    }
  }, [currentLineIndex, introLines])

  const handleLineComplete = () => {
    setCurrentLineIndex((prev) => prev + 1)
  }

  // Check if the entire sequence is complete
  const isSequenceComplete = currentLineIndex >= introLines.length

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  const scrollToProjects = () => {
    document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
  }

  const modes: Array<BinaryPortraitProps['charMode']> = ['binary', 'stack', 'matrix', 'blocks']

  return (
    <section id="hero" className="relative min-h-[100dvh] pt-[4.25rem] flex items-center justify-center overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-grid-fade opacity-30 pointer-events-none" />

      <div className="container px-4 sm:px-6 mx-auto relative z-10 grid lg:grid-cols-[1fr_400px] gap-12 items-center">
        {/* Left: Terminal */}
        <div className="flex flex-col gap-8">
          <Terminal title="visitor@shivam.dev:~" className="min-h-[380px] w-full max-w-3xl shadow-glow">
            {introLines.slice(0, currentLineIndex + 1).map((line, idx) => {
              const isCurrent = idx === currentLineIndex

              if (line.command) {
                if (isCurrent) {
                  return (
                    <TypingLine
                      key={idx}
                      prompt={line.prompt}
                      command={line.command}
                      onComplete={handleLineComplete}
                    />
                  )
                }
                // Already typed
                return <TerminalLine key={idx} prompt={line.prompt} command={line.command} />
              }

              if (line.output) {
                // Show output instantly (with slide-in from TerminalLine)
                return <TerminalLine key={idx} output={line.output} />
              }

              return null
            })}

            {/* Blinking cursor at the end when sequence is done */}
            {isSequenceComplete && (
              <TerminalLine prompt="visitor@shivam.dev:~$" command="" showCursor />
            )}
          </Terminal>

          {/* CTAs reveal after sequence completes */}
          <AnimatePresence>
            {isSequenceComplete && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col gap-4 items-start"
              >
                <div className="flex flex-wrap items-center gap-4">
                  <Button onClick={scrollToProjects} className="font-mono shadow-glow border border-accent/50 hover:bg-accent/90">
                    <span className="mr-2 opacity-70">./</span>view_projects.sh
                  </Button>
                  <Button variant="outline" onClick={scrollToContact} className="font-mono">
                    <span className="mr-2 opacity-70">./</span>contact.sh
                  </Button>
                </div>
                
                {/* Char Mode Switcher */}
                <div className="flex items-center gap-3 mt-2 font-mono text-xs">
                  <span className="text-muted-foreground opacity-70">--render-mode:</span>
                  <div className="flex gap-2">
                    {modes.map(mode => (
                      <button
                        key={mode}
                        onClick={() => setCharMode(mode)}
                        className={`transition-colors hover:text-accent ${charMode === mode ? 'text-accent font-bold' : 'text-muted-foreground'}`}
                      >
                        [{mode}]
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: BinaryPortrait */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="hidden lg:flex items-center justify-center relative w-full aspect-[4/5]"
        >
          <BinaryPortrait 
            src={profileImg} 
            charMode={charMode} 
            width={400} 
            height={500} 
            className="w-full h-full object-contain" 
          />
        </motion.div>
      </div>
    </section>
  )
}
