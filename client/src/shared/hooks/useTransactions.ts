// 거래 CRUD + 필터/페이징 훅
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type {
  Transaction,
  PaymentMethod,
  TransactionCreateRequest,
  TransactionUpdateRequest,
} from '@/shared/types'

interface TransactionFilters {
  month: string
  type?: 'income' | 'expense'
  category_id?: number
  payment_method_id?: number
  keyword?: string
  page?: number
  limit?: number
}

interface TransactionRow extends Transaction {
  payment_method?: PaymentMethod
}

interface TransactionListResult {
  transactions: TransactionRow[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export function useTransactions(params: TransactionFilters) {
  const { user } = useAuth()
  const page = params.page ?? 1
  const limit = params.limit ?? 20

  return useQuery({
    queryKey: [
      'transactions',
      user?.id,
      params.month,
      params.type,
      params.category_id,
      params.payment_method_id,
      params.keyword,
      page,
      limit,
    ],
    queryFn: async (): Promise<TransactionListResult> => {
      const from = (page - 1) * limit
      const to = from + limit - 1

      let query = supabase
        .from('transactions')
        .select(
          '*, category:categories(*), payment_method:payment_methods(*)',
          { count: 'exact' },
        )
        .eq('user_id', user!.id)
        .gte('date', `${params.month}-01`)
        .lte('date', `${params.month}-31`)
        .is('deleted_at', null)

      if (params.type) query = query.eq('type', params.type)
      if (params.category_id)
        query = query.eq('category_id', params.category_id)
      if (params.payment_method_id)
        query = query.eq('payment_method_id', params.payment_method_id)
      if (params.keyword) {
        query = query.or(
          `memo.ilike.%${params.keyword}%,sub_category.ilike.%${params.keyword}%`,
        )
      }

      const { data, error, count } = await query
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      const total = count ?? 0
      return {
        transactions: (data ?? []) as TransactionRow[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      }
    },
    enabled: !!user && !!params.month,
  })
}

export function useCreateTransaction() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (input: TransactionCreateRequest) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert({ ...input, user_id: user!.id })
        .select(
          '*, category:categories(*), payment_method:payment_methods(*)',
        )
        .single()
      if (error) throw error
      return data as TransactionRow
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: TransactionUpdateRequest & { id: number }) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select(
          '*, category:categories(*), payment_method:payment_methods(*)',
        )
        .single()
      if (error) throw error
      return data as TransactionRow
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}

export function useRestoreTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await supabase
        .from('transactions')
        .update({ deleted_at: null })
        .eq('id', id)
        .select(
          '*, category:categories(*), payment_method:payment_methods(*)',
        )
        .single()
      if (error) throw error
      return data as TransactionRow
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
    },
  })
}
