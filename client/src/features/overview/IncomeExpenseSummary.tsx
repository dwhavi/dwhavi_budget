// 수입/지출/잔액 요약 카드 — 전월 대비 변화율 표시
import type { PaymentMethodStat, CreditCardBilling } from '@/shared/types'
import { formatWon } from '@/shared/hooks/useCurrency'

interface IncomeExpenseSummaryProps {
  totalIncome: number
  totalExpense: number
  balance: number
  prevMonthIncome: number
  prevMonthExpense: number
  incomeChange: number
  expenseChange: number
  paymentMethodBreakdown: PaymentMethodStat[]
  creditCardBillings: CreditCardBilling[]
}

function ChangeIndicator({
  value,
  prevValue,
  label,
}: {
  value: number
  prevValue: number
  label: string
}) {
  if (prevValue === 0) return null

  const percent = Math.abs(
    Math.round((value / prevValue - 1) * 100),
  )
  const isUp = value > prevValue
  const isDown = value < prevValue

  // 수입은 증가가 좋고, 지출은 감소가 좋음 (라벨에 따라)
  const isPositive =
    label === '수입' ? isUp : isDown
  const color = isPositive ? 'text-green-400' : 'text-red-400'
  const arrow = isUp ? '▲' : isDown ? '▼' : ''

  if (!isUp && !isDown) return null

  return (
    <span className={`text-xs ${color} flex items-center gap-1`}>
      <span>{arrow}</span>
      <span>{percent}%</span>
    </span>
  )
}

export function IncomeExpenseSummary({
  totalIncome,
  totalExpense,
  balance,
  prevMonthIncome,
  prevMonthExpense,
  paymentMethodBreakdown,
  creditCardBillings,
}: IncomeExpenseSummaryProps) {
  const totalCardPayment = creditCardBillings.reduce((s, b) => s + b.totalSpent, 0)
  const cards = [
    {
      label: '수입',
      amount: totalIncome,
      prev: prevMonthIncome,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20',
      icon: '📈',
    },
    {
      label: '지출',
      amount: totalExpense,
      prev: prevMonthExpense,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/20',
      icon: '📉',
    },
    {
      label: '잔액',
      amount: balance,
      prev: 0,
      color: balance >= 0 ? 'text-green-400' : 'text-red-400',
      bgColor: balance >= 0 ? 'bg-green-400/10' : 'bg-red-400/10',
      borderColor: balance >= 0 ? 'border-green-400/20' : 'border-red-400/20',
      icon: '💎',
    },
  ] as const

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`relative overflow-hidden rounded-xl border ${card.borderColor} bg-gray-900 p-4`}
          >
            <div className={`absolute top-0 right-0 w-20 h-20 ${card.bgColor} rounded-bl-[40px] opacity-60`} />
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg" aria-hidden="true">{card.icon}</span>
                  <span className="text-gray-400 text-sm font-medium">{card.label}</span>
                </div>
                <ChangeIndicator
                  value={card.amount}
                  prevValue={card.prev}
                  label={card.label}
                />
              </div>
              <p className={`text-xl font-bold ${card.color} tracking-tight`}>
                {card.label === '잔액' && card.amount >= 0 ? '+' : ''}
                {formatWon(card.amount)}
              </p>
            </div>
          </div>
        ))}
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
