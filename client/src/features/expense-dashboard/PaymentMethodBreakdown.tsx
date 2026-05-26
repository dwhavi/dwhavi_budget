// 결제수단별 지출 수평 막대 — CSS만으로 구현
import type { PaymentMethodStat } from '@/shared/types'
import { formatWon } from '@/shared/hooks/useCurrency'

interface PaymentMethodBreakdownProps {
  paymentMethodBreakdown: PaymentMethodStat[]
}

export function PaymentMethodBreakdown({
  paymentMethodBreakdown,
}: PaymentMethodBreakdownProps) {
  if (paymentMethodBreakdown.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center text-gray-400 text-sm py-8">
        결제수단별 데이터가 없습니다.
      </div>
    )
  }

  const maxTotal = Math.max(
    ...paymentMethodBreakdown.map((pm) => pm.total),
    1,
  )

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-100 mb-3">
        결제수단별 지출
      </h3>

      <ul className="space-y-3">
        {paymentMethodBreakdown.map((pm) => {
          const widthPct = Math.round((pm.total / maxTotal) * 100)
          return (
            <li key={pm.payment_method_id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-300 truncate">
                  {pm.payment_method_name}
                </span>
                <span className="text-sm text-gray-400 tabular-nums ml-2">
                  {formatWon(pm.total)}
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-500"
                  style={{ width: `${widthPct}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 tabular-nums">
                {pm.percentage}%
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
