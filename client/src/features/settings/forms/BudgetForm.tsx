// 예산 등록/수정 폼 모달
import { useState, useEffect } from 'react'
import { CurrencyInput } from '@/shared/components/CurrencyInput'
import type { Budget, BudgetUpsertRequest, Category } from '@/shared/types'

interface BudgetFormProps {
  initialData?: Budget
  categories: Category[]
  currentMonth: string
  onSubmit: (data: BudgetUpsertRequest) => void
  onCancel: () => void
}

export function BudgetForm({ initialData, categories, currentMonth, onSubmit, onCancel }: BudgetFormProps) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [amount, setAmount] = useState<number>(0)

  useEffect(() => {
    if (initialData) {
      setSelectedCategory(initialData.category_id)
      setAmount(initialData.amount)
    } else {
      setSelectedCategory(null)
      setAmount(0)
    }
  }, [initialData])

  const expenseCategories = categories.filter((cat) => cat.type === 'expense')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCategory && amount > 0) {
      onSubmit({
        category_id: selectedCategory,
        month: currentMonth,
        amount,
      })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">지출 카테고리</label>
        <select
          value={selectedCategory ?? ''}
          onChange={(e) => setSelectedCategory(parseInt(e.target.value))}
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
        <label className="block text-sm font-medium text-gray-300 mb-2">예산 금액</label>
        <CurrencyInput
          value={amount}
          onChange={setAmount}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100
                     focus:outline-none focus:border-blue-500"
          placeholder="0"
          required
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
