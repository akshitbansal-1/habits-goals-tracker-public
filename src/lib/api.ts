import type { TodayResponse, ToggleResponse, DayHistory, StatsResponse, Item, Goal, GoalFormData } from '../types'

const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error || `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// Today
export const fetchToday = (date: string) =>
  request<TodayResponse>(`/today?date=${date}`)

export const toggleItem = (item_id: number, date: string) =>
  request<ToggleResponse>('/toggle', {
    method: 'POST',
    body: JSON.stringify({ item_id, date }),
  })

// History & stats
export const fetchHistory = (days: number) =>
  request<DayHistory[]>(`/history?days=${days}`)

export const fetchStats = (days?: number) =>
  request<StatsResponse>(`/stats${days ? `?days=${days}` : ''}`)

// Items CRUD
export const fetchItems = () => request<Item[]>('/items')

export const createItem = (data: Partial<Item>) =>
  request<Item>('/items', { method: 'POST', body: JSON.stringify(data) })

export const updateItem = (id: number, data: Partial<Item>) =>
  request<Item>(`/items/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteItem = (id: number) =>
  request<{ deleted: boolean; deactivated: boolean }>(`/items/${id}`, { method: 'DELETE' })

// Goals CRUD
export const fetchGoals = () => request<Goal[]>('/goals')

export const createGoal = (data: GoalFormData) =>
  request<Goal>('/goals', { method: 'POST', body: JSON.stringify(data) })

export const updateGoal = (id: number, data: Partial<GoalFormData> & { status?: string }) =>
  request<Goal>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) })

export const deleteGoal = (id: number) =>
  request<{ deleted: boolean }>(`/goals/${id}`, { method: 'DELETE' })
