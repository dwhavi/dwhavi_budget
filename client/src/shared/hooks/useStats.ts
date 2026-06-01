// 대시보드/현황 집계 훅 — DataContext 기반 인메모리 계산
import { useMemo } from 'react'
import { useData } from '@/shared/contexts/DataContext'
import type { Category, CategoryStat, PaymentMethodStat, MonthlyTrend } from '@/shared/types'

interface TransactionRow {
  type: 'income' | 'expense' | 'transfer'
  amount: number
  date: string
  category_id: string
  payment_method_id?: string | null
  category?: Category | null
}

interface DailyBreakdown {
  date: string
  total: number
}

interface ExpenseSummary {
  totalExpense: number
  dailyAllowance: number
  categoryBreakdown: CategoryStat[]
  dailyBreakdown: DailyBreakdown[]
  paymentMethodBreakdown: PaymentMethodStat[]
}

interface OverviewSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  savingsRate: number
  incomeBreakdown: CategoryStat[]
  paymentMethodBreakdown: PaymentMethodStat[]
  prevMonthIncome: number
  prevMonthExpense: number
  incomeChange: number
  expenseChange: number
}

function shiftMonth(month: string, direction: 1 | -1): string {
  const parts = month.split('-').map(Number)
  const d = new Date(parts[0]!, parts[1]! - 1 + direction)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getMonthEnd(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return `${month}-${String(new Date(y!, m!, 0).getDate()).padStart(2, '0')}`
}

function getRemainingDays(month: string): number {
  const [y, m] = month.split('-').map(Number)
  const now = new Date()
  const endOfMonth = new Date(y!, m!, 0)
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  if (currentMonth !== month) return endOfMonth.getDate()
  return Math.max(1, endOfMonth.getDate() - now.getDate() + 1)
}

function getMonthTransactions(data: NonNullable<ReturnType<typeof useData>['data']>, month: string): TransactionRow[] {
  const monthEnd = getMonthEnd(month)
  const categoryMap = new Map(data.categories.map((c) => [c.id, c]))

  return data.transactions
    .filter((t) => {
      if (t.deleted_at) return false
      if (t.date < `${month}-01` || t.date > monthEnd) return false
      return true
    })
    .map((t) => ({ ...t, category: categoryMap.get(t.category_id) ?? null }))
}

function buildCategoryBreakdown(rows: TransactionRow[], total: number): CategoryStat[] {
  const map = new Map<string, { name: string; total: number; color: string }>()
  for (const row of rows) {
    const cat = row.category
    if (!cat) continue
    const prev = map.get(row.category_id) ?? { name: cat.name, total: 0, color: cat.color }
    prev.total += row.amount
    map.set(row.category_id, prev)
  }
  return Array.from(map.entries())
    .map(([id, v]) => ({
      category_id: id,
      category_name: v.name,
      total: v.total,
      percentage: total > 0 ? Math.round((v.total / total) * 1000) / 10 : 0,
      color: v.color,
    }))
    .sort((a, b) => b.total - a.total)
}

function buildPaymentMethodBreakdown(
  rows: TransactionRow[],
  pmMap: Map<string, { name: string }>,
  total: number,
): PaymentMethodStat[] {
  const map = new Map<string, { name: string; total: number }>()
  for (const row of rows) {
    if (!row.payment_method_id) continue
    const pm = pmMap.get(row.payment_method_id)
    if (!pm) continue
    const prev = map.get(row.payment_method_id) ?? { name: pm.name, total: 0 }
    prev.total += row.amount
    map.set(row.payment_method_id, prev)
  }
  return Array.from(map.entries())
    .map(([id, v]) => ({
      payment_method_id: id,
      payment_method_name: v.name,
      total: v.total,
      percentage: total > 0 ? Math.round((v.total / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.total - a.total)
}

export function useExpenseSummary(month: string) {
  const { data, loading } = useData()

  const pmMap = useMemo(
    () => new Map(data?.paymentMethods.map((p) => [p.id, { name: p.name }]) ?? []),
    [data],
  )

  const summary = useMemo((): ExpenseSummary | null => {
    if (!data) return null

    const transactions = getMonthTransactions(data, month)
    const expenses = transactions.filter((t) => t.type === 'expense')
    const incomes = transactions.filter((t) => t.type === 'income')

    const totalExpense = expenses.reduce((s, t) => s + t.amount, 0)
    const totalIncome = incomes.reduce((s, t) => s + t.amount, 0)
    const remaining = totalIncome - totalExpense
    const remainingDays = getRemainingDays(month)

    const dailyMap = new Map<string, number>()
    for (const t of expenses) {
      dailyMap.set(t.date, (dailyMap.get(t.date) ?? 0) + t.amount)
    }
    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalExpense,
      dailyAllowance: remainingDays > 0 ? Math.floor(remaining / remainingDays) : 0,
      categoryBreakdown: buildCategoryBreakdown(expenses, totalExpense),
      dailyBreakdown,
      paymentMethodBreakdown: buildPaymentMethodBreakdown(expenses, pmMap, totalExpense),
    }
  }, [data, month, pmMap])

  return { data: summary, isLoading: loading }
}

export function useOverviewSummary(month: string) {
  const { data, loading } = useData()
  const prevMonth = shiftMonth(month, -1)

  const pmMap = useMemo(
    () => new Map(data?.paymentMethods.map((p) => [p.id, { name: p.name }]) ?? []),
    [data],
  )

  const summary = useMemo((): OverviewSummary | null => {
    if (!data) return null

    const current = getMonthTransactions(data, month)
    const prev = getMonthTransactions(data, prevMonth)

    const totalIncome = current.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpense = current.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const balance = totalIncome - totalExpense
    const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 1000) / 10 : 0

    const incomeBreakdown = buildCategoryBreakdown(
      current.filter((t) => t.type === 'income'),
      totalIncome,
    )
    const paymentMethodBreakdown = buildPaymentMethodBreakdown(
      current.filter((t) => t.type === 'expense'),
      pmMap,
      totalExpense,
    )

    const prevIncome = prev.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const prevExpense = prev.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

    return {
      totalIncome,
      totalExpense,
      balance,
      savingsRate,
      incomeBreakdown,
      paymentMethodBreakdown,
      prevMonthIncome: prevIncome,
      prevMonthExpense: prevExpense,
      incomeChange: prevIncome > 0 ? totalIncome - prevIncome : 0,
      expenseChange: prevExpense > 0 ? totalExpense - prevExpense : 0,
    }
  }, [data, month, prevMonth, pmMap])

  return { data: summary, isLoading: loading }
}

export function useMonthlyTrend(months: number = 6) {
  const { data } = useData()

  const trend = useMemo((): MonthlyTrend[] => {
    if (!data) return []

    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
    const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`
    const endDate = getMonthEnd(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)

    const transactions = data.transactions.filter((t) => {
      if (t.deleted_at) return false
      if (t.date < startDate || t.date > endDate) return false
      return true
    })

    const monthMap = new Map<string, { income: number; expense: number }>()
    for (const t of transactions) {
      const m = t.date.substring(0, 7)
      const current = monthMap.get(m) ?? { income: 0, expense: 0 }
      if (t.type === 'income') current.income += t.amount
      else current.expense += t.amount
      monthMap.set(m, current)
    }

    return Array.from(monthMap.entries())
      .map(([month, { income, expense }]) => ({ month, income, expense }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }, [data, months])

  return { data: trend, isLoading: false }
}
