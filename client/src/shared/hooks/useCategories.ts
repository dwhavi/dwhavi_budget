// 카테고리 CRUD 훅
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Category } from '@/shared/types'

export function useCategories(type?: 'income' | 'expense') {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['categories', user?.id, type],
    queryFn: async () => {
      let query = supabase
        .from('categories')
        .select('*')
        .is('deleted_at', null)
        .eq('user_id', user!.id)
        .order('sort_order', { ascending: true })
      if (type) query = query.eq('type', type)
      const { data, error } = await query
      if (error) throw error
      return (data ?? []) as Category[]
    },
    enabled: !!user,
  })
}

export function useCreateCategory() {
  const qc = useQueryClient()
  const { user } = useAuth()
  return useMutation({
    mutationFn: async (
      input: Omit<Category, 'id' | 'user_id' | 'deleted_at'>,
    ) => {
      const { data, error } = await supabase
        .from('categories')
        .insert({ ...input, user_id: user!.id })
        .select()
        .single()
      if (error) throw error
      return data as Category
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useUpdateCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Omit<Category, 'id' | 'user_id'>> & { id: number }) => {
      const { data, error } = await supabase
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Category
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('categories')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      qc.invalidateQueries({ queryKey: ['stats'] })
      qc.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
