import { format, subDays, eachDayOfInterval } from 'date-fns'
import type { DayHistory } from '../../types'

interface Props {
  data: DayHistory[]
}

function pctToOpacity(pct: number): number {
  if (pct === 0) return 0.08
  if (pct < 40) return 0.25
  if (pct < 70) return 0.5
  if (pct < 90) return 0.75
  return 1
}

export default function HeatmapGrid({ data }: Props) {
  const today = new Date()
  const start = subDays(today, 83)

  const allDays = eachDayOfInterval({ start, end: today })
  // Normalise keys to YYYY-MM-DD (log_date may be a full ISO string)
  const dataMap = new Map(
    data.map((d) => [String(d.log_date).substring(0, 10), d])
  )

  const weeks: Date[][] = []
  let week: Date[] = []
  allDays.forEach((day, i) => {
    week.push(day)
    if (week.length === 7 || i === allDays.length - 1) {
      weeks.push(week)
      week = []
    }
  })

  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-5">
      <h3 className="font-mono text-xs uppercase tracking-wider text-text-muted mb-4">
        12-week heatmap
      </h3>
      <div className="overflow-x-auto">
        <div className="flex gap-1">
          {weeks.map((wk, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {wk.map((day) => {
                const key = day.toISOString().split('T')[0]!
                const entry = dataMap.get(key)
                const pct = entry ? Number(entry.pct) : 0
                return (
                  <div
                    key={key}
                    title={`${format(day, 'MMM d')}${entry ? `: ${pct}%` : ': no data'}`}
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: `rgba(74, 222, 128, ${pctToOpacity(pct)})` }}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3">
        <span className="font-mono text-[10px] text-text-muted">Less</span>
        {[0.08, 0.25, 0.5, 0.75, 1].map((op) => (
          <div key={op} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(74, 222, 128, ${op})` }} />
        ))}
        <span className="font-mono text-[10px] text-text-muted">More</span>
      </div>
    </div>
  )
}
