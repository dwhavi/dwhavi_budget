// 고정비 CRUD + 토글 훅 — DataContext 기반 인메모리 처리
import { useMemo } from 'react'
import { useData } from '@/shared/contexts/DataContext'
import type { RecurringExpense } from '@/shared/types'

export function useRecurringExpenses() {
  const { data, addRecurringExpense, updateRecurringExpense, deleteRecurringExpense, toggleRecurringExpense } = useData()

  const recurringExpenses = useMemo(() => {
    if (!data) return []
    return data.recurringExpenses
      .sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0) || a.start_date.localeCompare(b.start_date))
  }, [data])

  return {
    data: recurringExpenses,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    toggleRecurringExpense,
  }
}

export function useCreateRecurringExpense() {
  const { addRecurringExpense } = useData()
  return {
    mutateAsync: (input: Omit<RecurringExpense, 'id'>) => addRecurringExpense(input),
  }
}

export function useUpdateRecurringExpense() {
  const { updateRecurringExpense } = useData()
  return {
    mutateAsync: (input: { id: string } & Partial<RecurringExpense>) => updateRecurringExpense(input.id, input),
  }
}

export function useDeleteRecurringExpense() {
  const { deleteRecurringExpense } = useData()
  return {
    mutateAsync: (id: string) => deleteRecurringExpense(id),
  }
}

export function useToggleRecurringExpense() {
  const { toggleRecurringExpense } = useData()
  return {
    mutateAsync: (id: string) => toggleRecurringExpense(id),
  }
}

interface RecurringExpenseSummary {
  totalAmount: number
  items: RecurringExpense[]
}

function getMonthEnd(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return `${month}-${String(new Date(y!, m!, 0).getDate()).padStart(2, '0')}`
}

export function useRecurringExpenseMonthlySummary(month: string) {
  const { data } = useData()

  return useMemo((): RecurringExpenseSummary => {
    if (!data) return { totalAmount: 0, items: [] }

    const monthStart = `${month}-01`
    const monthEnd = getMonthEnd(month)

    const items = data.recurringExpenses.filter((r) => {
      if (!r.is_active) return false
      if (r.start_date > monthEnd) return false
      if (r.end_date && r.end_date < monthStart) return false
      return true
    })

    const totalAmount = items.reduce((s, item) => s + item.amount, 0)
    return { totalAmount, items }
  }, [data, month])
}
