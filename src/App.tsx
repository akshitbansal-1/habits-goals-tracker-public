import { Outlet, useLocation } from 'react-router-dom'
import Header from './components/layout/Header'
import { useToday } from './hooks/useToday'

function todayStr() {
  return new Date().toISOString().split('T')[0]!
}

// Header reads today's items for the progress bar — only on dashboard
function AppShell() {
  const location = useLocation()
  const isDashboard = location.pathname === '/'
  const { data } = useToday(todayStr())

  return (
    <div className="min-h-screen bg-bg">
      <Header items={isDashboard ? data?.items : undefined} currentDate={data?.date} />
      <main>
        <Outlet />
      </main>
    </div>
  )
}

export default AppShell
