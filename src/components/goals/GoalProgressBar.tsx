interface Props {
  actual: number
  target: number
}

const MILESTONES = [25, 50, 75]

const milestoneLabels: Record<number, string> = {
  25: 'Keep going!',
  50: 'Halfway there!',
  75: 'Almost done!',
}

export default function GoalProgressBar({ actual, target }: Props) {
  const pct = target > 0 ? Math.min((actual / target) * 100, 100) : 0
  const milestone = [...MILESTONES].reverse().find((m) => pct >= m)

  return (
    <div>
      <div className="relative h-2.5 rounded-full overflow-visible" style={{ backgroundColor: 'var(--bg-border)' }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: '#4caf50' }}
        />
        {MILESTONES.map((m) => (
          <div
            key={m}
            className="absolute top-0 bottom-0 w-px z-10"
            style={{ left: `${m}%`, backgroundColor: 'var(--bg)' }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2">
        <span className="font-mono text-xs text-text-muted">
          {actual} / {target} completions
        </span>
        {milestone && (
          <span className="font-mono text-xs text-check">{milestoneLabels[milestone]}</span>
        )}
        <span className="font-mono text-xs text-text-muted">{Math.round(pct)}%</span>
      </div>
    </div>
  )
}
