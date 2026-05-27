// 신용카드 다음 결제 예정액 계산 훅
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { usePaymentMethods } from '@/shared/hooks/usePaymentMethods'
import type { CreditCardBilling } from '@/shared/types'

export function useCreditCardBilling(month: string) {
  const { user } = useAuth()
  const { data: paymentMethods = [] } = usePaymentMethods()

  const creditCards = paymentMethods.filter(
    (pm) => pm.type === 'credit' && pm.billing_start_day && pm.payment_day,
  )

  return useQuery({
    queryKey: ['credit-card-billing', user?.id, month, creditCards.map((c) => c.id)],
    queryFn: async (): Promise<CreditCardBilling[]> => {
      if (!user || creditCards.length === 0) return []

      const results: CreditCardBilling[] = []

      for (const card of creditCards) {
        const billingStart = card.billing_start_day!
        const paymentDay = card.payment_day!

        const year = Number(month.split('-')[0])
        const mon = Number(month.split('-')[1])

        const startDayClamped = Math.min(billingStart, new Date(year, mon, 0).getDate())
        const periodStart = `${year}-${String(mon).padStart(2, '0')}-${String(startDayClamped).padStart(2, '0')}`

        // 취합 종료일: 다음달 (billingStart - 1)일
        // JS Date에서 mon은 1-indexed이므로 new Date(year, mon, N-1)은 다음달 N-1일
        // billingStart=1 → new Date(year, mon, 0) = 당월 말일 (예: 5/31)
        // billingStart=16 → new Date(year, mon, 15) = 다음달 15일 (예: 6/15)
        const periodEndDate = new Date(year, mon, billingStart - 1)
        const periodEnd = `${periodEndDate.getFullYear()}-${String(periodEndDate.getMonth() + 1).padStart(2, '0')}-${String(periodEndDate.getDate()).padStart(2, '0')}`

        // 결제일: 취합 종료일 다음 달
        const payMonth = new Date(periodEndDate.getFullYear(), periodEndDate.getMonth() + 1, 1)
        const payMaxDay = new Date(payMonth.getFullYear(), payMonth.getMonth() + 1, 0).getDate()
        const nextPaymentDate = `${payMonth.getFullYear()}-${String(payMonth.getMonth() + 1).padStart(2, '0')}-${String(Math.min(paymentDay, payMaxDay)).padStart(2, '0')}`

        const { data: txData, error } = await supabase
          .from('transactions')
          .select('amount')
          .eq('user_id', user.id)
          .eq('payment_method_id', card.id)
          .eq('type', 'expense')
          .gte('date', periodStart)
          .lte('date', periodEnd)
          .is('deleted_at', null)

        if (error) continue

        const totalSpent = (txData ?? []).reduce((s, t) => s + t.amount, 0)

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
    },
    enabled: !!user && creditCards.length > 0,
  })
}
