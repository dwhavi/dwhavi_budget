// 거래 내역 페이지 오케스트레이터 — 월 네비게이션, 필터, 목록, 폼 통합 관리
import { useState, useCallback } from 'react'
import { useMonthNavigation } from '@/shared/hooks/useMonthNavigation'
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '@/shared/hooks/useTransactions'
import {
  useCategories,
  useCreateCategory,
} from '@/shared/hooks/useCategories'
import {
  usePaymentMethods,
  useCreatePaymentMethod,
} from '@/shared/hooks/usePaymentMethods'
import type {
  Transaction,
  TransactionCreateRequest,
} from '@/shared/types'
import { FilterBar, type FilterState } from './FilterBar'
import { TransactionList } from './TransactionList'
import { TransactionSummary } from './TransactionSummary'
import { Pagination } from './Pagination'
import { TransactionForm } from './TransactionForm'
import { ConfirmDialog } from '@/shared/components/ConfirmDialog'
import { useToast } from '@/contexts/ToastContext'

const PAGE_SIZE = 20

export function TransactionsPage() {
  const { selectedMonth, goToPrevMonth, goToNextMonth } =
    useMonthNavigation()
  const { data: allCategories } = useCategories()
  const { data: paymentMethods } = usePaymentMethods()

  const createCategory = useCreateCategory()
  const createPaymentMethod = useCreatePaymentMethod()

  const [filters, setFilters] = useState<FilterState>({
    type: undefined,
    category_id: undefined,
    payment_method_id: undefined,
    keyword: '',
  })
  const [page, setPage] = useState(1)

  const { data, isLoading } = useTransactions({
    month: selectedMonth,
    type: filters.type,
    category_id: filters.category_id,
    payment_method_id: filters.payment_method_id,
    keyword: filters.keyword || undefined,
    page,
    limit: PAGE_SIZE,
  })

  const createTransaction = useCreateTransaction()
  const updateTransaction = useUpdateTransaction()
  const deleteTransaction = useDeleteTransaction()
  const { addToast } = useToast()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] =
    useState<Transaction | null>(null)

  const transactions = data?.transactions ?? []
  const pagination = data?.pagination

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handleCreateClick = useCallback(() => {
    setEditingTransaction(null)
    setIsFormOpen(true)
  }, [])

  const handleRowClick = useCallback((transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsFormOpen(true)
  }, [])

  const handleDeleteClick = useCallback((transaction: Transaction) => {
    setDeletingTransaction(transaction)
  }, [])

  const handleFormClose = useCallback(() => {
    setIsFormOpen(false)
    setEditingTransaction(null)
  }, [])

  const handleFormSubmit = useCallback(
    async (
      data: TransactionCreateRequest,
      customCategoryName?: string,
      customPaymentMethodName?: string,
    ) => {
      let finalCategoryId = data.category_id
      let finalPaymentMethodId = data.payment_method_id

      if (finalCategoryId === -1 && customCategoryName) {
        const result = await createCategory.mutateAsync({
          name: customCategoryName,
          type: data.type as 'income' | 'expense',
          icon: '💵',
          color: '#6B7280',
          sort_order: 0,
        })
        finalCategoryId = result.id
      }

      if (finalPaymentMethodId === -1 && customPaymentMethodName) {
        const pmType = customPaymentMethodName.includes('카드')
          ? ('credit' as const)
          : ('cash' as const)
        const result = await createPaymentMethod.mutateAsync({
          name: customPaymentMethodName,
          type: pmType,
          is_default: false,
        })
        finalPaymentMethodId = result.id
      }

      if (editingTransaction) {
        await updateTransaction.mutateAsync({
          id: editingTransaction.id,
          ...data,
          category_id: finalCategoryId,
          payment_method_id:
            finalPaymentMethodId === -1 ? undefined : finalPaymentMethodId,
        })
        addToast('거래가 수정되었습니다.', 'success')
      } else {
        await createTransaction.mutateAsync({
          ...data,
          category_id: finalCategoryId,
          payment_method_id:
            finalPaymentMethodId === -1 ? undefined : finalPaymentMethodId,
        })
        addToast('거래가 등록되었습니다.', 'success')
      }
    },
    [
      editingTransaction,
      updateTransaction,
      createTransaction,
      addToast,
      createCategory,
      createPaymentMethod,
    ],
  )

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingTransaction) return
    try {
      await deleteTransaction.mutateAsync(deletingTransaction.id)
      addToast('거래가 삭제되었습니다.', 'success')
    } catch {
      addToast('삭제 중 오류가 발생했습니다.', 'error')
    }
    setDeletingTransaction(null)
  }, [deletingTransaction, deleteTransaction, addToast])

  const year = selectedMonth.split('-')[0]
  const month = selectedMonth.split('-')[1]

  return (
    <div className="space-y-4 pb-6 lg:max-w-4xl lg:mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={goToPrevMonth}
            className="p-2 text-gray-400 hover:text-gray-100 transition rounded-lg hover:bg-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="이전 달"
          >
            ◀
          </button>
          <h1 className="text-lg font-bold text-gray-100 whitespace-nowrap">
            {year}년 {Number(month)}월
          </h1>
          <button
            onClick={goToNextMonth}
            className="p-2 text-gray-400 hover:text-gray-100 transition rounded-lg hover:bg-gray-800 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="다음 달"
          >
            ▶
          </button>
        </div>
        <button
          onClick={handleCreateClick}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition min-h-[44px]"
        >
          + 등록
        </button>
      </div>

      <FilterBar
        filters={filters}
        onChange={handleFilterChange}
        categories={allCategories ?? []}
        paymentMethods={paymentMethods ?? []}
      />

      <TransactionSummary transactions={transactions} paymentMethods={paymentMethods ?? []} />

      <TransactionList
        transactions={transactions}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        onDelete={handleDeleteClick}
        onCreateClick={handleCreateClick}
      />

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <TransactionForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        initialData={editingTransaction ?? undefined}
        categories={allCategories ?? []}
        paymentMethods={paymentMethods ?? []}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        isOpen={!!deletingTransaction}
        onClose={() => setDeletingTransaction(null)}
        onConfirm={handleConfirmDelete}
        title="거래 삭제"
        message="이 거래를 삭제하시겠습니까? 복구할 수 있습니다."
        confirmText="삭제"
        variant="danger"
      />
    </div>
  )
}
