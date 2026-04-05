import type { DayHistory } from '../../types'

const STREAK_THRESHOLD = 80

interface Props {
  data: DayHistory[]
}

function computeStreaks(data: DayHistory[]): { current: number; best: number } {
  const sorted = [...data].sort((a, b) => b.log_date.localeCompare(a.log_date))

  let current = 0
  for (const d of sorted) {
    if (Number(d.pct) >= STREAK_THRESHOLD) current++
    else break
  }

  let best = 0
  let running = 0
  for (const d of [...data].sort((a, b) => a.log_date.localeCompare(b.log_date))) {
    if (Number(d.pct) >= STREAK_THRESHOLD) {
      running++
      best = Math.max(best, running)
    } else {
      running = 0
    }
  }

  return { current, best }
}

export default function StreakCard({ data }: Props) {
  const { current, best } = computeStreaks(data)

  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-5 flex gap-6">
      <div className="flex-1 text-center">
        <div className="font-mono text-5xl font-semibold text-primary leading-none">
          {current}
          {current >= 7 && <span className="ml-1.5 text-3xl">🔥</span>}
        </div>
        <div className="font-mono text-xs text-text-muted mt-2 uppercase tracking-wider">
          day streak
        </div>
        <div className="font-mono text-[11px] text-text-muted mt-1">
          ≥{STREAK_THRESHOLD}% daily
        </div>
      </div>
      <div className="w-px bg-bg-border" />
      <div className="flex-1 text-center">
        <div className="font-mono text-5xl font-semibold leading-none" style={{ color: '#e8a838' }}>
          {best}
        </div>
        <div className="font-mono text-xs text-text-muted mt-2 uppercase tracking-wider">
          best streak
        </div>
        <div className="font-mono text-[11px] text-text-muted mt-1">all time</div>
      </div>
    </div>
  )
}
