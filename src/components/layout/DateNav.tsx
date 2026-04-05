import { format, subDays, isToday, parseISO } from 'date-fns'

interface DateNavProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

function todayStr() {
  return new Date().toISOString().split('T')[0]!
}

export default function DateNav({ selectedDate, onDateChange }: DateNavProps) {
  const today = todayStr()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    return d.toISOString().split('T')[0]!
  })

  return (
    <div className="flex gap-1.5 overflow-x-auto py-2 px-1 scrollbar-hide">
      {days.map((day) => {
        const active = day === selectedDate
        const todayDay = day === today
        const date = parseISO(day + 'T12:00:00')
        return (
          <button
            key={day}
            onClick={() => onDateChange(day)}
            className={`flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-lg font-mono text-xs transition-all ${
              active
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
  )
}
