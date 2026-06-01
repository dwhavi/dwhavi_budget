// 거래 CRUD + 필터/페이징 훅 — DataContext 기반 인메모리 처리
import { useMemo } from 'react'
import { useData } from '@/shared/contexts/DataContext'
import type { Transaction, PaymentMethod } from '@/shared/types'

interface TransactionFilters {
  month: string
  type?: 'income' | 'expense'
  category_id?: string
  payment_method_id?: string
  keyword?: string
  page?: number
  limit?: number
}

interface TransactionRow extends Transaction {
  payment_method?: PaymentMethod
}

function getMonthEnd(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return `${month}-${String(new Date(y!, m!, 0).getDate()).padStart(2, '0')}`
}

export function useTransactions(params: TransactionFilters) {
  const { data } = useData()

  const result = useMemo(() => {
    if (!data) return { data: null, isLoading: true }

    const page = params.page ?? 1
    const limit = params.limit ?? 20
    const monthEnd = getMonthEnd(params.month)

    const filtered = data.transactions.filter((t) => {
      if (t.date < `${params.month}-01` || t.date > monthEnd) return false
      if (t.deleted_at) return false
      if (params.type && t.type !== params.type) return false
      if (params.category_id && t.category_id !== params.category_id) return false
      if (params.payment_method_id && t.payment_method_id !== params.payment_method_id) return false
      if (params.keyword) {
        const kw = params.keyword.toLowerCase()
        if (!t.memo?.toLowerCase().includes(kw) && !t.sub_category?.toLowerCase().includes(kw)) return false
      }
      return true
    })

    const categoryMap = new Map(data.categories.map((c) => [c.id, c]))
    const pmMap = new Map(data.paymentMethods.map((p) => [p.id, p]))

    const enriched = filtered
      .map((t) => {
        const cat = categoryMap.get(t.category_id)
        const pm = t.payment_method_id ? pmMap.get(t.payment_method_id) : undefined
        return {
          ...t,
          category: cat,
          category_name: cat?.name,
          category_color: cat?.color,
          payment_method: pm,
          payment_method_name: pm?.name,
          payment_method_color: pm?.color,
        } as TransactionRow
      })
      .sort((a, b) => b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at))

    const total = enriched.length
    const totalPages = Math.ceil(total / limit)
    const start = (page - 1) * limit
    const paged = enriched.slice(start, start + limit)

    return {
      data: {
        transactions: paged,
        pagination: { page, limit, total, totalPages },
      },
      isLoading: false,
    }
  }, [data, params.month, params.type, params.category_id, params.payment_method_id, params.keyword, params.page, params.limit])

  return result
}

export function useCreateTransaction() {
  const { addTransaction } = useData()
  return {
    mutateAsync: (input: {
      type: 'income' | 'expense' | 'transfer'
      amount: number
      category_id: string
      payment_method_id?: string
      date: string
      sub_category?: string
      memo?: string
    }) => addTransaction(input),
  }
}

export function useUpdateTransaction() {
  const { updateTransaction } = useData()
  return {
    mutateAsync: (input: { id: string } & Partial<Transaction>) => updateTransaction(input.id, input),
  }
}

export function useDeleteTransaction() {
  const { deleteTransaction } = useData()
  return {
    mutateAsync: (id: string) => deleteTransaction(id),
  }
}

export function useRestoreTransaction() {
  const { updateTransaction } = useData()
  return {
    mutateAsync: (id: string) => updateTransaction(id, { deleted_at: undefined as unknown as string }),
  }
}
