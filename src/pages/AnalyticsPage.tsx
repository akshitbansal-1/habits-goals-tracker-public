import CompletionLineChart from '../components/analytics/CompletionLineChart'
import CategoryRadarChart from '../components/analytics/CategoryRadarChart'
import HeatmapGrid from '../components/analytics/HeatmapGrid'
import StreakCard from '../components/analytics/StreakCard'
import { useHistory } from '../hooks/useHistory'
import { useStats } from '../hooks/useStats'

export default function AnalyticsPage() {
  const history30 = useHistory(30)
  const history90 = useHistory(90)
  const stats = useStats(7)

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
      <h1 className="font-mono text-xs uppercase tracking-widest text-text-muted">Analytics</h1>

      {/* Streak */}
      {history30.data && <StreakCard data={history30.data} />}

      {/* Line chart */}
      {history30.isLoading ? (
        <div className="bg-bg-card border border-bg-border rounded-lg p-5 font-mono text-xs text-text-muted">
          loading...
        </div>
      ) : history30.data ? (
        <CompletionLineChart data={history30.data} />
      ) : null}

      {/* Radar + Heatmap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {stats.data && <CategoryRadarChart data={stats.data.weekly} />}
        {history90.data && <HeatmapGrid data={history90.data} />}
      </div>

      {history30.error && (
        <p className="font-mono text-xs text-red-400">
          Error loading analytics: {(history30.error as Error).message}
        </p>
      )}
    </div>
  )
}
