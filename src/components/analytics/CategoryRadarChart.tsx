import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import { useChartColors } from '../../lib/theme'
import type { CategoryStat } from '../../types'

interface Props {
  data: CategoryStat[]
}

const LABELS: Record<string, string> = { meal: 'Meals', skincare: 'Skincare', habit: 'Habits' }

export default function CategoryRadarChart({ data }: Props) {
  const c = useChartColors()

  const chartData = data.map((d) => ({
    subject: LABELS[d.category] ?? d.category,
    pct: d.total > 0 ? Math.round((Number(d.completed) / Number(d.total)) * 100) : 0,
  }))

  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-5">
      <h3 className="font-mono text-xs uppercase tracking-wider text-text-muted mb-4">
        Category breakdown (7d)
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={chartData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid stroke={c.grid} />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: c.axis, fontSize: 12, fontFamily: c.fontFamily }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: c.tooltipBg,
              border: `1px solid ${c.tooltipBorder}`,
              borderRadius: 8,
            }}
            itemStyle={{ color: '#7a9fd4', fontFamily: c.fontFamily, fontSize: 12 }}
            formatter={(v: number) => [`${v}%`, 'completion']}
          />
          <Radar
            name="Completion %"
            dataKey="pct"
            stroke="#7a9fd4"
            fill="#7a9fd4"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
