// 신용카드 다음 결제 예정액 위젯
import type { CreditCardBilling } from '@/shared/types'
import { formatWon } from '@/shared/hooks/useCurrency'

interface CreditCardBillingWidgetProps {
  billings: CreditCardBilling[]
}

export function CreditCardBillingWidget({ billings }: CreditCardBillingWidgetProps) {
  if (billings.length === 0) return null

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-100 mb-3">
        다가오는 카드 결제
      </h3>

      <ul className="space-y-3">
        {billings.map((billing) => (
          <li key={billing.paymentMethodId} className="space-y-1">
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
            <div className="text-xs text-gray-500">
              {billing.billingPeriodStart.replace(/-/g, '.')} ~ {billing.billingPeriodEnd.replace(/-/g, '.')}
              {' · '}
              결제일 {billing.nextPaymentDate.replace(/-/g, '.')}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
