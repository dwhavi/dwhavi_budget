// 거래 등록/수정 모달 폼 — 유형 토글, 금액, 카테고리, 결제수단, 하위카테고리, 날짜, 메모
import { useState, useEffect, useCallback } from 'react'
import type {
  Transaction,
  TransactionCreateRequest,
  Category,
  PaymentMethod,
} from '@/shared/types'
import { CurrencyInput } from '@/shared/components/CurrencyInput'
import { Modal } from '@/shared/components/Modal'

interface TransactionFormProps {
  isOpen: boolean
  onClose: () => void
  initialData?: Transaction
  categories: Category[]
  paymentMethods: PaymentMethod[]
  onSubmit: (data: TransactionCreateRequest) => Promise<void>
}

const CUSTOM_VALUE = -1

export function TransactionForm({
  isOpen,
  onClose,
  initialData,
  categories,
  paymentMethods,
  onSubmit,
}: TransactionFormProps) {
  const isEditing = !!initialData

  const [type, setType] = useState<'income' | 'expense'>(
    initialData?.type ?? 'expense',
  )
  const [amount, setAmount] = useState(initialData?.amount ?? 0)
  const [categoryId, setCategoryId] = useState(initialData?.category_id ?? 0)
  const [paymentMethodId, setPaymentMethodId] = useState<
    number | undefined
  >(initialData?.payment_method_id)
  const [subCategory, setSubCategory] = useState(
    initialData?.sub_category ?? '',
  )
  const [date, setDate] = useState(
    initialData?.date ?? new Date().toISOString().split('T')[0] ?? '',
  )
  const [memo, setMemo] = useState(initialData?.memo ?? '')

  const [customCategoryName, setCustomCategoryName] = useState('')
  const [customPaymentMethodName, setCustomPaymentMethodName] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [paymentMethodError, setPaymentMethodError] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)

  const filteredCategories = categories.filter((c) => c.type === type)

  useEffect(() => {
    if (!isOpen) return
    setType(initialData?.type ?? 'expense')
    setAmount(initialData?.amount ?? 0)
    setCategoryId(initialData?.category_id ?? 0)
    setPaymentMethodId(initialData?.payment_method_id)
    setSubCategory(initialData?.sub_category ?? '')
    setDate(initialData?.date ?? new Date().toISOString().split('T')[0] ?? '')
    setMemo(initialData?.memo ?? '')
    setCustomCategoryName('')
    setCustomPaymentMethodName('')
    setCategoryError('')
    setPaymentMethodError('')
  }, [isOpen, initialData])

  const handleTypeChange = useCallback((newType: 'income' | 'expense') => {
    setType(newType)
    setCategoryId(0)
    setSubCategory('')
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      let hasError = false

      if (categoryId === CUSTOM_VALUE) {
        if (!customCategoryName.trim()) {
          setCategoryError('카테고리 이름을 입력하세요')
          hasError = true
        } else if (
          categories.some(
            (c) =>
              c.type === type &&
              c.name.trim() === customCategoryName.trim(),
          )
        ) {
          setCategoryError('이미 존재하는 카테고리입니다')
          hasError = true
        }
      }

      if (paymentMethodId === CUSTOM_VALUE) {
        if (!customPaymentMethodName.trim()) {
          setPaymentMethodError('결제수단 이름을 입력하세요')
          hasError = true
        } else if (
          paymentMethods.some(
            (pm) => pm.name.trim() === customPaymentMethodName.trim(),
          )
        ) {
          setPaymentMethodError('이미 존재하는 결제수단입니다')
          hasError = true
        }
      }

      if (
        hasError ||
        amount <= 0 ||
        (!categoryId && categoryId !== CUSTOM_VALUE)
      ) {
        return
      }

      setIsSubmitting(true)
      try {
        const payload: TransactionCreateRequest = {
          type,
          amount,
          category_id: categoryId,
          payment_method_id:
            paymentMethodId === CUSTOM_VALUE ? undefined : paymentMethodId,
          date,
          sub_category: subCategory || undefined,
          memo: memo || undefined,
        }
        await onSubmit(payload)
        onClose()
      } finally {
        setIsSubmitting(false)
      }
    },
    [
      amount,
      categories,
      categoryId,
      customCategoryName,
      customPaymentMethodName,
      date,
      memo,
      onClose,
      onSubmit,
      paymentMethodId,
      paymentMethods,
      subCategory,
      type,
    ],
  )

  const canSubmit =
    amount > 0 &&
    (categoryId > 0 || categoryId === CUSTOM_VALUE) &&
    !isSubmitting

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? '거래 수정' : '거래 등록'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="flex rounded-lg bg-gray-800 p-1">
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                type === 'income'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              수입
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
                type === 'expense'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              지출
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            금액
          </label>
          <div className="relative">
            <CurrencyInput
              value={amount}
              onChange={setAmount}
              min="1"
              max="99999999"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
            <span className="absolute right-3 top-2 text-gray-400 text-sm">
              원
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            카테고리
          </label>
          <select
            value={categoryId || ''}
            onChange={(e) => {
              setCategoryId(Number(e.target.value))
              setSubCategory('')
              setCategoryError('')
            }}
            className={`w-full bg-gray-800 border ${
              categoryError ? 'border-red-500' : 'border-gray-700'
            } rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="">선택하세요</option>
            {filteredCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
            <option value={CUSTOM_VALUE}>직접입력</option>
          </select>
          {categoryId === CUSTOM_VALUE && (
            <input
              type="text"
              value={customCategoryName}
              onChange={(e) => {
                setCustomCategoryName(e.target.value)
                if (e.target.value.trim()) setCategoryError('')
              }}
              className={`mt-2 w-full bg-gray-800 border ${
                categoryError ? 'border-red-500' : 'border-gray-700'
              } rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="카테고리 이름"
            />
          )}
          {categoryError && (
            <p className="text-red-500 text-xs mt-1">{categoryError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            결제수단
          </label>
          <select
            value={paymentMethodId ?? ''}
            onChange={(e) => {
              setPaymentMethodId(
                e.target.value ? Number(e.target.value) : undefined,
              )
              setPaymentMethodError('')
            }}
            className={`w-full bg-gray-800 border ${
              paymentMethodError ? 'border-red-500' : 'border-gray-700'
            } rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
          >
            <option value="">선택하세요</option>
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.name}
              </option>
            ))}
            <option value={CUSTOM_VALUE}>직접입력</option>
          </select>
          {paymentMethodId === CUSTOM_VALUE && (
            <input
              type="text"
              value={customPaymentMethodName}
              onChange={(e) => {
                setCustomPaymentMethodName(e.target.value)
                if (e.target.value.trim()) setPaymentMethodError('')
              }}
              className={`mt-2 w-full bg-gray-800 border ${
                paymentMethodError ? 'border-red-500' : 'border-gray-700'
              } rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              placeholder="결제수단 이름"
            />
          )}
          {paymentMethodError && (
            <p className="text-red-500 text-xs mt-1">{paymentMethodError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            하위 카테고리
          </label>
          <input
            type="text"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="하위 카테고리 입력"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            날짜
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            메모
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="메모를 입력하세요"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition min-h-[44px]"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition min-h-[44px]"
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
