import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import Modal from '../ui/Modal'
import HabitLinkPicker from './HabitLinkPicker'
import type { Goal, GoalFormData, Item } from '../../types'

interface Props {
  open: boolean
  onClose: () => void
  onSubmit: (data: GoalFormData) => void
  initial?: Goal | null
  items: Item[]
  isLoading?: boolean
}

const inputClass =
  'w-full bg-bg border border-bg-border rounded-lg px-3 py-2.5 text-sm text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors'

const SMART_TIPS = [
  { label: 'S — Specific', tip: 'What exactly do you want to achieve? Be precise.' },
  { label: 'M — Measurable', tip: 'How will you track progress? Use the target completions field.' },
  { label: 'A — Achievable', tip: 'Is this realistic given your current habits and time?' },
  { label: 'R — Relevant', tip: 'Why does this matter for the identity you wrote above?' },
  { label: 'T — Time-bound', tip: 'Set a deadline to create urgency and focus.' },
]

export default function GoalForm({ open, onClose, onSubmit, initial, items, isLoading }: Props) {
  const [showSmart, setShowSmart] = useState(false)
  const [linkedIds, setLinkedIds] = useState<number[]>([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Omit<GoalFormData, 'linked_item_ids'>>({
    defaultValues: {
      title: '', description: '', identity_statement: '',
      why_it_matters: '', target_completions: 30, deadline: '',
    },
  })

  useEffect(() => {
    if (open) {
      setLinkedIds(initial?.linked_item_ids ?? [])
      reset(initial ? {
        title: initial.title,
        description: initial.description ?? '',
        identity_statement: initial.identity_statement ?? '',
        why_it_matters: initial.why_it_matters ?? '',
        target_completions: initial.target_completions,
        deadline: initial.deadline ?? '',
      } : {
        title: '', description: '', identity_statement: '',
        why_it_matters: '', target_completions: 30, deadline: '',
      })
    }
  }, [open, initial, reset])

  function handleFormSubmit(data: Omit<GoalFormData, 'linked_item_ids'>) {
    onSubmit({ ...data, linked_item_ids: linkedIds })
  }

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Edit Goal' : 'New Goal'}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">

        <div>
          <label className="font-mono text-xs text-text-muted uppercase tracking-wider block mb-1.5">
            Identity statement
          </label>
          <input
            {...register('identity_statement')}
            className={inputClass + ' italic'}
            placeholder="I am becoming someone who..."
          />
          <p className="font-mono text-[11px] text-text-muted mt-1">
            Who do you want to be? Habits follow identity.
          </p>
        </div>

        <div>
          <label className="font-mono text-xs text-text-muted uppercase tracking-wider block mb-1.5">
            Goal title *
          </label>
          <input
            {...register('title', { required: 'Title is required' })}
            className={inputClass}
            placeholder="e.g. Build a consistent fitness routine"
          />
          {errors.title && <p className="font-mono text-xs text-red-400 mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="font-mono text-xs text-text-muted uppercase tracking-wider block mb-1.5">
            Implementation plan
          </label>
          <textarea
            {...register('description')}
            rows={2}
            className={inputClass + ' resize-none'}
            placeholder="When [trigger], I will [behavior]..."
          />
        </div>

        <div>
          <label className="font-mono text-xs text-text-muted uppercase tracking-wider block mb-1.5">
            Why it matters
          </label>
          <textarea
            {...register('why_it_matters')}
            rows={2}
            className={inputClass + ' resize-none'}
            placeholder="The deeper reason behind this goal..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-mono text-xs text-text-muted uppercase tracking-wider block mb-1.5">
              Target completions *
            </label>
            <input
              type="number" min={1}
              {...register('target_completions', {
                required: 'Required',
                valueAsNumber: true,
                min: { value: 1, message: 'Must be ≥ 1' },
              })}
              className={inputClass + ' font-mono'}
            />
            {errors.target_completions && (
              <p className="font-mono text-xs text-red-400 mt-1">{errors.target_completions.message}</p>
            )}
          </div>
          <div>
            <label className="font-mono text-xs text-text-muted uppercase tracking-wider block mb-1.5">
              Deadline
            </label>
            <input
              type="date" {...register('deadline')}
              className={inputClass + ' font-mono'}
              style={{ colorScheme: 'dark' }}
            />
          </div>
        </div>

        <div>
          <label className="font-mono text-xs text-text-muted uppercase tracking-wider block mb-2">
            Link habits
          </label>
          <HabitLinkPicker items={items} selected={linkedIds} onChange={setLinkedIds} />
          <p className="font-mono text-[11px] text-text-muted mt-1.5">
            Each completion counts toward the target.
          </p>
        </div>

        <div className="border border-bg-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowSmart((s) => !s)}
            className="w-full flex items-center justify-between px-4 py-3 font-mono text-xs text-text-muted hover:text-primary transition-colors"
          >
            <span>SMART goal framework guide</span>
            <span>{showSmart ? '▵' : '▿'}</span>
          </button>
          {showSmart && (
            <div className="px-4 pb-4 border-t border-bg-border space-y-2 pt-3 bg-bg">
              {SMART_TIPS.map((t) => (
                <div key={t.label}>
                  <span className="font-mono text-xs text-check">{t.label}: </span>
                  <span className="font-mono text-xs text-text-muted">{t.tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit" disabled={isLoading}
            className="flex-1 btn-primary"
          >
            {isLoading ? 'saving...' : initial ? 'Save changes' : 'Create goal'}
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
