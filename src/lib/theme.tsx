import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: 'dark',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) ?? 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)

/** Returns Recharts-compatible color values that match the current theme */
export function useChartColors() {
  const { theme } = useTheme()
  return {
    grid: theme === 'dark' ? '#2a2a2a' : '#e5e7eb',
    axis: theme === 'dark' ? '#888888' : '#6b7280',
    tooltipBg: theme === 'dark' ? '#161616' : '#ffffff',
    tooltipBorder: theme === 'dark' ? '#2a2a2a' : '#e5e7eb',
    tooltipText: theme === 'dark' ? '#e0e0e0' : '#111111',
    fontFamily: 'IBM Plex Mono',
  }
}
