// 신용카드 다음 결제 예정액 계산 훅 — DataContext 기반 인메모리 계산
import { useMemo } from 'react'
import { useData } from '@/shared/contexts/DataContext'
import { usePaymentMethods } from '@/shared/hooks/usePaymentMethods'
import type { CreditCardBilling } from '@/shared/types'

export function useCreditCardBilling(month: string) {
  const { data } = useData()
  const { data: paymentMethods } = usePaymentMethods()

  const creditCards = useMemo(
    () => paymentMethods.filter((pm: any) => pm.type === 'credit' && pm.billing_start_day && pm.payment_day),
    [paymentMethods],
  )

  const billingResults = useMemo((): CreditCardBilling[] => {
    if (!data || creditCards.length === 0) return []

    const results: CreditCardBilling[] = []

    for (const card of creditCards) {
      const billingStart = card.billing_start_day!
      const paymentDay = card.payment_day!

      const year = Number(month.split('-')[0])
      const mon = Number(month.split('-')[1])

      const startDayClamped = Math.min(billingStart, new Date(year, mon, 0).getDate())
      const periodStart = `${year}-${String(mon).padStart(2, '0')}-${String(startDayClamped).padStart(2, '0')}`

      const periodEndDate = new Date(year, mon, billingStart - 1)
      const periodEnd = `${periodEndDate.getFullYear()}-${String(periodEndDate.getMonth() + 1).padStart(2, '0')}-${String(periodEndDate.getDate()).padStart(2, '0')}`

      const payMonth = new Date(periodEndDate.getFullYear(), periodEndDate.getMonth() + 1, 1)
      const payMaxDay = new Date(payMonth.getFullYear(), payMonth.getMonth() + 1, 0).getDate()
      const nextPaymentDate = `${payMonth.getFullYear()}-${String(payMonth.getMonth() + 1).padStart(2, '0')}-${String(Math.min(paymentDay, payMaxDay)).padStart(2, '0')}`

      const totalSpent = data.transactions
        .filter((t) => {
          if (t.deleted_at) return false
          if (t.payment_method_id !== card.id) return false
          if (t.type !== 'expense') return false
          if (t.date < periodStart || t.date > periodEnd) return false
          return true
        })
        .reduce((s, t) => s + t.amount, 0)

      results.push({
        paymentMethodId: card.id,
        paymentMethodName: card.name,
        paymentMethodColor: card.color ?? '#6B7280',
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        totalSpent,
        nextPaymentDate,
      })
    }

    return results
  }, [data, month, creditCards])

  return { data: billingResults, isLoading: false }
}
