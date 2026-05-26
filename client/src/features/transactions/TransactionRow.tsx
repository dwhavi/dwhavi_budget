// 개별 거래 행 — 카테고리 아이콘, 금액, 결제수단, 메모 표시 + 스와이프 삭제
import { useState, useRef, useCallback } from 'react'
import type { Transaction } from '@/shared/types'
import { formatWon } from '@/shared/hooks/useCurrency'

interface TransactionRowProps {
  transaction: Transaction
  onClick: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
}

/** 터치 스와이프 감지 임계값 (px) */
const SWIPE_THRESHOLD = 80

export function TransactionRow({
  transaction,
  onClick,
  onDelete,
}: TransactionRowProps) {
  const [swipeX, setSwipeX] = useState(0)
  const touchStartX = useRef(0)
  const touchCurrentX = useRef(0)

  const category = transaction.category
  const icon = category?.icon ?? '📝'
  const categoryName = transaction.category_name ?? category?.name ?? '기타'
  const subCategory = transaction.sub_category
  const paymentMethodName = transaction.payment_method_name
  const memo = transaction.memo

  const isIncome = transaction.type === 'income'
  const amountColor = isIncome ? 'text-blue-400' : 'text-red-400'
  const amountPrefix = isIncome ? '+' : '-'
  const amountText = `${amountPrefix}${formatWon(transaction.amount)}`

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? 0
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    touchCurrentX.current = e.touches[0]?.clientX ?? 0
    const diff = touchStartX.current - touchCurrentX.current
    if (diff > 0) {
      setSwipeX(Math.min(diff, 120))
    } else {
      setSwipeX(0)
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (swipeX < SWIPE_THRESHOLD) {
      setSwipeX(0)
    }
  }, [swipeX])

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onDelete(transaction)
    },
    [onDelete, transaction],
  )

  const handleRowClick = useCallback(() => {
    onClick(transaction)
  }, [onClick, transaction])

  const categoryColor = category?.color

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div className="absolute inset-y-0 right-0 flex items-center justify-center w-24 bg-red-600 rounded-r-lg">
        <button
          onClick={handleDeleteClick}
          className="text-white text-sm font-medium min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="삭제"
        >
          삭제
        </button>
      </div>

      <div
        className="relative flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 cursor-pointer hover:bg-gray-800/80 transition-colors select-none"
        style={{
          transform: `translateX(-${swipeX}px)`,
          transition: swipeX === 0 ? 'transform 0.2s ease' : 'none',
        }}
        onClick={handleRowClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        role="button"
        tabIndex={0}
        aria-label={`${categoryName} ${amountText}`}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{ backgroundColor: categoryColor ? `${categoryColor}20` : '#374151' }}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-100 truncate">
              {categoryName}
            </span>
            {subCategory && (
              <span className="text-xs text-gray-500 truncate">
                · {subCategory}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {paymentMethodName && (
              <span className="text-xs text-gray-500 truncate">
                {paymentMethodName}
              </span>
            )}
            {memo && (
              <span className="text-xs text-gray-600 truncate">
                {paymentMethodName && '· '}{memo}
              </span>
            )}
          </div>
        </div>

        <div className={`text-sm font-semibold ${amountColor} shrink-0`}>
          {amountText}
        </div>
      </div>
    </div>
  )
}
