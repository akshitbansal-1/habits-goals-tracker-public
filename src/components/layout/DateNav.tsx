import { useState } from 'react'
import { format, subDays, isToday, parseISO, isFuture } from 'date-fns'

interface DateNavProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

function todayStr() {
  return new Date().toISOString().split('T')[0]!
}

export default function DateNav({ selectedDate, onDateChange }: DateNavProps) {
  // weekOffset: 0 = window ending today, -1 = window ending 7 days ago, etc.
  const [weekOffset, setWeekOffset] = useState(0)

  const today = todayStr()

  // Build the 7-day window for the current offset
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), (6 - i) + (-weekOffset * 7))
    return d.toISOString().split('T')[0]!
  })

  function shiftBack() {
    const newOffset = weekOffset - 1
    setWeekOffset(newOffset)
    // If selected date is outside the new window, select the last day in it
    const newDays = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), (6 - i) + (-newOffset * 7))
      return d.toISOString().split('T')[0]!
    })
    if (!newDays.includes(selectedDate)) {
      onDateChange(newDays[newDays.length - 1]!)
    }
  }

  function shiftForward() {
    if (weekOffset >= 0) return
    const newOffset = weekOffset + 1
    setWeekOffset(newOffset)
    const newDays = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(new Date(), (6 - i) + (-newOffset * 7))
      return d.toISOString().split('T')[0]!
    })
    // Select the most recent non-future day in the new window
    const validDays = newDays.filter((d) => !isFuture(parseISO(d + 'T12:00:00')))
    const target = validDays[validDays.length - 1] ?? newDays[0]!
    if (!newDays.includes(selectedDate)) onDateChange(target)
  }

  return (
    <div className="flex items-center gap-1">
      {/* Back arrow */}
      <button
        onClick={shiftBack}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded font-mono text-text-muted hover:text-primary hover:bg-bg-card transition-colors"
        title="Earlier week"
      >
        ‹
      </button>

      <div className="flex gap-1 overflow-x-auto scrollbar-hide flex-1">
        {days.map((day) => {
          const active = day === selectedDate
          const todayDay = day === today
          const future = isFuture(parseISO(day + 'T12:00:00'))
          const date = parseISO(day + 'T12:00:00')
          return (
            <button
              key={day}
              onClick={() => !future && onDateChange(day)}
              disabled={future}
              className={`flex-1 min-w-[44px] flex flex-col items-center px-2 py-2.5 rounded-lg font-mono text-xs transition-all ${
                future
                  ? 'opacity-30 cursor-not-allowed text-text-muted'
                  : active
                  ? 'bg-bg-border text-primary'
                  : 'text-text-muted hover:text-primary hover:bg-bg-card'
              }`}
            >
              <span className="uppercase text-[10px] tracking-wider">{format(date, 'EEE')}</span>
              <span
                className={`text-lg font-semibold mt-0.5 leading-none ${
                  todayDay && !active ? 'text-check' : ''
                }`}
              >
                {format(date, 'd')}
              </span>
              {isToday(date) && (
                <span className="text-[9px] uppercase tracking-wider mt-1 text-check">today</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Forward arrow — only active when we're looking at a past window */}
      <button
        onClick={shiftForward}
        disabled={weekOffset >= 0}
        className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded font-mono transition-colors ${
          weekOffset < 0
            ? 'text-text-muted hover:text-primary hover:bg-bg-card'
            : 'text-text-muted opacity-30 cursor-not-allowed'
        }`}
        title="Later week"
      >
        ›
      </button>
    </div>
  )
}
