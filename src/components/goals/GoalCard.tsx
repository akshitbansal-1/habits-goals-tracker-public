import { useState } from 'react'
import { format, parseISO, differenceInDays } from 'date-fns'
import GoalProgressBar from './GoalProgressBar'
import type { Goal, Item } from '../../types'

const STATUS_COLORS = {
  active: '#4caf50',
  completed: '#e8a838',
  abandoned: '#888',
}

interface Props {
  goal: Goal
  items: Item[]
  onEdit: (goal: Goal) => void
  onDelete: (goal: Goal) => void
  onComplete: (goal: Goal) => void
}

function ProgressRing({ pct }: { pct: number }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ

  return (
    <svg width="70" height="70" viewBox="0 0 70 70" className="flex-shrink-0">
      <circle cx="35" cy="35" r={r} fill="none" stroke="var(--bg-border)" strokeWidth="4" />
      <circle
        cx="35" cy="35" r={r} fill="none"
        stroke="#4caf50" strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 35 35)"
        style={{ transition: 'stroke-dashoffset 0.7s ease' }}
      />
      <text
        x="35" y="40" textAnchor="middle"
        fontFamily="IBM Plex Mono" fontSize="12"
        fill="var(--text)"
      >
        {Math.round(pct)}%
      </text>
    </svg>
  )
}

export default function GoalCard({ goal, items, onEdit, onDelete, onComplete }: Props) {
  const [expanded, setExpanded] = useState(false)
  const pct = goal.target_completions > 0
    ? Math.min((goal.actual_completions / goal.target_completions) * 100, 100)
    : 0

  const linkedItems = items.filter((i) => goal.linked_item_ids.includes(i.id))
  const daysLeft = goal.deadline
    ? differenceInDays(parseISO(goal.deadline + 'T12:00:00'), new Date())
    : null
  const statusColor = STATUS_COLORS[goal.status]

  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-5 space-y-4">
      <div className="flex gap-4">
        <ProgressRing pct={pct} />
        <div className="flex-1 min-w-0">
          {goal.identity_statement && (
            <p className="text-sm italic text-primary mb-1.5 leading-snug">
              "{goal.identity_statement}"
            </p>
          )}
          <h3 className="font-mono text-sm font-semibold text-primary">{goal.title}</h3>
          <div className="flex items-center gap-3 mt-2">
            <span className="font-mono text-[11px] uppercase tracking-wider" style={{ color: statusColor }}>
              {goal.status}
            </span>
            {goal.deadline && (
              <span className={`font-mono text-[11px] ${daysLeft !== null && daysLeft < 7 ? 'text-red-400' : 'text-text-muted'}`}>
                {daysLeft !== null && daysLeft > 0
                  ? `${daysLeft}d left`
                  : daysLeft === 0 ? 'due today' : 'overdue'}
              </span>
            )}
          </div>
        </div>
      </div>

      <GoalProgressBar actual={goal.actual_completions} target={goal.target_completions} />

      {linkedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {linkedItems.map((item) => (
            <span
              key={item.id}
              className="font-mono text-[11px] px-2 py-1 rounded-md border border-bg-border text-text-muted"
            >
              {item.name}
            </span>
          ))}
        </div>
      )}

      {(goal.why_it_matters || goal.description) && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="font-mono text-xs text-text-muted hover:text-primary transition-colors"
        >
          {expanded ? '▵ hide details' : '▿ why this matters'}
        </button>
      )}

      {expanded && (
        <div className="space-y-2 pt-2 border-t border-bg-border">
          {goal.why_it_matters && (
            <p className="text-sm text-text-muted leading-relaxed">
              <span className="font-mono text-xs text-check uppercase">Why: </span>
              {goal.why_it_matters}
            </p>
          )}
          {goal.description && (
            <p className="text-sm text-text-muted leading-relaxed">{goal.description}</p>
          )}
          <p className="font-mono text-xs text-text-muted">
            Started {format(parseISO(goal.created_at), 'MMM d, yyyy')}
          </p>
        </div>
      )}

      <div className="flex gap-4 pt-2 border-t border-bg-border">
        <button onClick={() => onEdit(goal)} className="font-mono text-xs text-text-muted hover:text-primary transition-colors">
          edit
        </button>
        {goal.status === 'active' && (
          <button onClick={() => onComplete(goal)} className="font-mono text-xs text-check hover:opacity-80 transition-opacity">
            mark complete
          </button>
        )}
        <button onClick={() => onDelete(goal)} className="font-mono text-xs text-text-muted hover:text-red-400 transition-colors ml-auto">
          delete
        </button>
      </div>
    </div>
  )
}
