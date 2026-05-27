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

        const [year, mon] = month.split('-').map(Number)
        const periodStart = `${year}-${String(mon).padStart(2, '0')}-${String(billingStart).padStart(2, '0')}`

        // 종료일: 다음달 (billingStart - 1)일. 시작일 기준 한 달
        // 예: 시작일 16 → 5/16 ~ 6/15, 시작일 1 → 5/1 ~ 5/31
        const endYear = mon! === 12 ? year! + 1 : year!
        const endMon = mon! === 12 ? 1 : mon! + 1
        const endDateDay = billingStart <= 1
          ? new Date(year!, mon!, 0).getDate()
          : billingStart - 1
        const periodEnd = `${endYear}-${String(endMon).padStart(2, '0')}-${String(Math.min(endDateDay, new Date(endYear, endMon, 0).getDate())).padStart(2, '0')}`

        const paymentYear = mon! === 12 ? year! + 1 : year!
        const paymentMon = mon! === 12 ? 1 : mon! + 1
        const nextPaymentDate = `${paymentYear}-${String(paymentMon).padStart(2, '0')}-${String(Math.min(paymentDay, new Date(paymentYear, paymentMon, 0).getDate())).padStart(2, '0')}`

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
