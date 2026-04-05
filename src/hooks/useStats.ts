import { useQuery } from '@tanstack/react-query'
import { fetchStats } from '../lib/api'

export function useStats(days?: number) {
  return useQuery({
    queryKey: ['stats', days],
    queryFn: () => fetchStats(days),
    staleTime: 5 * 60 * 1000,
  })
}
