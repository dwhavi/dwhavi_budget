// 카테고리 등록/수정 폼 모달
import { useState, useEffect } from 'react'
import type { Category } from '@/shared/types'

const COLOR_OPTIONS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#64748B',
]

interface CategoryFormProps {
  initialData?: Category
  onSubmit: (data: {
    name: string
    type: 'income' | 'expense'
    icon: string
    color: string
    sort_order: number
  }, id?: number) => void
  onCancel: () => void
}

export function CategoryForm({ initialData, onSubmit, onCancel }: CategoryFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'income' | 'expense'>('expense')
  const [icon, setIcon] = useState('📦')
  const [color, setColor] = useState<string>('#3B82F6')
  const [sortOrder, setSortOrder] = useState(0)

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setType(initialData.type)
      setIcon(initialData.icon)
      setColor(initialData.color)
      setSortOrder(initialData.sort_order)
    }
  }, [initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, type, icon, color, sort_order: sortOrder }, initialData?.id)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">이름</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100
                     focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">유형</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setType('expense')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
              type === 'expense'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >
            지출
          </button>
          <button
            type="button"
            onClick={() => setType('income')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
              type === 'income'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:text-gray-200'
            }`}
          >
            수입
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">아이콘 (이모지)</label>
        <input
          type="text"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="w-20 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100
                     focus:outline-none focus:border-blue-500 text-center text-xl"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">색상</label>
        <div className="flex gap-2 flex-wrap">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`w-8 h-8 rounded-full border-2 transition ${
                color === c ? 'border-white' : 'border-gray-600'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">정렬 순서</label>
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100
                     focus:outline-none focus:border-blue-500"
          min={0}
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
