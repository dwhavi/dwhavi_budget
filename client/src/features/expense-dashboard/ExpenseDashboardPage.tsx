// 지출 대시보드 페이지 — 월별 지출 현황 종합 뷰
import { useState, useMemo } from 'react'
import { useMonthNavigation } from '@/shared/hooks/useMonthNavigation'
import { useExpenseSummary } from '@/shared/hooks/useStats'
import { useBudgets } from '@/shared/hooks/useBudgets'
import { useTransactions, useCreateTransaction } from '@/shared/hooks/useTransactions'
import { useCategories } from '@/shared/hooks/useCategories'
import { usePaymentMethods } from '@/shared/hooks/usePaymentMethods'
import { SkeletonCard } from '@/shared/components/Skeleton'
import { ExpenseSummaryCards } from './ExpenseSummaryCards'
import { CategoryDonutChart } from './CategoryDonutChart'
import { DailyTrendChart } from './DailyTrendChart'
import { PaymentMethodBreakdown } from './PaymentMethodBreakdown'
import { BudgetProgressList } from './BudgetProgressList'
import { CalendarSection } from './CalendarSection'
import { DayDetailPanel } from './DayDetailPanel'
import { RecentExpenses } from './RecentExpenses'
import { useCreditCardBilling } from '@/shared/hooks/useCreditCardBilling'
import { TransactionForm } from '@/features/transactions/TransactionForm'
import type { TransactionCreateRequest } from '@/shared/types'

export function ExpenseDashboardPage() {
  const { selectedMonth, goToPrevMonth, goToNextMonth } = useMonthNavigation()

  const summaryQuery = useExpenseSummary(selectedMonth)
  const budgetsQuery = useBudgets(selectedMonth)
  const creditCardBillingQuery = useCreditCardBilling(selectedMonth)
  const transactionsQuery = useTransactions({
    month: selectedMonth,
    type: 'expense',
    limit: 100,
  })

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const { data: allCategories } = useCategories()
  const { data: allPaymentMethods } = usePaymentMethods()
  const createTransaction = useCreateTransaction()

  const dayTransactions = useMemo(() => {
    if (!selectedDate || !transactionsQuery.data?.transactions) return []
    return transactionsQuery.data.transactions.filter(
      (t) => t.date === selectedDate,
    )
  }, [selectedDate, transactionsQuery.data?.transactions])

  const isLoading =
    summaryQuery.isLoading ||
    budgetsQuery.isLoading ||
    transactionsQuery.isLoading

  const creditCardBillings = creditCardBillingQuery.data ?? []

  const monthLabel = useMemo(() => {
    const parts = selectedMonth.split('-').map(Number)
    return `${parts[0]}년 ${parts[1]}월`
  }, [selectedMonth])

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-40 bg-gray-800 rounded" />
          <div className="h-10 w-28 bg-gray-800 rounded-lg" />
        </div>
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-48" />
      </div>
    )
  }

  const summary = summaryQuery.data
  const budgets = budgetsQuery.data ?? []
  const transactions = transactionsQuery.data?.transactions ?? []

  return (
    <div className="space-y-4 p-4 pb-24 lg:grid lg:grid-cols-2 lg:gap-6 lg:pb-8">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition min-w-[44px] min-h-[44px]"
            aria-label="이전 달"
          >
            ◀
          </button>
          <h1 className="text-lg font-bold text-gray-100 min-w-[100px] text-center">
            {monthLabel}
          </h1>
          <button
            onClick={goToNextMonth}
            className="flex items-center justify-center w-10 h-10 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition min-w-[44px] min-h-[44px]"
            aria-label="다음 달"
          >
            ▶
          </button>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition min-h-[44px]"
          aria-label="지출 등록"
        >
          + 지출 등록
        </button>
      </header>

      {summary ? (
        <>
          <ExpenseSummaryCards
             totalExpense={summary.totalExpense}
             dailyAllowance={summary.dailyAllowance}
             paymentMethodBreakdown={summary.paymentMethodBreakdown}
             creditCardBillings={creditCardBillings}
           />

           <CategoryDonutChart
            categoryBreakdown={summary.categoryBreakdown}
          />

          <DailyTrendChart dailyBreakdown={summary.dailyBreakdown} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PaymentMethodBreakdown
              paymentMethodBreakdown={summary.paymentMethodBreakdown}
            />
            <BudgetProgressList
              budgets={budgets}
              transactions={transactions}
            />
          </div>

          <CalendarSection
            month={selectedMonth}
            transactions={transactions}
            onDateClick={setSelectedDate}
          />

          <RecentExpenses transactions={transactions} />
        </>
      ) : (
        <div className="text-center text-gray-400 py-16">
          지출 데이터를 불러올 수 없습니다.
        </div>
      )}

      {selectedDate && (
        <DayDetailPanel
          isOpen={!!selectedDate}
          onClose={() => setSelectedDate(null)}
          date={selectedDate}
          transactions={dayTransactions}
        />
      )}

      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        categories={allCategories ?? []}
        paymentMethods={allPaymentMethods ?? []}
        onSubmit={async (data: TransactionCreateRequest) => {
          await createTransaction.mutateAsync(data)
          setIsFormOpen(false)
        }}
      />
    </div>
  )
}
