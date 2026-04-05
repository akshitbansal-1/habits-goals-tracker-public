import { NavLink } from 'react-router-dom'
import { format } from 'date-fns'
import ProgressBar from '../ui/ProgressBar'
import { useTheme } from '../../lib/theme'
import type { Item } from '../../types'

interface HeaderProps {
  items?: Item[]
  currentDate?: string
}

export default function Header({ items, currentDate }: HeaderProps) {
  const { theme, toggle } = useTheme()
  const completed = items?.filter((i) => i.completed).length ?? 0
  const total = items?.length ?? 0
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  const dateStr = (currentDate ?? new Date().toISOString().split('T')[0]!).substring(0, 10)
  const dateLabel = format(new Date(dateStr + 'T12:00:00'), 'EEE d MMM')

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `font-mono text-xs uppercase tracking-wider transition-colors ${
      isActive ? 'text-primary font-semibold' : 'text-text-muted hover:text-primary'
    }`

  return (
    <header className="sticky top-0 z-40 bg-bg border-b border-bg-border">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <span className="font-mono text-base text-primary font-semibold tracking-tight">habits</span>
          <nav className="hidden sm:flex items-center gap-5">
            <NavLink to="/" end className={navClass}>Today</NavLink>
            <NavLink to="/analytics" className={navClass}>Analytics</NavLink>
            <NavLink to="/goals" className={navClass}>Goals</NavLink>
            <NavLink to="/manage" className={navClass}>Manage</NavLink>
          </nav>
        </div>

        <div className="flex items-center gap-3 flex-1 justify-end">
          {items && (
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-xs font-mono text-text-muted mb-1.5">
                <span>{dateLabel}</span>
                <span>{completed}/{total}</span>
              </div>
              <ProgressBar pct={pct} />
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md border border-bg-border text-text-muted hover:text-primary hover:border-primary transition-colors text-base"
          >
            {theme === 'dark' ? '☀' : '◐'}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="sm:hidden flex border-t border-bg-border">
        {[
          { to: '/', label: 'Today', end: true },
          { to: '/analytics', label: 'Analytics' },
          { to: '/goals', label: 'Goals' },
          { to: '/manage', label: 'Manage' },
        ].map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 text-center py-2.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                isActive
                  ? 'text-primary font-semibold border-b-2 border-primary'
                  : 'text-text-muted'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </div>
    </header>
  )
}
