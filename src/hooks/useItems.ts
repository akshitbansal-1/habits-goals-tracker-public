import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchItems, createItem, updateItem, deleteItem } from '../lib/api'
import type { Item } from '../types'

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
  })
}

export function useCreateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<Item>) => createItem(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  })
}

export function useUpdateItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Item> }) => updateItem(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  })
}

export function useDeleteItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['items'] }),
  })
}
