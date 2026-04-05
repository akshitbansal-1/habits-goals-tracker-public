interface ProgressBarProps {
  pct: number
  color?: string
  height?: string
}

export default function ProgressBar({ pct, color = '#4caf50', height = '2px' }: ProgressBarProps) {
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, backgroundColor: '#2a2a2a' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
      />
    </div>
  )
}
