import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, parseISO } from 'date-fns'
import { useChartColors } from '../../lib/theme'
import type { DayHistory } from '../../types'

interface Props {
  data: DayHistory[]
}

export default function CompletionLineChart({ data }: Props) {
  const c = useChartColors()
  const sorted = [...data].sort((a, b) => a.log_date.localeCompare(b.log_date))

  const chartData = sorted.map((d) => {
    // log_date may arrive as "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm:ss.sssZ" — normalise to first 10 chars
    const dateStr = String(d.log_date).substring(0, 10)
    return {
      date: format(parseISO(dateStr + 'T12:00:00'), 'MMM d'),
      pct: Number(d.pct),
      done: Number(d.completed_count),
      total: Number(d.total_count),
    }
  })

  return (
    <div className="bg-bg-card border border-bg-border rounded-xl p-5">
      <h3 className="font-mono text-xs uppercase tracking-wider text-text-muted mb-4">
        Daily completion %
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
          <XAxis
            dataKey="date"
            tick={{ fill: c.axis, fontSize: 11, fontFamily: c.fontFamily }}
            axisLine={{ stroke: c.grid }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: c.axis, fontSize: 11, fontFamily: c.fontFamily }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: c.tooltipBg,
              border: `1px solid ${c.tooltipBorder}`,
              borderRadius: 8,
            }}
            labelStyle={{ color: c.tooltipText, fontFamily: c.fontFamily, fontSize: 12 }}
            itemStyle={{ color: '#4caf50', fontFamily: c.fontFamily, fontSize: 12 }}
            formatter={(value: number, _name, props) =>
              [`${value}% (${props.payload.done}/${props.payload.total})`, 'completion']
            }
          />
          <Line
            type="monotone"
            dataKey="pct"
            stroke="#4caf50"
            strokeWidth={2.5}
            dot={{ fill: '#4caf50', r: 3.5 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
