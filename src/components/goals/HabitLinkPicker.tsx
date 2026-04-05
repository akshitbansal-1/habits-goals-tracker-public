import type { Item, Category } from '../../types'

const CATEGORY_LABELS: Record<Category, string> = {
  meal: 'Meals',
  skincare: 'Skincare',
  habit: 'Habits',
}

const CATEGORY_COLORS: Record<Category, string> = {
  meal: '#e8a838',
  skincare: '#7eb8a4',
  habit: '#7a9fd4',
}

interface Props {
  items: Item[]
  selected: number[]
  onChange: (ids: number[]) => void
}

export default function HabitLinkPicker({ items, selected, onChange }: Props) {
  const active = items.filter((i) => i.active)
  const byCategory = (['meal', 'skincare', 'habit'] as Category[]).map((cat) => ({
    cat,
    items: active.filter((i) => i.category === cat),
  })).filter((g) => g.items.length > 0)

  function toggle(id: number) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])
  }

  return (
    <div className="space-y-3">
      {byCategory.map(({ cat, items: catItems }) => (
        <div key={cat}>
          <p
            className="font-mono text-[10px] uppercase tracking-wider mb-1.5"
            style={{ color: CATEGORY_COLORS[cat] }}
          >
            {CATEGORY_LABELS[cat]}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {catItems.map((item) => {
              const isSelected = selected.includes(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className={`font-mono text-[10px] px-2 py-1 rounded border transition-all ${
                    isSelected
                      ? 'border-white text-white bg-bg-border'
                      : 'border-bg-border text-text-muted hover:border-white hover:text-white'
                  }`}
                >
                  {item.name}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      {active.length === 0 && (
        <p className="font-mono text-xs text-text-muted">No active habits to link.</p>
      )}
    </div>
  )
}
