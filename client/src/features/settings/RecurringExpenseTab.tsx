// 고정비 관리 탭 — ID 대신 이름으로 카테고리/결제수단 표시
import { useState } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { useCategories } from '@/shared/hooks/useCategories'
import { usePaymentMethods } from '@/shared/hooks/usePaymentMethods'
import {
  useRecurringExpenses,
  useCreateRecurringExpense,
  useUpdateRecurringExpense,
  useDeleteRecurringExpense,
  useToggleRecurringExpense,
} from '@/shared/hooks/useRecurringExpenses'
import { Modal } from '@/shared/components/Modal'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { EmptyState } from '@/shared/components/EmptyState'
import { SkeletonList } from '@/shared/components/Skeleton'
import { RecurringExpenseForm } from './forms/RecurringExpenseForm'
import { formatWon } from '@/shared/hooks/useCurrency'
import type {
  RecurringExpense,
  RecurringExpenseCreateRequest,
  RecurringExpenseUpdateRequest,
} from '@/shared/types'

export function RecurringExpenseTab() {
  const { addToast } = useToast()
  const { data: categories = [] } = useCategories()
  const { data: paymentMethods = [] } = usePaymentMethods()
  const { data: expenses = [], isLoading } = useRecurringExpenses()
  const createMutation = useCreateRecurringExpense()
  const updateMutation = useUpdateRecurringExpense()
  const deleteMutation = useDeleteRecurringExpense()
  const toggleMutation = useToggleRecurringExpense()

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<RecurringExpense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const categoryMap = new Map(categories.map((c) => [c.id, c.name]))
  const paymentMethodMap = new Map(paymentMethods.map((pm) => [pm.id, pm.name]))

  const openCreate = () => {
    setEditing(null)
    setShowModal(true)
  }

  const openEdit = (item: RecurringExpense) => {
    setEditing(item)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
  }

  const handleSubmit = async (
    data: RecurringExpenseCreateRequest | RecurringExpenseUpdateRequest,
    id?: number,
  ) => {
    try {
      if (id) {
        await updateMutation.mutateAsync({ id, ...data })
        addToast('고정비가 업데이트되었습니다.', 'success')
      } else {
        await createMutation.mutateAsync(data as RecurringExpenseCreateRequest)
        addToast('새 고정비가 추가되었습니다.', 'success')
      }
      closeModal()
    } catch {
      addToast('저장 중 오류가 발생했습니다.', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget)
      setDeleteTarget(null)
      addToast('고정비가 삭제되었습니다.', 'success')
    } catch {
      addToast('삭제 중 오류가 발생했습니다.', 'error')
      setDeleteTarget(null)
    }
  }

  const handleToggle = async (id: number) => {
    try {
      await toggleMutation.mutateAsync(id)
    } catch {
      addToast('상태 변경 중 오류가 발생했습니다.', 'error')
    }
  }

  if (isLoading) {
    return <SkeletonList items={4} />
  }

  if (expenses.length === 0) {
    return (
      <EmptyState
        icon="🔄"
        title="등록된 고정비가 없습니다"
        description="월 고정 지출을 등록해 보세요."
        action={{ label: '첫 고정비 추가', onClick: openCreate }}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">고정비 관리</h3>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                     font-medium transition"
        >
          + 새 고정비
        </button>
      </div>

      {expenses.map((item) => (
        <div key={item.id} className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-gray-100 font-medium">{item.name}</span>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  item.is_active
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {item.is_active ? '활성' : '비활성'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleToggle(item.id)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                  item.is_active
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {item.is_active ? '비활성화' : '활성화'}
              </button>
              <button
                onClick={() => openEdit(item)}
                className="px-3 py-1 text-gray-400 hover:text-gray-200 transition"
              >
                수정
              </button>
              <button
                onClick={() => setDeleteTarget(item.id)}
                className="px-3 py-1 text-red-400 hover:text-red-300 transition"
              >
                삭제
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            {formatWon(item.amount)}
            {' · '}
            {categoryMap.get(item.category_id) ?? `카테고리 #${item.category_id}`}
            {' · '}
            {paymentMethodMap.get(item.payment_method_id) ?? `결제수단 #${item.payment_method_id}`}
            {' · '}
            {item.start_date} ~ {item.end_date || '무기한'}
          </div>
        </div>
      ))}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editing ? '고정비 수정' : '새 고정비'}
      >
        <RecurringExpenseForm
          initialData={editing ?? undefined}
          categories={categories}
          paymentMethods={paymentMethods}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="고정비 삭제"
        message="이 고정비를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        variant="danger"
      />
    </div>
  )
}
