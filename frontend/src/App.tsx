import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check, Copy, TriangleAlert } from 'lucide-react'
import { SAMPLE_TRANSCRIPT } from './sample'

const API = import.meta.env.VITE_API_URL
const MIN_CHARS = 200
const COUNTS = [3, 5, 8]

interface Clip {
  start: string
  end: string
  title: string
  caption: string
  reason: string
  score: number
}

type Phase = 'input' | 'loading' | 'results' | 'error'

const LABEL = 'font-mono text-[11px] uppercase tracking-[0.18em] text-mute'

function Mark() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M8 8h6M8 8v6" stroke="currentColor" strokeWidth="3" />
      <path d="M24 24h-6M24 24v-6" stroke="currentColor" strokeWidth="3" />
      <path d="M21 9 11 23" stroke="#FF9F1C" strokeWidth="3" />
    </svg>
  )
}

function Timecode({ reduce }: { reduce: boolean }) {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const startedAt = Date.now()
    const id = setInterval(() => setElapsed(Date.now() - startedAt), reduce ? 1000 : 42)
    return () => clearInterval(id)
  }, [reduce])

  const totalFrames = Math.floor((elapsed / 1000) * 24)
  const mm = String(Math.floor(totalFrames / (24 * 60))).padStart(2, '0')
  const ss = String(Math.floor(totalFrames / 24) % 60).padStart(2, '0')
  const ff = String(totalFrames % 24).padStart(2, '0')
  return (
    <span className="font-mono text-xs text-mute tabular-nums">
      {mm}:{ss}:<span className="text-accent">{ff}</span>
    </span>
  )
}

const STATUSES = ['Reading transcript', 'Finding hooks', 'Scoring moments', 'Writing captions']

function Loading({ count, reduce }: { count: number; reduce: boolean }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STATUSES.length - 1)), 3200)
    return () => clearInterval(id)
  }, [])

  return (
    <section aria-live="polite">
      <div className="flex items-baseline justify-between">
        <span className={LABEL}>Analysing</span>
        <Timecode reduce={reduce} />
      </div>
      <div className="relative mt-3 h-[2px] w-full overflow-hidden bg-line">
        <div className="scrub-head absolute top-0 h-full w-1/4 bg-accent" />
      </div>
      <div className="mt-4 h-5">
        <AnimatePresence mode="wait">
          <motion.p
            key={step}
            initial={reduce ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="font-mono text-xs text-mute"
          >
            {STATUSES[step]}
          </motion.p>
        </AnimatePresence>
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="rounded-[4px] border border-line bg-surface p-6">
            <div className="flex items-start justify-between">
              <div className="h-4 w-2/3 rounded-[2px] bg-line/70" />
              <div className="h-4 w-10 rounded-[2px] bg-line/70" />
            </div>
            <div className="mt-6 space-y-2.5 border-l-2 border-line pl-4">
              <div className="h-3 w-full rounded-[2px] bg-line/50" />
              <div className="h-3 w-4/5 rounded-[2px] bg-line/50" />
            </div>
            <div className="mt-6 h-16 rounded-[4px] border border-line bg-bg" />
          </div>
        ))}
      </div>
    </section>
  )
}

function ClipCard({ clip, index, reduce }: { clip: Clip; index: number; reduce: boolean }) {
  const [copied, setCopied] = useState(false)

  function copyCaption() {
    navigator.clipboard.writeText(clip.caption)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  const score = Math.max(0, Math.min(10, clip.score))

  return (
    <motion.article
      initial={reduce ? false : { clipPath: 'inset(0 100% 0 0)' }}
      animate={{ clipPath: 'inset(0 0% 0 0)' }}
      transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1], delay: reduce ? 0 : index * 0.07 }}
      className="flex flex-col gap-5 rounded-[4px] border border-line bg-surface p-5 sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-lg leading-snug font-semibold tracking-tight">{clip.title}</h3>
        <div className="shrink-0 pt-1 text-right">
          <span className="font-mono text-sm tabular-nums">
            {score}
            <span className="text-mute">/10</span>
          </span>
          <div className="mt-1.5 h-[3px] w-16 bg-line">
            <div className="h-full bg-accent" style={{ width: `${score * 10}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-l-2 border-line pl-4">
        <div>
          <span className={LABEL}>In</span>
          <p className="mt-1 text-sm leading-relaxed text-ink/90">&ldquo;{clip.start}&rdquo;</p>
        </div>
        <div>
          <span className={LABEL}>Out</span>
          <p className="mt-1 text-sm leading-relaxed text-ink/90">&ldquo;{clip.end}&rdquo;</p>
        </div>
      </div>

      <div className="rounded-[4px] border border-line bg-bg p-4">
        <div className="flex items-center justify-between">
          <span className={LABEL}>Caption</span>
          <button
            type="button"
            onClick={copyCaption}
            className="flex items-center gap-1.5 font-mono text-[11px] text-mute transition-colors hover:text-ink"
          >
            {copied ? <Check size={13} className="text-accent" /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed">{clip.caption}</p>
      </div>

      <p className="text-[13px] leading-relaxed text-mute">{clip.reason}</p>
    </motion.article>
  )
}

export default function App() {
  const [transcript, setTranscript] = useState('')
  const [count, setCount] = useState(5)
  const [phase, setPhase] = useState<Phase>('input')
  const [clips, setClips] = useState<Clip[]>([])
  const [error, setError] = useState('')
  const [fieldError, setFieldError] = useState('')
  const reduce = useReducedMotion() ?? false

  const chars = transcript.length
  const tooShort = transcript.trim().length < MIN_CHARS

  async function analyse() {
    setFieldError('')
    setPhase('loading')
    try {
      const res = await fetch(`${API}/api/analyse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript, count }),
      })
      if (!res.ok) {
        const detail = (await res.json().catch(() => null))?.detail ?? `Request failed (${res.status})`
        if (res.status === 400) {
          setFieldError(detail)
          setPhase('input')
        } else {
          setError(detail)
          setPhase('error')
        }
        return
      }
      const data = await res.json()
      setClips([...data.clips].sort((a: Clip, b: Clip) => b.score - a.score))
      setPhase('results')
    } catch {
      setError('Could not reach the analysis server. Make sure it is running on port 8000, then retry.')
      setPhase('error')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line">
        <div className="mx-auto max-w-[1100px] px-5 py-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <Mark />
            <span className="text-lg font-semibold tracking-tight">Cutaway</span>
          </div>
          <p className="mt-1.5 text-sm text-mute">
            Reads a long transcript and marks the moments worth cutting into shorts.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8">
        {phase === 'input' && (
          <section>
            <div className="flex items-baseline justify-between">
              <label htmlFor="transcript" className={LABEL}>
                Transcript
              </label>
              <span className="font-mono text-xs text-mute tabular-nums">{chars.toLocaleString()} chars</span>
            </div>
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value)
                setFieldError('')
              }}
              placeholder={
                '[00:00:04] Host: Welcome back. Today we’re talking about why most side projects die in week two…\n\nPaste a full transcript — podcast, interview, talk. Speaker labels and timestamps are fine but not required.'
              }
              className="mt-2 min-h-[300px] w-full resize-y rounded-[4px] border border-line bg-surface p-5 font-mono text-[13px] leading-[1.7] text-ink placeholder:text-mute/60 focus:border-accent/70 focus:ring-1 focus:ring-accent/50 focus:outline-none"
            />
            <div className="mt-1 h-5">
              {fieldError ? (
                <p className="font-mono text-xs text-accent">{fieldError}</p>
              ) : (
                chars > 0 &&
                tooShort && (
                  <p className="font-mono text-xs text-mute">
                    Needs at least {MIN_CHARS} characters &mdash; {MIN_CHARS - transcript.trim().length} to go.
                  </p>
                )
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-4">
              <div className="flex items-center gap-3">
                <span className={LABEL}>Clips</span>
                <div className="flex overflow-hidden rounded-[4px] border border-line">
                  {COUNTS.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCount(n)}
                      aria-pressed={count === n}
                      className={`px-3.5 py-1.5 font-mono text-xs transition-colors ${
                        count === n ? 'bg-line text-ink' : 'text-mute hover:text-ink'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTranscript(SAMPLE_TRANSCRIPT)}
                className="text-sm text-mute underline decoration-line underline-offset-4 transition-colors hover:text-ink"
              >
                Try an example
              </button>

              <button
                type="button"
                onClick={analyse}
                disabled={tooShort}
                className="ml-auto rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-bg transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
              >
                Find clips
              </button>
            </div>
          </section>
        )}

        {phase === 'loading' && <Loading count={count} reduce={reduce} />}

        {phase === 'results' && (
          <section>
            <div className="flex items-baseline justify-between border-b border-line pb-3">
              <p className="font-mono text-xs text-mute">
                <span className="text-ink">{clips.length}</span> clips &middot; ranked by score
              </p>
              <button
                type="button"
                onClick={() => setPhase('input')}
                className="text-sm text-mute underline decoration-line underline-offset-4 transition-colors hover:text-ink"
              >
                Start over
              </button>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {clips.map((clip, i) => (
                <ClipCard key={i} clip={clip} index={i} reduce={reduce} />
              ))}
            </div>
          </section>
        )}

        {phase === 'error' && (
          <section className="mx-auto max-w-md rounded-[4px] border border-line bg-surface p-8 text-center">
            <TriangleAlert size={20} className="mx-auto text-mute" aria-hidden="true" />
            <h2 className="mt-4 font-semibold tracking-tight">Analysis failed</h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">{error}</p>
            <div className="mt-6 flex items-center justify-center gap-5">
              <button
                type="button"
                onClick={analyse}
                className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-bg transition-[filter] hover:brightness-110 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg focus-visible:outline-none"
              >
                Retry
              </button>
              <button
                type="button"
                onClick={() => setPhase('input')}
                className="text-sm text-mute underline decoration-line underline-offset-4 transition-colors hover:text-ink"
              >
                Edit transcript
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
