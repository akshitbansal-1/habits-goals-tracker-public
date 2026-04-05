import { useState } from 'react'
import GoalCard from '../components/goals/GoalCard'
import GoalForm from '../components/goals/GoalForm'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '../hooks/useGoals'
import { useItems } from '../hooks/useItems'
import type { Goal, GoalFormData } from '../types'

export default function GoalsPage() {
  const { data: goals, isLoading: goalsLoading } = useGoals()
  const { data: items } = useItems()
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)

  function openCreate() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(goal: Goal) {
    setEditing(goal)
    setFormOpen(true)
  }

  function handleDelete(goal: Goal) {
    if (!confirm(`Delete goal "${goal.title}"? This cannot be undone.`)) return
    deleteGoal.mutate(goal.id)
  }

  function handleComplete(goal: Goal) {
    updateGoal.mutate({ id: goal.id, data: { status: 'completed' } })
  }

  function handleSubmit(data: GoalFormData) {
    if (editing) {
      updateGoal.mutate({ id: editing.id, data }, { onSuccess: () => setFormOpen(false) })
    } else {
      createGoal.mutate(data, { onSuccess: () => setFormOpen(false) })
    }
  }

  const active = goals?.filter((g) => g.status === 'active') ?? []
  const completed = goals?.filter((g) => g.status === 'completed') ?? []
  const abandoned = goals?.filter((g) => g.status === 'abandoned') ?? []

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-xs uppercase tracking-widest text-text-muted">Goals</h1>
        <button
          onClick={openCreate}
          className="btn-primary"
        >
          + New goal
        </button>
      </div>

      {goalsLoading ? (
        <div className="font-mono text-xs text-text-muted py-8 text-center">loading...</div>
      ) : (
        <>
          {/* Active goals */}
          {active.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-mono text-xs uppercase tracking-wider text-check">
                Active — {active.length}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {active.map((g) => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    items={items ?? []}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onComplete={handleComplete}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed goals */}
          {completed.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-mono text-xs uppercase tracking-wider text-text-muted">
                Completed — {completed.length}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-60">
                {completed.map((g) => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    items={items ?? []}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onComplete={handleComplete}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Abandoned */}
          {abandoned.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-mono text-xs uppercase tracking-wider text-text-muted">
                Abandoned — {abandoned.length}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-40">
                {abandoned.map((g) => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    items={items ?? []}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onComplete={handleComplete}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {(goals?.length ?? 0) === 0 && (
            <div className="text-center py-12 space-y-3">
              <p className="font-mono text-text-muted text-sm">No goals yet.</p>
              <p className="font-mono text-xs text-text-muted max-w-sm mx-auto">
                Goals connected to your daily habits create a powerful feedback loop. Start by creating a goal and linking the habits that move you toward it.
              </p>
              <button
                onClick={openCreate}
                className="font-mono text-xs text-check underline hover:no-underline"
              >
                Create your first goal
              </button>
            </div>
          )}
        </>
      )}

      <GoalForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        initial={editing}
        items={items ?? []}
        isLoading={createGoal.isPending || updateGoal.isPending}
      />
    </div>
  )
}
