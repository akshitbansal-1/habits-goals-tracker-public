import { useState } from 'react'
import { useAsk, type AskHistoryEntry } from '../hooks/useAsk'
import type { AskProvider, AskResponse } from '../types'

function AnswerCard({ response }: { response: AskResponse }) {
  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-5 space-y-4">
      <p className="text-sm text-primary whitespace-pre-wrap leading-relaxed">{response.answer}</p>

      {response.evidence.length > 0 && (
        <div className="border-t border-bg-border pt-3 space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">Evidence</p>
          {response.evidence.map((e, i) => (
            <details key={i} className="group">
              <summary className="cursor-pointer font-mono text-xs text-text-muted hover:text-primary transition-colors list-none flex items-center gap-1.5">
                <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                <span>{e.tool}</span>
                {Object.keys(e.params).length > 0 && (
                  <span className="text-text-muted/60">
                    ({Object.entries(e.params).map(([k, v]) => `${k}: ${v}`).join(', ')})
                  </span>
                )}
              </summary>
              <pre className="mt-2 font-mono text-xs text-text-muted bg-bg rounded-lg p-3 overflow-auto max-h-48 border border-bg-border">
                {JSON.stringify(e.data, null, 2)}
              </pre>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}

function PreviousQuestion({ entry, onSelect }: { entry: AskHistoryEntry; onSelect: (q: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-bg-card border border-bg-border rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-bg transition-colors"
      >
        <span className="font-mono text-xs text-text-muted flex-shrink-0">{expanded ? '▼' : '▶'}</span>
        <span className="font-mono text-xs text-text-muted truncate flex-1">{entry.question}</span>
        <span className="font-mono text-xs text-text-muted/50 flex-shrink-0">{entry.provider}</span>
      </button>
      {expanded && (
        <div className="border-t border-bg-border px-4 pb-4 pt-3">
          <AnswerCard response={entry.response} />
          <button
            onClick={() => onSelect(entry.question)}
            className="mt-3 font-mono text-xs text-text-muted hover:text-primary transition-colors"
          >
            ask again ↑
          </button>
        </div>
      )}
    </div>
  )
}

const EXAMPLE_QUESTIONS = [
  'How have I done with habits this week?',
  'Which habit do I skip the most?',
  'Am I on track with my goals?',
  'What is my best streak this month?',
]

const PROVIDER_LABELS: Record<AskProvider, string> = {
  anthropic: 'Claude',
  google: 'Gemini',
}

export default function AskPage() {
  const [question, setQuestion] = useState('')
  const [provider, setProvider] = useState<AskProvider>('anthropic')
  const { ask, isPending, error, latestResponse, history } = useAsk()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || isPending) return
    ask(question.trim(), provider)
    setQuestion('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      if (!question.trim() || isPending) return
      ask(question.trim(), provider)
      setQuestion('')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h1 className="font-mono text-xs uppercase tracking-widest text-text-muted">Ask</h1>

      {/* Input */}
      <div className="bg-bg-card border border-bg-border rounded-xl p-5">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. How consistent have I been with skincare this month?"
            rows={3}
            disabled={isPending}
            className="w-full bg-bg border border-bg-border rounded-lg px-3 py-2.5 text-sm text-primary resize-none focus:outline-none focus:border-primary transition-colors placeholder:text-text-muted disabled:opacity-50"
          />
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-text-muted">Model:</span>
              {(['anthropic', 'google'] as AskProvider[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`font-mono text-xs px-2.5 py-1 rounded-md border transition-colors ${
                    provider === p
                      ? 'border-primary text-primary'
                      : 'border-bg-border text-text-muted hover:border-primary hover:text-primary'
                  }`}
                >
                  {PROVIDER_LABELS[p]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-text-muted hidden sm:inline">⌘↵ to submit</span>
              <button
                type="submit"
                disabled={isPending || !question.trim()}
                className="px-4 py-1.5 bg-primary text-bg font-mono text-xs uppercase tracking-wider rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isPending ? 'thinking...' : 'Ask'}
              </button>
            </div>
          </div>
        </form>

        {/* Example prompts — shown only before any questions */}
        {history.length === 0 && !latestResponse && (
          <div className="mt-4 pt-4 border-t border-bg-border">
            <p className="font-mono text-xs text-text-muted mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setQuestion(q)}
                  className="font-mono text-xs text-text-muted border border-bg-border rounded-md px-2.5 py-1 hover:text-primary hover:border-primary transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading */}
      {isPending && (
        <div className="font-mono text-xs text-text-muted py-8 text-center animate-pulse">
          analysing your habits...
        </div>
      )}

      {/* Error */}
      {error && !isPending && (
        <p className="font-mono text-xs text-red-400">Error: {(error as Error).message}</p>
      )}

      {/* Latest answer */}
      {latestResponse && !isPending && (
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">Answer</p>
          <AnswerCard response={latestResponse} />
        </div>
      )}

      {/* Session history */}
      {history.length > 1 && (
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
            Previous ({history.length - 1})
          </p>
          {history.slice(1).map((entry, i) => (
            <PreviousQuestion key={i} entry={entry} onSelect={(q) => setQuestion(q)} />
          ))}
        </div>
      )}
    </div>
  )
}
