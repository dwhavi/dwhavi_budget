// 접기/펼치기 캘린더 — 지출 금액만 표시
import { useState, useMemo } from 'react'
import type { Transaction } from '@/shared/types'
import { formatWonCompact } from '@/shared/hooks/useCurrency'

interface CalendarSectionProps {
  month: string // 'YYYY-MM'
  transactions: Transaction[]
  onDateClick: (date: string) => void
}

const WEEK_DAYS = ['일', '월', '화', '수', '목', '금', '토']

/** 지출만 집계한 일자 데이터 */
interface DayCell {
  date: string
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  expenseTotal: number
}

function buildCalendarDays(month: string, transactions: Transaction[]): DayCell[] {
  const parts = month.split('-').map(Number)
  const year = parts[0] ?? 0
  const monthNum = parts[1] ?? 1

  const firstDay = new Date(year, monthNum - 1, 1)
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - firstDay.getDay())

  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

  // 지출만 날짜별로 집계
  const expenseMap = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'expense') continue
    expenseMap.set(t.date, (expenseMap.get(t.date) ?? 0) + t.amount)
  }

  const days: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate)
    d.setDate(startDate.getDate() + i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    days.push({
      date: dateStr,
      day: d.getDate(),
      isCurrentMonth: d.getMonth() === monthNum - 1,
      isToday: dateStr === todayStr,
      expenseTotal: expenseMap.get(dateStr) ?? 0,
    })
  }

  return days
}

export function CalendarSection({
  month,
  transactions,
  onDateClick,
}: CalendarSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const days = useMemo(
    () => buildCalendarDays(month, transactions),
    [month, transactions],
  )

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl">
      {/* 헤더 — 토글 */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between p-4 text-left"
        aria-expanded={isExpanded}
        aria-label="캘린더 접기/펼치기"
      >
        <h3 className="text-sm font-semibold text-gray-100">지출 캘린더</h3>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEK_DAYS.map((wd) => (
              <div
                key={wd}
                className="text-center text-xs text-gray-500 py-1"
              >
                {wd}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((cell) => (
              <button
                key={cell.date}
                onClick={() => onDateClick(cell.date)}
                className={`rounded-lg p-1.5 text-center min-h-[52px] flex flex-col items-center justify-center transition-colors ${
                  cell.isToday
                    ? 'border border-blue-500 bg-blue-500/10'
                    : 'hover:bg-gray-800/50'
                } ${!cell.isCurrentMonth ? 'opacity-30' : ''}`}
                aria-label={`${cell.date} 지출 상세 보기`}
              >
                <span className="text-xs text-gray-400 leading-none">
                  {cell.day}
                </span>
                {cell.expenseTotal > 0 && (
                  <span className="text-[10px] text-red-400 truncate w-full leading-tight mt-0.5">
                    -{formatWonCompact(cell.expenseTotal)}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
