import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import type { Item, Category } from '../../types'

const accentColors: Record<Category, string> = {
  meal: '#e8a838',
  skincare: '#7eb8a4',
  habit: '#7a9fd4',
}

interface HabitItemProps {
  item: Item
  onToggle: (id: number) => void
}

export default function HabitItem({ item, onToggle }: HabitItemProps) {
  const [expanded, setExpanded] = useState(false)
  const accent = accentColors[item.category]

  const lines = item.description?.split('\n') ?? []
  const criteriaIndex = lines.findIndex((l) => l.toLowerCase().startsWith('criteria:'))

  return (
    <div
      className={`rounded-lg border border-bg-border bg-bg-card transition-all duration-150 ${
        item.completed ? 'opacity-60' : ''
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(item.id)}
          className="flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-150 flex items-center justify-center"
          style={{
            borderColor: item.completed ? '#4caf50' : 'var(--bg-border)',
            backgroundColor: item.completed ? '#4caf50' : 'transparent',
          }}
        >
          {item.completed && (
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        {/* Name */}
        <span
          className={`flex-1 text-sm leading-snug ${
            item.completed ? 'line-through text-text-muted' : 'text-primary'
          }`}
        >
          {item.name}
        </span>

        {/* Completion time */}
        {item.completed && item.completed_at && (
          <span className="font-mono text-[11px] text-text-muted flex-shrink-0">
            {format(parseISO(item.completed_at), 'HH:mm')}
          </span>
        )}

        {/* Expand button */}
        {item.description && (
          <button
            onClick={() => setExpanded((e) => !e)}
            className="flex-shrink-0 text-text-muted hover:text-primary transition-colors font-mono text-xs px-1"
          >
            {expanded ? '▵' : '▿'}
          </button>
        )}
      </div>

      {/* Description */}
      {expanded && item.description && (
        <div className="px-4 pb-3 border-t border-bg-border">
          <div className="pt-2.5 space-y-1">
            {lines.map((line, i) => {
              const isCriteria = i === criteriaIndex
              return (
                <p
                  key={i}
                  className="font-mono text-xs leading-relaxed"
                  style={{
                    color: isCriteria ? accent : 'var(--text-muted)',
                    fontWeight: isCriteria ? 500 : 400,
                  }}
                >
                  {line}
                </p>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
