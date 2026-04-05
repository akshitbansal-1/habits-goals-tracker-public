import { useQuery } from '@tanstack/react-query'
import { fetchHistory } from '../lib/api'

export function useHistory(days = 7) {
  return useQuery({
    queryKey: ['history', days],
    queryFn: () => fetchHistory(days),
    staleTime: 5 * 60 * 1000,
  })
}
