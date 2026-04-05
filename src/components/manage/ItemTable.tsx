import Badge from '../ui/Badge'
import type { Item } from '../../types'

interface Props {
  items: Item[]
  onEdit: (item: Item) => void
  onDelete: (item: Item) => void
}

export default function ItemTable({ items, onEdit, onDelete }: Props) {
  return (
    <div className="border border-bg-border rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-bg-border bg-bg-card">
            <th className="text-left px-5 py-3.5 font-mono text-xs text-text-muted uppercase tracking-wider">Name</th>
            <th className="text-left px-5 py-3.5 font-mono text-xs text-text-muted uppercase tracking-wider hidden sm:table-cell">Category</th>
            <th className="text-left px-5 py-3.5 font-mono text-xs text-text-muted uppercase tracking-wider hidden sm:table-cell">Order</th>
            <th className="text-left px-5 py-3.5 font-mono text-xs text-text-muted uppercase tracking-wider">Status</th>
            <th className="px-5 py-3.5" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-bg-border last:border-0 hover:bg-bg-card transition-colors">
              <td className="px-5 py-3.5 text-sm text-primary">
                <span className={item.active ? '' : 'line-through text-text-muted'}>{item.name}</span>
                <span className="sm:hidden ml-2"><Badge category={item.category} /></span>
              </td>
              <td className="px-5 py-3.5 hidden sm:table-cell">
                <Badge category={item.category} />
              </td>
              <td className="px-5 py-3.5 font-mono text-sm text-text-muted hidden sm:table-cell">
                {item.sort_order}
              </td>
              <td className="px-5 py-3.5">
                <span className={`font-mono text-xs ${item.active ? 'text-check' : 'text-text-muted'}`}>
                  {item.active ? 'active' : 'inactive'}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <div className="flex gap-4 justify-end">
                  <button onClick={() => onEdit(item)} className="font-mono text-xs text-text-muted hover:text-primary transition-colors">
                    edit
                  </button>
                  <button onClick={() => onDelete(item)} className="font-mono text-xs text-text-muted hover:text-red-400 transition-colors">
                    {item.active ? 'deactivate' : 'delete'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 && (
        <p className="font-mono text-sm text-text-muted text-center py-10">No habits yet.</p>
      )}
    </div>
  )
}
