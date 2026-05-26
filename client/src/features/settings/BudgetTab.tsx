// 예산 설정 탭 — 월별 카테고리 예산 관리
import { useState } from 'react'
import { useToast } from '@/contexts/ToastContext'
import { useMonthNavigation } from '@/shared/hooks/useMonthNavigation'
import { useCategories } from '@/shared/hooks/useCategories'
import { useBudgets, useUpsertBudget } from '@/shared/hooks/useBudgets'
import { Modal } from '@/shared/components/Modal'
import { EmptyState } from '@/shared/components/EmptyState'
import { SkeletonList } from '@/shared/components/Skeleton'
import { BudgetForm } from './forms/BudgetForm'
import { formatWon } from '@/shared/hooks/useCurrency'

export function BudgetTab() {
  const { addToast } = useToast()
  const { selectedMonth, goToPrevMonth, goToNextMonth } = useMonthNavigation()
  const { data: categories = [] } = useCategories('expense')
  const { data: budgets = [], isLoading } = useBudgets(selectedMonth)
  const upsertMutation = useUpsertBudget()

  const [showModal, setShowModal] = useState(false)
  const [editingBudgetId, setEditingBudgetId] = useState<number | null>(null)

  const editingBudget = editingBudgetId
    ? budgets.find((b) => b.id === editingBudgetId)
    : null

  const openCreate = () => {
    setEditingBudgetId(null)
    setShowModal(true)
  }

  const openEdit = (budgetId: number) => {
    setEditingBudgetId(budgetId)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingBudgetId(null)
  }

  const handleSubmit = async (data: Parameters<typeof upsertMutation.mutateAsync>[0]) => {
    try {
      await upsertMutation.mutateAsync(data)
      addToast('예산이 저장되었습니다.', 'success')
      closeModal()
    } catch {
      addToast('저장 중 오류가 발생했습니다.', 'error')
    }
  }

  const displayMonth = (() => {
    const [y, m] = selectedMonth.split('-')
    return `${y}년 ${parseInt(m!)}월`
  })()

  if (isLoading) {
    return <SkeletonList items={3} />
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevMonth}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition"
          >
            &lt;
          </button>
          <h3 className="text-lg font-semibold text-gray-100 min-w-[100px] text-center">
            {displayMonth}
          </h3>
          <button
            onClick={goToNextMonth}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition"
          >
            &gt;
          </button>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                     font-medium transition"
        >
          + 예산 추가
        </button>
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon="📊"
          title="예산이 설정되지 않았습니다"
          description="카테고리별 월 예산을 설정해 보세요."
          action={{ label: '첫 예산 추가', onClick: openCreate }}
        />
      ) : (
        budgets.map((budget) => (
          <div
            key={budget.id}
            className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: budget.category?.color || '#6B7280' }}
              >
                {budget.category?.icon || '📊'}
              </div>
              <div>
                <div className="text-gray-100 font-medium">
                  {budget.category?.name ?? `카테고리 #${budget.category_id}`}
                </div>
                <div className="text-sm text-gray-400">
                  예산: {formatWon(budget.amount)}
                </div>
              </div>
            </div>
            <button
              onClick={() => openEdit(budget.id)}
              className="px-3 py-1 text-gray-400 hover:text-gray-200 transition"
            >
              수정
            </button>
          </div>
        ))
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingBudget ? '예산 수정' : '예산 추가'}
      >
        <BudgetForm
          initialData={editingBudget ?? undefined}
          categories={categories}
          currentMonth={selectedMonth}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>
    </div>
  )
}
