// 거래 내역 지출 요약 — 총 지출 + 결제수단별 합계
import { useMemo } from 'react'
import type { Transaction, PaymentMethod } from '@/shared/types'
import { formatWon } from '@/shared/hooks/useCurrency'

interface TransactionSummaryProps {
  transactions: Transaction[]
  paymentMethods: PaymentMethod[]
}

export function TransactionSummary({ transactions, paymentMethods }: TransactionSummaryProps) {
  const { totalExpense, breakdown } = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense')
    const total = expenses.reduce((s, t) => s + t.amount, 0)

    const pmMap = new Map(paymentMethods.map((pm) => [pm.id, pm]))

    const byMethod = new Map<string, { label: string; color: string; total: number }>()
    for (const t of expenses) {
      const pm = pmMap.get(t.payment_method_id ?? 0)
      const key = pm ? String(pm.id) : 'unassigned'
      const label = pm?.name ?? '미지정'
      const color = pm?.color ?? '#6B7280'

      const existing = byMethod.get(key)
      if (existing) {
        existing.total += t.amount
      } else {
        byMethod.set(key, { label, color, total: t.amount })
      }
    }

    const breakdown = Array.from(byMethod.values()).sort((a, b) => b.total - a.total)
    return { totalExpense: total, breakdown }
  }, [transactions, paymentMethods])

  if (totalExpense === 0) return null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">총 지출</span>
        <span className="text-lg font-bold text-red-400 tabular-nums">
          -{formatWon(totalExpense)}
        </span>
      </div>

      {breakdown.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {breakdown.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className="inline-block w-2 h-2 rounded-sm shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-gray-400">{item.label}</span>
              <span className="text-xs font-medium text-gray-300 tabular-nums">
                {formatWon(item.total)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
