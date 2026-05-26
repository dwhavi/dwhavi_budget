// 예산 CRUD 훅
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Budget, BudgetUpsertRequest } from '@/shared/types'

export function useBudgets(month: string) {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['budgets', user?.id, month],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*, category:categories(*)')
        .eq('user_id', user!.id)
        .eq('month', month)
      if (error) throw error
      return (data ?? []) as Budget[]
    },
    enabled: !!user,
  })
}

export function useUpsertBudget() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: BudgetUpsertRequest) => {
      const { data, error } = await supabase
        .from('budgets')
        .upsert(
          { ...input, user_id: user!.id },
          { onConflict: 'user_id,category_id,month' },
        )
        .select()
        .single()
      if (error) throw error
      return data as Budget
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['budgets', user?.id, variables.month] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}
