// 카테고리 관리 탭 — 수입/지출 분리 탭
import { useState } from 'react'
import { useToast } from '@/contexts/ToastContext'
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/shared/hooks/useCategories'
import { Modal } from '@/shared/components/Modal'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { EmptyState } from '@/shared/components/EmptyState'
import { SkeletonList } from '@/shared/components/Skeleton'
import { CategoryForm } from './forms/CategoryForm'
import type { Category } from '@/shared/types'

type SubTab = 'expense' | 'income'

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: 'expense', label: '지출' },
  { key: 'income', label: '수입' },
]

export function CategoryTab() {
  const { addToast } = useToast()
  const [subTab, setSubTab] = useState<SubTab>('expense')
  const { data: allCategories = [], isLoading } = useCategories()
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const categories = allCategories.filter((c) => c.type === subTab)

  const openCreate = () => {
    setEditing(null)
    setShowModal(true)
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
  }

  const handleSubmit = async (
    data: {
      name: string
      type: 'income' | 'expense'
      icon: string
      color: string
      sort_order: number
    },
    id?: number,
  ) => {
    try {
      if (id) {
        await updateMutation.mutateAsync({ id, ...data })
        addToast('카테고리가 업데이트되었습니다.', 'success')
      } else {
        await createMutation.mutateAsync(data)
        addToast('새 카테고리가 추가되었습니다.', 'success')
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
      addToast('카테고리가 삭제되었습니다.', 'success')
    } catch {
      addToast('삭제 중 오류가 발생했습니다.', 'error')
      setDeleteTarget(null)
    }
  }

  if (isLoading) {
    return <SkeletonList items={4} />
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex gap-1 bg-gray-800 rounded-lg p-1">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                subTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                     font-medium transition"
        >
          + 새 카테고리
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon="🏷️"
          title={`${subTab === 'expense' ? '지출' : '수입'} 카테고리가 없습니다`}
          description="카테고리를 추가해 보세요."
          action={{ label: '첫 카테고리 추가', onClick: openCreate }}
        />
      ) : (
        categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: cat.color }}
              >
                {cat.icon}
              </div>
              <div>
                <div className="text-gray-100 font-medium">{cat.name}</div>
                <div
                  className="w-4 h-1 rounded-full mt-1"
                  style={{ backgroundColor: cat.color }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openEdit(cat)}
                className="px-3 py-1 text-gray-400 hover:text-gray-200 transition"
              >
                수정
              </button>
              <button
                onClick={() => setDeleteTarget(cat.id)}
                className="px-3 py-1 text-red-400 hover:text-red-300 transition"
              >
                삭제
              </button>
            </div>
          </div>
        ))
      )}

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editing ? '카테고리 수정' : '새 카테고리'}
      >
        <CategoryForm
          initialData={editing ?? undefined}
          onSubmit={handleSubmit}
          onCancel={closeModal}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="카테고리 삭제"
        message="이 카테고리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
        variant="danger"
      />
    </div>
  )
}
