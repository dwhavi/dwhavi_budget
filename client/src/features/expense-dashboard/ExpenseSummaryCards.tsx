// 총지출·일일가능금액 요약 카드 — 지출 대시보드 전용
import { useMemo } from 'react'
import type { Transaction, PaymentMethod, CreditCardBilling } from '@/shared/types'
import { formatWon } from '@/shared/hooks/useCurrency'

interface ExpenseSummaryCardsProps {
  totalExpense: number
  dailyAllowance: number
  transactions: Transaction[]
  paymentMethods: PaymentMethod[]
  creditCardBillings: CreditCardBilling[]
}

export function ExpenseSummaryCards({
  totalExpense,
  dailyAllowance,
  transactions,
  paymentMethods,
  creditCardBillings,
}: ExpenseSummaryCardsProps) {
  const breakdown = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense')
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

    return Array.from(byMethod.values()).sort((a, b) => b.total - a.total)
  }, [transactions, paymentMethods])

  const totalCardPayment = creditCardBillings.reduce((s, b) => s + b.totalSpent, 0)

  return (
    <div className="space-y-3">
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

      {breakdown.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">결제수단별 지출</p>
            {totalCardPayment > 0 && (
              <p className="text-xs text-orange-400 tabular-nums">
                다음 결제 {formatWon(totalCardPayment)}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {breakdown.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-sm shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-gray-300">{item.label}</span>
                <span className="text-sm font-medium text-gray-100 tabular-nums">
                  {formatWon(item.total)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {creditCardBillings.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-2">다가오는 카드 결제</p>
          <ul className="space-y-2">
            {creditCardBillings.map((billing) => (
              <li key={billing.paymentMethodId}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: billing.paymentMethodColor }}
                    />
                    <span className="text-sm text-gray-300 truncate">
                      {billing.paymentMethodName}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-orange-400 tabular-nums shrink-0 ml-2">
                    {formatWon(billing.totalSpent)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5 pl-[18px]">
                  {billing.billingPeriodStart.replace(/-/g, '.')} ~ {billing.billingPeriodEnd.replace(/-/g, '.')}
                  {' · '}
                  결제일 {billing.nextPaymentDate.replace(/-/g, '.')}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
