import type { Item, Category } from '../../types'
import HabitItem from './HabitItem'

const LABELS: Record<Category, string> = {
  meal: 'Meals',
  skincare: 'Skincare',
  habit: 'Habits',
}

const ACCENT_COLORS: Record<Category, string> = {
  meal: '#e8a838',
  skincare: '#7eb8a4',
  habit: '#7a9fd4',
}

interface CategoryColumnProps {
  category: Category
  items: Item[]
  onToggle: (id: number) => void
}

export default function CategoryColumn({ category, items, onToggle }: CategoryColumnProps) {
  const completed = items.filter((i) => i.completed).length
  const total = items.length
  const pct = total > 0 ? (completed / total) * 100 : 0
  const accent = ACCENT_COLORS[category]

  return (
    <div className="flex flex-col gap-2 min-w-0">
      {/* Column header */}
      <div className="sticky top-0 bg-bg pb-2.5 pt-1 z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest" style={{ color: accent }}>
            {LABELS[category]}
          </span>
          <span className="font-mono text-xs text-text-muted">
            {completed}/{total}
          </span>
        </div>
        <div className="h-1 w-full rounded-full" style={{ backgroundColor: 'var(--bg-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, backgroundColor: accent }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <HabitItem key={item.id} item={item} onToggle={onToggle} />
        ))}
        {items.length === 0 && (
          <p className="font-mono text-xs text-text-muted text-center py-6">No items</p>
        )}
      </div>
    </div>
  )
}
