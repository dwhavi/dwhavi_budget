// 최근 지출 5건 리스트
import { useNavigate } from 'react-router-dom'
import type { Transaction } from '@/shared/types'
import { formatWon } from '@/shared/hooks/useCurrency'
import { EmptyState } from '@/shared/components/EmptyState'

interface RecentExpensesProps {
  transactions: Transaction[]
}

/** 'YYYY-MM-DD' → 'M/D' 형식 */
function formatShortDate(dateStr: string): string {
  const parts = dateStr.split('-').map(Number)
  return `${parts[1]}/${parts[2]}`
}

export function RecentExpenses({ transactions }: RecentExpensesProps) {
  const navigate = useNavigate()
  const recentFive = transactions
    .filter((t) => t.type === 'expense')
    .slice(0, 5)

  if (recentFive.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <EmptyState
          title="최근 지출이 없습니다"
          description="지출을 기록하면 여기에 표시됩니다."
        />
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-100">최근 지출</h3>
        <button
          onClick={() => navigate('/transactions')}
          className="text-xs text-blue-400 hover:text-blue-300 transition min-h-[44px] flex items-center"
        >
          전체보기 →
        </button>
      </div>

      <ul className="space-y-2">
        {recentFive.map((t) => (
          <li
            key={t.id}
            className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-b-0"
          >
            {/* 카테고리 색상 도트 */}
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: t.category_color ?? '#6B7280' }}
              aria-hidden="true"
            />

            <span className="text-sm text-gray-300 flex-1 truncate">
              {t.category?.name ?? t.category_name ?? '미분류'}
            </span>

            <span className="text-xs text-gray-500 tabular-nums shrink-0">
              {formatShortDate(t.date)}
            </span>

            <span className="text-sm font-medium text-red-400 tabular-nums shrink-0">
              -{formatWon(t.amount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
