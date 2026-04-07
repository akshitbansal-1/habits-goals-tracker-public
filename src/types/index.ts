export type Category = 'meal' | 'skincare' | 'habit'

export interface Item {
  id: number
  name: string
  description: string | null
  category: Category
  sort_order: number
  active: boolean
  created_at?: string
  // Present on dashboard (today) responses
  completed?: boolean
  completed_at?: string | null
  log_date?: string
}

export interface DayHistory {
  log_date: string
  completed_count: number
  total_count: number
  pct: number
}

export interface CategoryStat {
  category: Category
  completed: number
  total: number
}

export interface StatsResponse {
  weekly: CategoryStat[]
}

export interface TodayResponse {
  date: string
  items: Item[]
}

export interface ToggleResponse {
  item_id: number
  date: string
  completed: boolean
  completed_at: string | null
}

export interface Goal {
  id: number
  title: string
  description: string | null
  identity_statement: string | null
  why_it_matters: string | null
  target_completions: number
  actual_completions: number
  deadline: string | null
  status: 'active' | 'completed' | 'abandoned'
  completed_at: string | null
  created_at: string
  linked_item_ids: number[]
}

export interface GoalFormData {
  title: string
  description: string
  identity_statement: string
  why_it_matters: string
  target_completions: number
  deadline: string
  linked_item_ids: number[]
}

export interface AskEvidence {
  tool: string
  params: Record<string, unknown>
  data: unknown
}

export interface AskResponse {
  answer: string
  evidence: AskEvidence[]
}

export type AskProvider = 'anthropic' | 'google'

export interface NoteFolder {
  id: number
  name: string
  icon: string
  color: string
  sort_order: number
  created_at: string
  note_count: number
}

export interface NoteListItem {
  id: number
  folder_id: number
  title: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Note extends NoteListItem {
  content: string
}
