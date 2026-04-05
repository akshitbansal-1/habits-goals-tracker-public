import type { Category } from '../../types'

const colors: Record<Category, string> = {
  meal: 'text-accent-meal border-accent-meal',
  skincare: 'text-accent-skin border-accent-skin',
  habit: 'text-accent-habit border-accent-habit',
}

export default function Badge({ category }: { category: Category }) {
  return (
    <span className={`font-mono text-xs px-2 py-0.5 rounded border ${colors[category]}`}>
      {category}
    </span>
  )
}
