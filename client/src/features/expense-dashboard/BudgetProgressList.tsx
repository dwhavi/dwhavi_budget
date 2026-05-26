// 예산 진행 바 리스트 — 카테고리별 예산 대비 사용액
import { useMemo } from 'react'
import type { Budget, Transaction } from '@/shared/types'
import { formatWon } from '@/shared/hooks/useCurrency'

interface BudgetProgressListProps {
  budgets: Budget[]
  transactions: Transaction[]
}

interface BudgetItem {
  id: number
  categoryName: string
  categoryColor: string
  spent: number
  budgetAmount: number
  percentage: number
  isOver: boolean
}

function getBarColor(pct: number): string {
  if (pct >= 90) return 'bg-red-500'
  if (pct >= 70) return 'bg-yellow-400'
  return 'bg-blue-600'
}

function getStatusColor(pct: number): string {
  if (pct >= 90) return 'text-red-400'
  if (pct >= 70) return 'text-yellow-400'
  return 'text-gray-400'
}

export function BudgetProgressList({
  budgets,
  transactions,
}: BudgetProgressListProps) {
  const items = useMemo<BudgetItem[]>(() => {
    if (budgets.length === 0) return []

    // 카테고리별 지출 합계
    const spentMap = new Map<number, number>()
    for (const t of transactions) {
      if (t.type !== 'expense') continue
      spentMap.set(t.category_id, (spentMap.get(t.category_id) ?? 0) + t.amount)
    }

    return budgets.map((b) => {
      const spent = spentMap.get(b.category_id) ?? 0
      const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0
      return {
        id: b.id,
        categoryName: b.category?.name ?? '미분류',
        categoryColor: b.category?.color ?? '#6B7280',
        spent,
        budgetAmount: b.amount,
        percentage: pct,
        isOver: spent > b.amount,
      }
    })
  }, [budgets, transactions])

  if (items.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center text-gray-400 text-sm py-8">
        설정된 예산이 없습니다.
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-100 mb-3">예산 진행</h3>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: item.categoryColor }}
                />
                <span className="text-sm text-gray-300 truncate">
                  {item.categoryName}
                </span>
              </div>
              <span className={`text-xs tabular-nums shrink-0 ml-2 ${getStatusColor(item.percentage)}`}>
                {item.isOver ? '초과' : `${item.percentage}%`}
              </span>
            </div>

            {/* 진행 바 */}
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(item.percentage)}`}
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              />
            </div>

            <div className="flex justify-between text-xs text-gray-500 tabular-nums">
              <span>{formatWon(item.spent)}</span>
              <span>/ {formatWon(item.budgetAmount)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
