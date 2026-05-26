// 대시보드/현황 집계 훅
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type {
  Category,
  PaymentMethod,
  CategoryStat,
  PaymentMethodStat,
  MonthlyTrend,
} from '@/shared/types'

interface TransactionRow {
  type: 'income' | 'expense'
  amount: number
  date: string
  category_id: number
  payment_method_id?: number | null
  category?: Category | null
  payment_method?: PaymentMethod | null
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
  prevMonthIncome: number
  prevMonthExpense: number
  incomeChange: number
  expenseChange: number
}

function shiftMonth(month: string, direction: 1 | -1): string {
  const parts = month.split('-').map(Number)
  const year = parts[0]!
  const m = parts[1]!
  const d = new Date(year, m - 1 + direction)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function getRemainingDays(month: string): number {
  const parts = month.split('-').map(Number)
  const year = parts[0]!
  const m = parts[1]!
  const now = new Date()
  const endOfMonth = new Date(year, m, 0)
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  if (currentMonth !== month) return endOfMonth.getDate()
  return Math.max(1, endOfMonth.getDate() - now.getDate() + 1)
}

async function fetchMonthTransactions(
  userId: string,
  month: string,
): Promise<TransactionRow[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, category:categories(*), payment_method:payment_methods(*)')
    .eq('user_id', userId)
    .gte('date', `${month}-01`)
    .lte('date', `${month}-31`)
    .is('deleted_at', null)
  if (error) throw error
  return (data ?? []) as TransactionRow[]
}

function buildCategoryBreakdown(
  rows: TransactionRow[],
  total: number,
): CategoryStat[] {
  const map = new Map<number, { name: string; total: number; color: string }>()
  for (const row of rows) {
    const cat = row.category
    if (!cat) continue
    const prev = map.get(row.category_id) ?? {
      name: cat.name,
      total: 0,
      color: cat.color,
    }
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
  total: number,
): PaymentMethodStat[] {
  const map = new Map<number, { name: string; total: number }>()
  for (const row of rows) {
    if (!row.payment_method_id) continue
    const pm = row.payment_method
    if (!pm) continue
    const prev = map.get(row.payment_method_id) ?? {
      name: pm.name,
      total: 0,
    }
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
  const { user } = useAuth()

  const { data: transactions, ...queryResult } = useQuery({
    queryKey: ['stats', 'expense-summary', user?.id, month],
    queryFn: () => fetchMonthTransactions(user!.id, month),
    enabled: !!user,
  })

  const summary = useMemo<ExpenseSummary | null>(() => {
    if (!transactions) return null

    const expenses = transactions.filter((t) => t.type === 'expense')
    const incomes = transactions.filter((t) => t.type === 'income')

    const totalExpense = expenses.reduce((s, t) => s + t.amount, 0)
    const totalIncome = incomes.reduce((s, t) => s + t.amount, 0)
    const remaining = totalIncome - totalExpense
    const remainingDays = getRemainingDays(month)

    const dailyMap = new Map<string, number>()
    for (const t of expenses) {
      const day = t.date
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + t.amount)
    }
    const dailyBreakdown = Array.from(dailyMap.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      totalExpense,
      dailyAllowance:
        remainingDays > 0 ? Math.floor(remaining / remainingDays) : 0,
      categoryBreakdown: buildCategoryBreakdown(expenses, totalExpense),
      dailyBreakdown,
      paymentMethodBreakdown: buildPaymentMethodBreakdown(
        expenses,
        totalExpense,
      ),
    }
  }, [transactions, month])

  return { ...queryResult, data: summary }
}

export function useOverviewSummary(month: string) {
  const { user } = useAuth()
  const prevMonth = shiftMonth(month, -1)

  const { data: current, ...currentResult } = useQuery({
    queryKey: ['stats', 'overview', user?.id, month],
    queryFn: () => fetchMonthTransactions(user!.id, month),
    enabled: !!user,
  })

  const { data: prev, ...prevResult } = useQuery({
    queryKey: ['stats', 'overview', user?.id, prevMonth],
    queryFn: () => fetchMonthTransactions(user!.id, prevMonth),
    enabled: !!user,
  })

  const summary = useMemo<OverviewSummary | null>(() => {
    if (!current) return null

    const totalIncome = current
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0)
    const totalExpense = current
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)
    const balance = totalIncome - totalExpense
    const savingsRate =
      totalIncome > 0
        ? Math.round((balance / totalIncome) * 1000) / 10
        : 0

    const incomeTransactions = current.filter((t) => t.type === 'income')
    const incomeBreakdown = buildCategoryBreakdown(
      incomeTransactions,
      totalIncome,
    )

    const prevIncome = (prev ?? [])
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0)
    const prevExpense = (prev ?? [])
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0)

    return {
      totalIncome,
      totalExpense,
      balance,
      savingsRate,
      incomeBreakdown,
      prevMonthIncome: prevIncome,
      prevMonthExpense: prevExpense,
      incomeChange: prevIncome > 0 ? totalIncome - prevIncome : 0,
      expenseChange: prevExpense > 0 ? totalExpense - prevExpense : 0,
    }
  }, [current, prev])

  const isLoading = currentResult.isLoading || prevResult.isLoading
  const isError = currentResult.isError || prevResult.isError
  const error = currentResult.error ?? prevResult.error

  return {
    data: summary,
    isLoading,
    isError,
    error,
    isFetching: currentResult.isFetching || prevResult.isFetching,
  }
}

export function useMonthlyTrend(months: number = 6) {
  const { user } = useAuth()

  const { data: transactions, ...queryResult } = useQuery({
    queryKey: ['stats', 'monthly-trend', user?.id, months],
    queryFn: async () => {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
      const startDate = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-01`
      const endYear = now.getFullYear()
      const endMonth = now.getMonth() + 1
      const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-31`

      const { data, error } = await supabase
        .from('transactions')
        .select('type, amount, date')
        .eq('user_id', user!.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .is('deleted_at', null)
      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })

  const trend = useMemo<MonthlyTrend[]>(() => {
    if (!transactions) return []

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
  }, [transactions])

  return { ...queryResult, data: trend }
}
