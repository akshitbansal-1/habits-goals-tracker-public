import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Modal from '../ui/Modal'
import type { Item, Category } from '../../types'

const CATEGORIES: Category[] = ['meal', 'skincare', 'habit']

interface FormData {
  name: string
  category: Category
  description: string
  sort_order: number
  active: boolean
}

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: FormData) => void
  initial?: Item | null
  isLoading?: boolean
}

const inputClass =
  'w-full bg-bg border border-bg-border rounded-lg px-3 py-2.5 text-sm text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors'

export default function ItemForm({ open, onClose, onSubmit, initial, isLoading }: Props) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: { name: '', category: 'habit', description: '', sort_order: 0, active: true },
  })

  useEffect(() => {
    if (open) {
      reset(initial ? {
        name: initial.name,
        category: initial.category,
        description: initial.description ?? '',
        sort_order: initial.sort_order,
        active: initial.active,
      } : { name: '', category: 'habit', description: '', sort_order: 0, active: true })
    }
  }, [open, initial, reset])

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Habit' : 'New Habit'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="font-mono text-xs text-text-muted uppercase tracking-wider block mb-1.5">
            Name *
          </label>
          <input
            {...register('name', { required: 'Name is required' })}
            className={inputClass}
            placeholder="e.g. 💪 Morning workout"
          />
          {errors.name && <p className="font-mono text-xs text-red-400 mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="font-mono text-xs text-text-muted uppercase tracking-wider block mb-1.5">
            Category *
          </label>
          <select {...register('category')} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="font-mono text-xs text-text-muted uppercase tracking-wider block mb-1.5">
            Description
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className={inputClass + ' resize-none'}
            placeholder={"Details about this habit...\nCriteria: what counts as done"}
          />
        </div>

        <div>
          <label className="font-mono text-xs text-text-muted uppercase tracking-wider block mb-1.5">
            Sort order
          </label>
          <input
            type="number"
            {...register('sort_order', { valueAsNumber: true })}
            className={inputClass + ' font-mono'}
          />
        </div>

        {initial && (
          <div className="flex items-center gap-2.5">
            <input type="checkbox" id="active" {...register('active')} className="rounded" />
            <label htmlFor="active" className="text-sm text-text-muted cursor-pointer">
              Active — shows on daily dashboard
            </label>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit" disabled={isLoading}
            className="flex-1 btn-primary"
          >
            {isLoading ? 'saving...' : initial ? 'Save changes' : 'Add habit'}
          </button>
          <button
            type="button" onClick={onClose}
            className="px-5 border border-bg-border text-text-muted font-mono text-xs rounded-lg hover:text-primary transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}
