// 예산 CRUD 훅 — DataContext 기반 인메모리 처리
import { useMemo } from 'react'
import { useData } from '@/shared/contexts/DataContext'
import { v4 as uuidv4 } from 'uuid'
import type { BudgetUpsertRequest } from '@/shared/types'

export function useBudgets(month: string) {
  const { data, upsertBudget } = useData()

  const list = useMemo(() => {
    if (!data) return []
    const categoryMap = new Map(data.categories.map((c) => [c.id, c]))
    return data.budgets
      .filter((b) => b.month === month)
      .map((b) => ({ ...b, category: categoryMap.get(b.category_id) }))
  }, [data, month])

  const doUpsert = (input: BudgetUpsertRequest) => {
    const existing = data?.budgets.find(
      (b) => b.category_id === input.category_id && b.month === input.month,
    )
    upsertBudget({
      id: existing?.id ?? uuidv4(),
      ...input,
    })
  }

  return {
    data: list,
    budgets: list,
    upsertBudget: doUpsert,
    isLoading: !data,
  }
}

export function useUpsertBudget() {
  const { data, upsertBudget } = useData()

  return {
    mutateAsync: (input: BudgetUpsertRequest) => {
      const existing = data?.budgets.find(
        (b) => b.category_id === input.category_id && b.month === input.month,
      )
      upsertBudget({
        id: existing?.id ?? uuidv4(),
        ...input,
      })
    },
  }
}
