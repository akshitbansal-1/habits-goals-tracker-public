import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchToday, toggleItem } from '../lib/api'

export function useToday(date: string) {
  return useQuery({
    queryKey: ['today', date],
    queryFn: () => fetchToday(date),
  })
}

export function useToggle(date: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (item_id: number) => toggleItem(item_id, date),
    onMutate: async (item_id) => {
      await queryClient.cancelQueries({ queryKey: ['today', date] })
      const prev = queryClient.getQueryData(['today', date])
      queryClient.setQueryData(['today', date], (old: ReturnType<typeof fetchToday> extends Promise<infer T> ? T : never) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((item) =>
            item.id === item_id ? { ...item, completed: !item.completed } : item
          ),
        }
      })
      return { prev }
    },
    onError: (_err, _item_id, context) => {
      if (context?.prev) queryClient.setQueryData(['today', date], context.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['today', date] })
    },
  })
}
