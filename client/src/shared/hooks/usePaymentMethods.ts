// 결제수단 CRUD 훅 — DataContext 기반 인메모리 처리
import { useMemo } from 'react'
import { useData } from '@/shared/contexts/DataContext'
import type { PaymentMethod } from '@/shared/types'

export function usePaymentMethods() {
  const { data, addPaymentMethod, updatePaymentMethod, deletePaymentMethod } = useData()

  const paymentMethods = useMemo(() => {
    if (!data) return []
    return data.paymentMethods.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0))
  }, [data])

  return {
    data: paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
  }
}

export function useCreatePaymentMethod() {
  const { addPaymentMethod } = useData()
  return {
    mutateAsync: (input: Omit<PaymentMethod, 'id'>) => addPaymentMethod(input),
  }
}

export function useUpdatePaymentMethod() {
  const { updatePaymentMethod } = useData()
  return {
    mutateAsync: (input: { id: string } & Partial<PaymentMethod>) => updatePaymentMethod(input.id, input),
  }
}

export function useDeletePaymentMethod() {
  const { deletePaymentMethod } = useData()
  return {
    mutateAsync: (id: string) => deletePaymentMethod(id),
  }
}
