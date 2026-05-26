// 총지출·일일가능금액 요약 카드 — 지출 대시보드 전용
import { formatWon } from '@/shared/hooks/useCurrency'

interface ExpenseSummaryCardsProps {
  totalExpense: number
  dailyAllowance: number
}

export function ExpenseSummaryCards({
  totalExpense,
  dailyAllowance,
}: ExpenseSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">이번 달 총지출</p>
        <p className="text-xl font-bold text-red-400">
          {formatWon(totalExpense)}
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-xs text-gray-400 mb-1">오늘까지 써도 되는 금액</p>
        <p className="text-xl font-bold text-blue-400">
          {formatWon(dailyAllowance)}
        </p>
      </div>
    </div>
  )
}
