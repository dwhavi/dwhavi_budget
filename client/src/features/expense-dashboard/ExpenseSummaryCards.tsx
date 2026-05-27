// 총지출·일일가능금액 요약 카드 — 지출 대시보드 전용
import type { PaymentMethodStat, CreditCardBilling } from '@/shared/types'
import { formatWon } from '@/shared/hooks/useCurrency'

interface ExpenseSummaryCardsProps {
  totalExpense: number
  dailyAllowance: number
  paymentMethodBreakdown: PaymentMethodStat[]
  creditCardBillings: CreditCardBilling[]
}

export function ExpenseSummaryCards({
  totalExpense,
  dailyAllowance,
  paymentMethodBreakdown,
  creditCardBillings,
}: ExpenseSummaryCardsProps) {
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

      {paymentMethodBreakdown.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-400">결제수단별 지출</p>
            {totalCardPayment > 0 && (
              <p className="text-xs text-orange-400 tabular-nums">
                다음 결제 {formatWon(totalCardPayment)}
              </p>
            )}
          </div>
          <ul className="space-y-2">
            {paymentMethodBreakdown.map((pm) => (
              <li key={pm.payment_method_id} className="flex items-center justify-between">
                <span className="text-sm text-gray-300">{pm.payment_method_name}</span>
                <span className="text-sm font-medium text-gray-100 tabular-nums">
                  {formatWon(pm.total)}
                  <span className="text-xs text-gray-500 ml-1">({pm.percentage}%)</span>
                </span>
              </li>
            ))}
          </ul>
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
