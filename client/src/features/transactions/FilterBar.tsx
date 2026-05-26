// 필터 바 — 유형 토글, 카테고리/결제수단 셀렉트, 키워드 검색 + 모바일 접기/펼치기
import { useState, useCallback } from 'react'
import type { Category, PaymentMethod } from '@/shared/types'

export interface FilterState {
  type: 'income' | 'expense' | undefined
  category_id: number | undefined
  payment_method_id: number | undefined
  keyword: string
}

interface FilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  categories: Category[]
  paymentMethods: PaymentMethod[]
}

export function FilterBar({
  filters,
  onChange,
  categories,
  paymentMethods,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleTypeToggle = useCallback(
    (type: 'income' | 'expense' | undefined) => {
      onChange({ ...filters, type })
    },
    [filters, onChange],
  )

  const handleCategoryChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value
      onChange({
        ...filters,
        category_id: value ? Number(value) : undefined,
      })
    },
    [filters, onChange],
  )

  const handlePaymentMethodChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value
      onChange({
        ...filters,
        payment_method_id: value ? Number(value) : undefined,
      })
    },
    [filters, onChange],
  )

  const handleKeywordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ ...filters, keyword: e.target.value })
    },
    [filters, onChange],
  )

  const typeButtons: { label: string; value: 'income' | 'expense' | undefined }[] = [
    { label: '전체', value: undefined },
    { label: '수입', value: 'income' },
    { label: '지출', value: 'expense' },
  ]

  const hasActiveFilter =
    filters.type !== undefined ||
    filters.category_id !== undefined ||
    filters.payment_method_id !== undefined ||
    filters.keyword !== ''

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <button
        className="flex items-center justify-between w-full p-4 lg:hidden text-gray-100"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="text-sm font-medium">
          필터{hasActiveFilter && ' · 활성'}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`px-4 pb-4 space-y-4 lg:block ${
          isExpanded ? 'block' : 'hidden'
        }`}
      >
        <div className="flex rounded-lg bg-gray-800 p-1 gap-1">
          {typeButtons.map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={() => handleTypeToggle(btn.value)}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition ${
                filters.type === btn.value
                  ? btn.value === 'income'
                    ? 'bg-blue-600 text-white'
                    : btn.value === 'expense'
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={filters.category_id ?? ''}
            onChange={handleCategoryChange}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">카테고리 전체</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>

          <select
            value={filters.payment_method_id ?? ''}
            onChange={handlePaymentMethodChange}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">결제수단 전체</option>
            {paymentMethods.map((pm) => (
              <option key={pm.id} value={pm.id}>
                {pm.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={filters.keyword}
            onChange={handleKeywordChange}
            placeholder="키워드 검색"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  )
}
