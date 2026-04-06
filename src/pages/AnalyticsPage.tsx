import { useState } from 'react'
import CompletionLineChart from '../components/analytics/CompletionLineChart'
import CategoryRadarChart from '../components/analytics/CategoryRadarChart'
import HeatmapGrid from '../components/analytics/HeatmapGrid'
import StreakCard from '../components/analytics/StreakCard'
import { useHistory } from '../hooks/useHistory'
import { useStats } from '../hooks/useStats'

const PERIODS = [
  { label: '7d',  days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30)

  const history = useHistory(period)
  const history90 = useHistory(90)   // heatmap always uses 90 days
  const stats = useStats(period)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-mono text-xs uppercase tracking-widest text-text-muted">Analytics</h1>

        {/* Period selector */}
        <div className="flex gap-1 bg-bg-card border border-bg-border rounded-lg p-1">
          {PERIODS.map(({ label, days }) => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`font-mono text-xs px-3 py-1.5 rounded-md transition-colors ${
                period === days
                  ? 'bg-bg-border text-primary'
                  : 'text-text-muted hover:text-primary'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Streak — based on selected period */}
      {history.data && <StreakCard data={history.data} />}

      {/* Line chart */}
      {history.isLoading ? (
        <div className="bg-bg-card border border-bg-border rounded-xl p-5 font-mono text-xs text-text-muted">
          loading...
        </div>
      ) : history.data ? (
        <CompletionLineChart data={history.data} />
      ) : null}

      {/* Radar + Heatmap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.data && <CategoryRadarChart data={stats.data.weekly} />}
        {history90.data && <HeatmapGrid data={history90.data} />}
      </div>

      {history.error && (
        <p className="font-mono text-xs text-red-400">
          Error: {(history.error as Error).message}
        </p>
      )}
    </div>
  )
}
