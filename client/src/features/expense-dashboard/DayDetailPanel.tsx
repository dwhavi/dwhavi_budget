// 날짜 클릭 시 해당 일 지출 상세 바텀시트
import type { Transaction } from '@/shared/types'
import { formatWon } from '@/shared/hooks/useCurrency'
import { Modal } from '@/shared/components/Modal'

interface DayDetailPanelProps {
  isOpen: boolean
  onClose: () => void
  date: string // 'YYYY-MM-DD'
  transactions: Transaction[]
}

/** 'YYYY-MM-DD' → 'M월 D일' 형식 */
function formatDateLabel(dateStr: string): string {
  const parts = dateStr.split('-').map(Number)
  return `${parts[1]}월 ${parts[2]}일`
}

export function DayDetailPanel({
  isOpen,
  onClose,
  date,
  transactions,
}: DayDetailPanelProps) {
  const expenseList = transactions.filter((t) => t.type === 'expense')
  const totalExpense = expenseList.reduce((sum, t) => sum + t.amount, 0)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={formatDateLabel(date)}>
      {expenseList.length === 0 ? (
        <p className="text-center text-gray-400 py-8">이 날의 지출 내역이 없습니다.</p>
      ) : (
        <>
          <div className="mb-4 p-3 rounded-lg bg-gray-800/70 flex items-center justify-between">
            <span className="text-sm text-gray-400">총 지출</span>
            <span className="text-lg font-bold text-red-400 tabular-nums">
              -{formatWon(totalExpense)}
            </span>
          </div>
          <ul className="space-y-3">
          {expenseList.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50"
            >
              {/* 카테고리 색상 표시 */}
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                style={{
                  backgroundColor: (t.category_color ?? '#374151') + '33',
                  color: t.category_color ?? '#9CA3AF',
                }}
                aria-hidden="true"
              >
                {(t.category?.icon ?? '') || (t.category?.name?.charAt(0) ?? '?')}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-100 truncate">
                  {t.category?.name ?? t.category_name ?? '미분류'}
                </p>
                {t.memo && (
                  <p className="text-xs text-gray-500 truncate">{t.memo}</p>
                )}
              </div>

              <span className="text-sm font-medium text-red-400 tabular-nums shrink-0">
                -{formatWon(t.amount)}
              </span>
            </li>
          ))}
        </ul>
        </>
      )}
    </Modal>
  )
}
