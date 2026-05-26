// 결제수단(카드) 관리 탭
import { useState } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { usePaymentMethods, useCreatePaymentMethod, useUpdatePaymentMethod, useDeletePaymentMethod } from '@/shared/hooks/usePaymentMethods'
import { Modal } from '@/shared/components/Modal'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { EmptyState } from '@/shared/components/EmptyState'
import { SkeletonList } from '@/shared/components/Skeleton'
import { PaymentMethodForm } from './forms/PaymentMethodForm'
import type { PaymentMethod, PaymentMethodCreateRequest, PaymentMethodUpdateRequest } from '@/shared/types'

const TYPE_LABELS: Record<PaymentMethod['type'], string> = {
  credit: '신용카드',
  debit: '체크카드',
  cash: '현금',
  transfer: '이체',
}

export function PaymentMethodTab() {
  const { addToast } = useToast()
  const { data: paymentMethods = [], isLoading } = usePaymentMethods()
  const createMutation = useCreatePaymentMethod()
  const updateMutation = useUpdatePaymentMethod()
  const deleteMutation = useDeletePaymentMethod()

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<PaymentMethod | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const openCreate = () => {
    setEditing(null)
    setShowModal(true)
  }

  const openEdit = (pm: PaymentMethod) => {
    setEditing(pm)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
  }

  const handleSubmit = async (data: PaymentMethodCreateRequest | PaymentMethodUpdateRequest, id?: number) => {
    try {
      if (id) {
        await updateMutation.mutateAsync({ id, ...data })
        addToast('결제수단이 업데이트되었습니다.', 'success')
      } else {
        const req = data as PaymentMethodCreateRequest
        await createMutation.mutateAsync({
          name: req.name,
          type: req.type,
          issuer: req.issuer,
          color: req.color,
          is_default: req.is_default ?? false,
          memo: req.memo,
        })
        addToast('새 결제수단이 추가되었습니다.', 'success')
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
      addToast('결제수단이 삭제되었습니다.', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : '삭제 중 오류가 발생했습니다.'
      addToast(message, 'error')
      setDeleteTarget(null)
    }
  }

  if (isLoading) {
    return <SkeletonList items={4} />
  }

  if (paymentMethods.length === 0) {
    return (
      <EmptyState
        icon="💳"
        title="등록된 결제수단이 없습니다"
        description="카드, 현금 등 결제수단을 추가해 보세요."
        action={{ label: '첫 결제수단 추가', onClick: openCreate }}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">결제수단 관리</h3>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                     font-medium transition"
        >
          + 새 결제수단
        </button>
      </div>

      {paymentMethods.map((pm) => {
        const isCash = pm.type === 'cash'
        return (
          <div
            key={pm.id}
            className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: pm.color || '#6B7280' }}
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-100 font-medium">{pm.name}</span>
                  {pm.is_default && (
                    <span className="px-2 py-1 bg-blue-600 text-xs text-white rounded-full">
                      기본
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  {pm.issuer && <span>{pm.issuer}</span>}
                  {pm.issuer && <span className="mx-1">·</span>}
                  <span>{TYPE_LABELS[pm.type]}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openEdit(pm)}
                className="px-3 py-1 text-gray-400 hover:text-gray-200 transition"
              >
                수정
              </button>
              <button
                onClick={() => setDeleteTarget(pm.id)}
                disabled={isCash}
                className={`px-3 py-1 transition ${
                  isCash
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-red-400 hover:text-red-300'
                }`}
              >
                삭제
              </button>
            </div>
          </div>
        )
      })}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editing ? '결제수단 수정' : '새 결제수단'}
      >
        <PaymentMethodForm
          initialData={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="결제수단 삭제"
        message="이 결제수단을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        variant="danger"
      />
    </div>
  )
}
