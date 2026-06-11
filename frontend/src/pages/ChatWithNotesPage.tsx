import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ToolPageLayout } from '@/components/ToolPageLayout'
import { FileUpload } from '@/components/FileUpload'
import { Button } from '@/components/Button'
import { AI_TOOLS } from '@/config/aiTools'
import {
  uploadDocument,
  sendChatMessage,
  type ChatSession,
  type ChatMessage,
} from '@/utils/aiToolsApi'
import { cn } from '@/utils/cn'

const tool = AI_TOOLS.find((t) => t.id === 'chat-with-notes')!

type PageState = 'upload' | 'loading' | 'chat'

/* ─── Terminal Loader ─── */
function ProcessingLoader() {
  const [dots, setDots] = useState('')
  const [step, setStep] = useState(0)

  const steps = [
    'Parsing document',
    'Extracting text content',
    'Generating embeddings',
    'Building knowledge index',
  ]

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 400)
    return () => clearInterval(dotInterval)
  }, [])

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setStep((s) => (s < steps.length - 1 ? s + 1 : s))
    }, 700)
    return () => clearInterval(stepInterval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 space-y-6"
    >
      {/* Spinner */}
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-2 border-border" />
        <div className="absolute inset-0 h-16 w-16 rounded-full border-2 border-t-accent animate-spin" />
      </div>

      <div className="text-center font-mono space-y-3">
        {steps.map((s, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: i <= step ? 1 : 0.2, x: 0 }}
            transition={{ delay: i * 0.15 }}
            className="text-xs text-muted-foreground flex items-center justify-center gap-2"
          >
            {i < step ? (
              <span className="text-emerald-400">✓</span>
            ) : i === step ? (
              <span className="text-accent">{'>'}</span>
            ) : (
              <span className="opacity-30">○</span>
            )}
            {s}
            {i === step ? dots : ''}
          </motion.p>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Document Info Sidebar ─── */
function DocumentInfo({
  session,
  fileName,
}: {
  session: ChatSession
  fileName: string
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4 h-fit sticky top-24">
      {/* File Info */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate font-mono">
            {fileName}
          </p>
          <p className="text-xs text-muted-foreground">Loaded & indexed</p>
        </div>
      </div>

      <div className="h-px bg-border" />

      {/* Summary */}
      <div>
        <p className="text-xs font-mono text-muted-foreground mb-2 opacity-60">
          --summary:
        </p>
        <p className="text-sm text-foreground/80 leading-relaxed">
          {session.summary}
        </p>
      </div>

      <div className="h-px bg-border" />

      {/* Key Points */}
      <div>
        <p className="text-xs font-mono text-muted-foreground mb-2 opacity-60">
          --key-points:
        </p>
        <ul className="space-y-2">
          {session.keyPoints.map((point, i) => (
            <li
              key={i}
              className="text-xs text-foreground/70 leading-relaxed flex gap-2"
            >
              <span className="text-accent/60 mt-0.5 shrink-0">▸</span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/* ─── Chat Message Bubble ─── */
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn('flex', isUser ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          'max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-accent text-accent-foreground rounded-br-md'
            : 'bg-card border border-border text-foreground rounded-bl-md font-mono',
        )}
      >
        {/* Role indicator */}
        <p
          className={cn(
            'text-[10px] font-mono mb-1.5 font-semibold uppercase tracking-wider',
            isUser ? 'text-accent-foreground/60' : 'text-accent',
          )}
        >
          {isUser ? 'you' : 'ai'}
        </p>
        {/* Message content with line breaks */}
        <div className="whitespace-pre-wrap">{message.content}</div>
      </div>
    </motion.div>
  )
}

/* ─── Typing Indicator ─── */
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex justify-start"
    >
      <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
        <p className="text-[10px] font-mono mb-1.5 font-semibold uppercase tracking-wider text-accent">
          ai
        </p>
        <div className="flex gap-1.5 items-center h-5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-accent/60"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Chat Interface ─── */
function ChatInterface({
  session,
  fileName,
}: {
  session: ChatSession
  fileName: string
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `I've processed "${session.title}" and I'm ready to help! Ask me anything about the content of your document.`,
      timestamp: Date.now(),
    },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, scrollToBottom])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isTyping) return

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    try {
      const response = await sendChatMessage(session.sessionId, trimmed)
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your query. Please try again.',
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6"
    >
      {/* Sidebar — Document Info (desktop only) */}
      <div className="hidden lg:block">
        <DocumentInfo session={session} fileName={fileName} />
      </div>

      {/* Chat Panel */}
      <div className="flex flex-col rounded-xl border border-border bg-card overflow-hidden" style={{ height: 'min(70vh, 600px)' }}>
        {/* Chat Header */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-card">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 pulse-glow" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-mono font-semibold text-foreground truncate">
              chat_session
            </p>
            <p className="text-[10px] font-mono text-muted-foreground truncate">
              {session.title}
            </p>
          </div>
          {/* Mobile: doc info toggle could go here */}
          <div className="lg:hidden">
            <span className="text-xs font-mono text-accent/60 bg-accent/10 px-2 py-1 rounded border border-accent/20">
              {fileName.length > 15 ? fileName.slice(0, 15) + '…' : fileName}
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="border-t border-border p-3 bg-card">
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your document..."
                disabled={isTyping}
                className={cn(
                  'w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm text-foreground font-mono',
                  'placeholder:text-muted-foreground/50 outline-none transition-colors',
                  'focus:border-accent/50 focus:ring-1 focus:ring-accent/20',
                  isTyping && 'opacity-50',
                )}
              />
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all',
                input.trim() && !isTyping
                  ? 'bg-accent text-accent-foreground hover:opacity-90 shadow-sm shadow-accent/25'
                  : 'bg-muted text-muted-foreground opacity-50 cursor-not-allowed',
              )}
              aria-label="Send message"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground/40 mt-2 text-center">
            Press Enter to send • AI responses are generated from your document
          </p>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main Page ─── */
export function ChatWithNotesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [state, setState] = useState<PageState>('upload')
  const [session, setSession] = useState<ChatSession | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async () => {
    if (!file) return
    setState('loading')
    setError(null)
    try {
      const data = await uploadDocument(file)
      setSession(data)
      setState('chat')
    } catch (err) {
      setError('Failed to process document. Please try again.')
      setState('upload')
    }
  }

  return (
    <ToolPageLayout
      title={tool.title}
      description={tool.description}
      badgeLabel={tool.badgeLabel}
    >
      <AnimatePresence mode="wait">
        {state === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            <FileUpload
              acceptedFormats={tool.acceptedFormats}
              acceptedMimeTypes={tool.acceptedMimeTypes}
              onFileSelect={setFile}
              selectedFile={file}
              onFileRemove={() => setFile(null)}
            />

            {error && (
              <p className="text-xs font-mono text-red-400">
                <span className="opacity-60">error:</span> {error}
              </p>
            )}

            <div className="flex justify-center pt-2">
              <Button
                onClick={handleStart}
                disabled={!file}
                className={cn(
                  'font-mono px-8',
                  !file && 'opacity-40 cursor-not-allowed',
                )}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span className="opacity-70 mr-1">./</span>start_chat.sh
              </Button>
            </div>
          </motion.div>
        )}

        {state === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ProcessingLoader />
          </motion.div>
        )}

        {state === 'chat' && session && file && (
          <motion.div
            key="chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ChatInterface session={session} fileName={file.name} />
          </motion.div>
        )}
      </AnimatePresence>
    </ToolPageLayout>
  )
}
