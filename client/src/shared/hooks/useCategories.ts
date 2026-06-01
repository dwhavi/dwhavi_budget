// 카테고리 CRUD 훅 — DataContext 기반 인메모리 처리
import { useMemo } from 'react'
import { useData } from '@/shared/contexts/DataContext'
import type { Category } from '@/shared/types'

export function useCategories(type?: 'income' | 'expense') {
  const { data, addCategory, updateCategory, deleteCategory } = useData()

  const categories = useMemo(() => {
    if (!data) return []
    let filtered = data.categories
    if (type) filtered = filtered.filter((c) => c.type === type)
    return filtered.sort((a, b) => a.sort_order - b.sort_order)
  }, [data, type])

  return {
    data: categories,
    addCategory,
    updateCategory,
    deleteCategory,
  }
}

export function useCreateCategory() {
  const { addCategory } = useData()
  return {
    mutateAsync: (input: Omit<Category, 'id'>) => addCategory(input),
  }
}

export function useUpdateCategory() {
  const { updateCategory } = useData()
  return {
    mutateAsync: (input: { id: string } & Partial<Category>) => updateCategory(input.id, input),
  }
}

export function useDeleteCategory() {
  const { deleteCategory } = useData()
  return {
    mutateAsync: (id: string) => deleteCategory(id),
  }
}
