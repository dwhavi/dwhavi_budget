// 결제수단 등록/수정 폼 모달
import { useState, useEffect } from 'react'
import type { PaymentMethod, PaymentMethodCreateRequest, PaymentMethodUpdateRequest } from '@/shared/types'

const COLOR_OPTIONS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#64748B',
]

const TYPE_LABELS: Record<PaymentMethodCreateRequest['type'], string> = {
  credit: '신용카드',
  debit: '체크카드',
  cash: '현금',
  transfer: '이체',
}

interface PaymentMethodFormProps {
  initialData?: PaymentMethod
  onSubmit: (data: PaymentMethodCreateRequest | PaymentMethodUpdateRequest, id?: number) => void
  onCancel: () => void
}

export function PaymentMethodForm({ initialData, onSubmit, onCancel }: PaymentMethodFormProps) {
  const [formData, setFormData] = useState<PaymentMethodCreateRequest>({
    name: '',
    issuer: '',
    type: 'credit',
    color: COLOR_OPTIONS[0],
    is_default: false,
    memo: '',
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        issuer: initialData.issuer || '',
        type: initialData.type,
        color: initialData.color || COLOR_OPTIONS[0],
        is_default: initialData.is_default,
        memo: initialData.memo || '',
      })
    }
  }, [initialData])

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
        <label className="block text-sm font-medium text-gray-300 mb-2">발급사</label>
        <input
          type="text"
          value={formData.issuer}
          onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100
                     focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">유형</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({
            ...formData,
            type: e.target.value as PaymentMethodCreateRequest['type'],
          })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100
                     focus:outline-none focus:border-blue-500"
        >
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">색상</label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`w-8 h-8 rounded-full border-2 transition ${
                formData.color === color ? 'border-white' : 'border-gray-600'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_default"
          checked={formData.is_default}
          onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
          className="mr-2"
        />
        <label htmlFor="is_default" className="text-sm text-gray-300">기본 결제수단으로 설정</label>
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
