// 전체 현황(프라이버시 구역) 페이지 오케스트레이터
import { useMonthNavigation } from '@/shared/hooks/useMonthNavigation'
import { useOverviewSummary, useMonthlyTrend } from '@/shared/hooks/useStats'
import { useCreditCardBilling } from '@/shared/hooks/useCreditCardBilling'
import { SkeletonCard } from '@/shared/components/Skeleton'
import { IncomeExpenseSummary } from './IncomeExpenseSummary'
import { SavingsRate } from './SavingsRate'
import { MonthlyTrendChart } from './MonthlyTrendChart'
import { IncomeBreakdown } from './IncomeBreakdown'

function formatMonthTitle(month: string): string {
  const parts = month.split('-')
  const year = parts[0]
  const m = Number(parts[1])
  return `${year}년 ${m}월`
}

export function OverviewPage() {
  const { selectedMonth, goToPrevMonth, goToNextMonth } = useMonthNavigation()
  const { data: summary, isLoading } = useOverviewSummary(selectedMonth)
  const { data: trend } = useMonthlyTrend(6)
  const { data: creditCardBillings = [] } = useCreditCardBilling(selectedMonth)

  return (
    <div className="min-h-screen bg-gray-950 pb-8">
      {/* 월 네비게이션 */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between lg:max-w-none">
          <button
            onClick={goToPrevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-lg
                       text-gray-400 hover:text-gray-100 hover:bg-gray-800
                       transition active:scale-95"
            aria-label="이전 달"
          >
            ◀
          </button>
          <h1 className="text-gray-100 font-bold text-lg">
            {formatMonthTitle(selectedMonth)}
          </h1>
          <button
            onClick={goToNextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-lg
                       text-gray-400 hover:text-gray-100 hover:bg-gray-800
                       transition active:scale-95"
            aria-label="다음 달"
          >
            ▶
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-4 lg:max-w-none lg:grid lg:grid-cols-2 lg:gap-6">
        {isLoading ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <SkeletonCard className="h-36" />
            <SkeletonCard className="h-72" />
            <SkeletonCard className="h-48" />
          </>
        ) : summary ? (
          <>
            <IncomeExpenseSummary
              totalIncome={summary.totalIncome}
              totalExpense={summary.totalExpense}
              balance={summary.balance}
              prevMonthIncome={summary.prevMonthIncome}
              prevMonthExpense={summary.prevMonthExpense}
              incomeChange={summary.incomeChange}
              expenseChange={summary.expenseChange}
              paymentMethodBreakdown={summary.paymentMethodBreakdown}
              creditCardBillings={creditCardBillings}
            />
            <SavingsRate savingsRate={summary.savingsRate} />
            <MonthlyTrendChart data={trend ?? []} />
            <IncomeBreakdown incomeBreakdown={summary.incomeBreakdown} />
          </>
        ) : (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
            <p className="text-gray-400">데이터를 불러올 수 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  )
}
