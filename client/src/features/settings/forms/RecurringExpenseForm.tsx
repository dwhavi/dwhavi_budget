// 고정비 등록/수정 폼 모달
import { useState, useEffect } from 'react'
import { CurrencyInput } from '@/shared/components/CurrencyInput'
import type {
  RecurringExpense,
  RecurringExpenseCreateRequest,
  RecurringExpenseUpdateRequest,
  Category,
  PaymentMethod,
} from '@/shared/types'

interface RecurringExpenseFormProps {
  initialData?: RecurringExpense
  categories: Category[]
  paymentMethods: PaymentMethod[]
  onSubmit: (data: RecurringExpenseCreateRequest | RecurringExpenseUpdateRequest, id?: number) => void
  onCancel: () => void
}

export function RecurringExpenseForm({
  initialData,
  categories,
  paymentMethods,
  onSubmit,
  onCancel,
}: RecurringExpenseFormProps) {
  const [formData, setFormData] = useState<RecurringExpenseCreateRequest>({
    name: '',
    amount: 0,
    category_id: 0,
    payment_method_id: 0,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: undefined,
    memo: '',
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        amount: initialData.amount,
        category_id: initialData.category_id,
        payment_method_id: initialData.payment_method_id,
        start_date: initialData.start_date,
        end_date: initialData.end_date || undefined,
        memo: initialData.memo || '',
      })
    }
  }, [initialData])

  const expenseCategories = categories.filter((cat) => cat.type === 'expense')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData, initialData?.id)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">이름</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100
                     focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">금액</label>
        <CurrencyInput
          value={formData.amount}
          onChange={(val) => setFormData({ ...formData, amount: val })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100
                     focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">카테고리</label>
        <select
          value={formData.category_id || ''}
          onChange={(e) => setFormData({
            ...formData,
            category_id: parseInt(e.target.value) || 0,
          })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100
                     focus:outline-none focus:border-blue-500"
          required
        >
          <option value="" disabled>카테고리 선택</option>
          {expenseCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">결제수단</label>
        <select
          value={formData.payment_method_id || ''}
          onChange={(e) => setFormData({
            ...formData,
            payment_method_id: parseInt(e.target.value) || 0,
          })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100
                     focus:outline-none focus:border-blue-500"
          required
        >
          <option value="" disabled>결제수단 선택</option>
          {paymentMethods.map((pm) => (
            <option key={pm.id} value={pm.id}>{pm.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">시작일</label>
        <input
          type="date"
          value={formData.start_date}
          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100
                     focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">종료일 (선택)</label>
        <input
          type="date"
          value={formData.end_date || ''}
          onChange={(e) => setFormData({
            ...formData,
            end_date: e.target.value || undefined,
          })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100
                     focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">메모</label>
        <textarea
          value={formData.memo}
          onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100
                     focus:outline-none focus:border-blue-500"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg
                     font-medium transition"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                     font-medium transition"
        >
          저장
        </button>
      </div>
    </form>
  )
}
