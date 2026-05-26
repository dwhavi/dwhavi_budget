// 결제수단 CRUD 훅
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { PaymentMethod } from '@/shared/types'

export function usePaymentMethods() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['payment-methods', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .is('deleted_at', null)
        .eq('user_id', user!.id)
        .order('is_default', { ascending: false })
      if (error) throw error
      return (data ?? []) as PaymentMethod[]
    },
    enabled: !!user,
  })
}

export function useCreatePaymentMethod() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (
      input: Omit<PaymentMethod, 'id' | 'user_id' | 'deleted_at'>,
    ) => {
      const { data, error } = await supabase
        .from('payment_methods')
        .insert({ ...input, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data as PaymentMethod
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-methods'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useUpdatePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Omit<PaymentMethod, 'id' | 'user_id'>> & { id: number }) => {
      const { data, error } = await supabase
        .from('payment_methods')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as PaymentMethod
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-methods'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useDeletePaymentMethod() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { data: target, error: fetchError } = await supabase
        .from('payment_methods')
        .select('name')
        .eq('id', id)
        .single()
      if (fetchError) throw fetchError
      if (target?.name === '현금')
        throw new Error('현금 결제수단은 삭제할 수 없습니다')
      const { error } = await supabase
        .from('payment_methods')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payment-methods'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
