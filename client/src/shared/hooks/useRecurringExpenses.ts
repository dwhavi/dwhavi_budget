// 고정비 CRUD + 토글 훅
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type {
  RecurringExpense,
  RecurringExpenseCreateRequest,
  RecurringExpenseUpdateRequest,
} from '@/shared/types'

export function useRecurringExpenses() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['recurring-expenses', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .order('is_active', { ascending: false })
        .order('start_date', { ascending: true })
      if (error) throw error
      return (data ?? []) as RecurringExpense[]
    },
    enabled: !!user,
  })
}

export function useCreateRecurringExpense() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: RecurringExpenseCreateRequest) => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .insert({ ...input, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data as RecurringExpense
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-expenses'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useUpdateRecurringExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: RecurringExpenseUpdateRequest & { id: number }) => {
      const { data, error } = await supabase
        .from('recurring_expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as RecurringExpense
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-expenses'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useDeleteRecurringExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('recurring_expenses')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-expenses'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useToggleRecurringExpense() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: current, error: fetchError } = await supabase
        .from('recurring_expenses')
        .select('is_active')
        .eq('id', id)
        .single()
      if (fetchError) throw fetchError
      const { data, error } = await supabase
        .from('recurring_expenses')
        .update({ is_active: !current?.is_active })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as RecurringExpense
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recurring-expenses'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

interface RecurringExpenseSummary {
  totalAmount: number
  items: RecurringExpense[]
}

function getMonthEnd(month: string): string {
  const parts = month.split('-').map(Number)
  const year = parts[0]!
  const m = parts[1]!
  const lastDay = new Date(year, m, 0).getDate()
  return `${month}-${String(lastDay).padStart(2, '0')}`
}

export function useRecurringExpenseMonthlySummary(month: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['recurring-expenses', 'monthly-summary', user?.id, month],
    queryFn: async (): Promise<RecurringExpenseSummary> => {
      const monthStart = `${month}-01`
      const monthEnd = getMonthEnd(month)

      const { data, error } = await supabase
        .from('recurring_expenses')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .lte('start_date', monthEnd)
        .or(`end_date.is.null,end_date.gte.${monthStart}`)
        .is('deleted_at', null)

      if (error) throw error

      const items = (data ?? []) as RecurringExpense[]
      const totalAmount = items.reduce((s, item) => s + item.amount, 0)
      return { totalAmount, items }
    },
    enabled: !!user,
  })
}
