import { useCallback, useRef, useState, type DragEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

type FileUploadProps = {
  /** Accepted file extensions, e.g. ['.pdf', '.docx'] */
  acceptedFormats: string[]
  /** Accepted MIME types for the input */
  acceptedMimeTypes: string[]
  /** Called when a valid file is selected */
  onFileSelect: (file: File) => void
  /** Currently selected file (controlled) */
  selectedFile: File | null
  /** Called when the file is removed */
  onFileRemove: () => void
  className?: string
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return '📄'
  if (ext === 'doc' || ext === 'docx') return '📝'
  if (ext === 'png' || ext === 'jpg' || ext === 'jpeg') return '🖼️'
  return '📎'
}

export function FileUpload({
  acceptedFormats,
  acceptedMimeTypes,
  onFileSelect,
  selectedFile,
  onFileRemove,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback(
    (file: File): boolean => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase()
      if (!acceptedFormats.includes(ext)) {
        setError(
          `Invalid format. Accepted: ${acceptedFormats.join(', ')}`,
        )
        return false
      }
      // 20 MB limit
      if (file.size > 20 * 1024 * 1024) {
        setError('File size must be under 20 MB')
        return false
      }
      setError(null)
      return true
    },
    [acceptedFormats],
  )

  const handleFile = useCallback(
    (file: File) => {
      if (validateFile(file)) {
        onFileSelect(file)
      }
    },
    [validateFile, onFileSelect],
  )

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so re-selecting the same file works
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={cn('w-full', className)}>
      <AnimatePresence mode="wait">
        {!selectedFile ? (
          <motion.div
            key="upload-zone"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
          >
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-300',
                'flex flex-col items-center justify-center gap-4 py-16 px-6',
                'hover:border-accent/60 hover:bg-accent/5',
                isDragging
                  ? 'border-accent bg-accent/10 shadow-[0_0_30px_hsl(var(--accent)/0.15)]'
                  : 'border-border bg-card/50',
              )}
            >
              {/* Upload Icon */}
              <div
                className={cn(
                  'flex h-16 w-16 items-center justify-center rounded-2xl transition-colors duration-300',
                  isDragging
                    ? 'bg-accent/20 text-accent'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm font-medium text-foreground">
                  <span className="text-accent font-semibold">Click to upload</span>{' '}
                  or drag and drop
                </p>
                <p className="text-xs font-mono text-muted-foreground">
                  <span className="opacity-60">--formats:</span>{' '}
                  {acceptedFormats.join(' ')}
                </p>
                <p className="text-xs text-muted-foreground opacity-60">
                  Max file size: 20 MB
                </p>
              </div>

              {/* Drag overlay glow */}
              {isDragging && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 rounded-xl bg-accent/5 pointer-events-none"
                />
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept={acceptedMimeTypes.join(',')}
              onChange={handleInputChange}
              className="hidden"
            />
          </motion.div>
        ) : (
          <motion.div
            key="file-selected"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="rounded-xl border border-accent/30 bg-accent/5 p-5"
          >
            <div className="flex items-center gap-4">
              {/* File Icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-2xl">
                {getFileIcon(selectedFile.name)}
              </div>

              {/* File Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground font-mono">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                  {formatBytes(selectedFile.size)}{' '}
                  <span className="opacity-50">•</span>{' '}
                  <span className="text-accent/80">Ready to process</span>
                </p>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onFileRemove()
                  setError(null)
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50 text-muted-foreground transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
                aria-label="Remove file"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-xs font-mono text-red-400"
          >
            <span className="opacity-60">error:</span> {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}
