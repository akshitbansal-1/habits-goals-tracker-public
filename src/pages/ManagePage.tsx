import { useState } from 'react'
import ItemTable from '../components/manage/ItemTable'
import ItemForm from '../components/manage/ItemForm'
import { useItems, useCreateItem, useUpdateItem, useDeleteItem } from '../hooks/useItems'
import type { Item, Category } from '../types'

interface FormData {
  name: string
  category: Category
  description: string
  sort_order: number
  active: boolean
}

export default function ManagePage() {
  const { data: items, isLoading } = useItems()
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()
  const deleteItem = useDeleteItem()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(item: Item) {
    setEditing(item)
    setFormOpen(true)
  }

  function handleDelete(item: Item) {
    const action = item.active ? 'deactivate' : 'permanently delete'
    if (!confirm(`Are you sure you want to ${action} "${item.name}"?`)) return
    deleteItem.mutate(item.id)
  }

  function handleSubmit(data: FormData) {
    if (editing) {
      updateItem.mutate(
        { id: editing.id, data },
        { onSuccess: () => setFormOpen(false) }
      )
    } else {
      createItem.mutate(data, { onSuccess: () => setFormOpen(false) })
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-xs uppercase tracking-widest text-text-muted">Manage Habits</h1>
        <button
          onClick={openCreate}
          className="btn-primary"
        >
          + New habit
        </button>
      </div>

      {isLoading ? (
        <div className="font-mono text-xs text-text-muted py-8 text-center">loading...</div>
      ) : (
        <ItemTable items={items ?? []} onEdit={openEdit} onDelete={handleDelete} />
      )}

      <ItemForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        isLoading={createItem.isPending || updateItem.isPending}
      />
    </div>
  )
}
