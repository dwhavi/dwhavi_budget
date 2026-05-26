// 수입 출처별 수평 막대 — 카테고리별 수입 분포
import type { CategoryStat } from '@/shared/types'
import { formatWon } from '@/shared/hooks/useCurrency'

interface IncomeBreakdownProps {
  incomeBreakdown: CategoryStat[]
}

export function IncomeBreakdown({ incomeBreakdown }: IncomeBreakdownProps) {
  if (incomeBreakdown.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h3 className="text-gray-400 text-sm font-medium mb-4">수입 출처</h3>
        <p className="text-gray-500 text-sm text-center py-6">
          수입 내역이 없습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <h3 className="text-gray-400 text-sm font-medium mb-4">수입 출처</h3>
      <div className="space-y-3">
        {incomeBreakdown.map((item) => (
          <div key={item.category_id} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-gray-200 text-sm">{item.category_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-xs">{item.percentage}%</span>
                <span className="text-gray-200 text-sm font-medium">
                  {formatWon(item.total)}
                </span>
              </div>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
