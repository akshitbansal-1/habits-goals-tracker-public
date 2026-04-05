import { useState } from 'react'
import DateNav from '../components/layout/DateNav'
import CategoryColumn from '../components/dashboard/CategoryColumn'
import QuoteBar from '../components/dashboard/QuoteBar'
import { useToday, useToggle } from '../hooks/useToday'
import type { Category } from '../types'

function todayStr() {
  return new Date().toISOString().split('T')[0]!
}

const CATEGORIES: Category[] = ['meal', 'skincare', 'habit']

export default function DashboardPage() {
  const [date, setDate] = useState(todayStr)
  const { data, isLoading, error } = useToday(date)
  const toggle = useToggle(date)

  if (error) {
    return (
      <div className="p-6 font-mono text-sm text-red-400">
        ⚠ DB error: {(error as Error).message}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
      <DateNav selectedDate={date} onDateChange={setDate} />
      <QuoteBar />

      {isLoading ? (
        <div className="font-mono text-xs text-text-muted py-8 text-center">loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => (
            <CategoryColumn
              key={cat}
              category={cat}
              items={(data?.items ?? []).filter((i) => i.category === cat)}
              onToggle={(id) => toggle.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
