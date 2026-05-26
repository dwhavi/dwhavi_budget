// 거래 목록 — 날짜별 그룹핑, 로딩 스켈레톤, 빈 상태 처리
import { useMemo } from 'react'
import type { Transaction } from '@/shared/types'
import { TransactionRow } from './TransactionRow'
import { SkeletonList } from '@/shared/components/Skeleton'
import { EmptyState } from '@/shared/components/EmptyState'

interface TransactionListProps {
  transactions: Transaction[]
  isLoading: boolean
  onRowClick: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
  onCreateClick: () => void
}

interface DateGroup {
  date: string
  label: string
  items: Transaction[]
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']
  const month = date.getMonth() + 1
  const day = date.getDate()
  const dayName = dayNames[date.getDay()]
  return `${month}월 ${day}일 (${dayName})`
}

function groupByDate(transactions: Transaction[]): DateGroup[] {
  const map = new Map<string, Transaction[]>()

  for (const t of transactions) {
    const existing = map.get(t.date)
    if (existing) {
      existing.push(t)
    } else {
      map.set(t.date, [t])
    }
  }

  const groups: DateGroup[] = []
  for (const [date, items] of map) {
    groups.push({ date, label: formatDateLabel(date), items })
  }

  return groups
}

export function TransactionList({
  transactions,
  isLoading,
  onRowClick,
  onDelete,
  onCreateClick,
}: TransactionListProps) {
  const dateGroups = useMemo(() => groupByDate(transactions), [transactions])

  if (isLoading) {
    return <SkeletonList items={5} />
  }

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon="💳"
        title="거래 내역이 없습니다"
        description="이 달의 거래를 등록해 보세요."
        action={{ label: '+ 거래 등록', onClick: onCreateClick }}
      />
    )
  }

  return (
    <div className="space-y-6">
      {dateGroups.map((group) => (
        <div key={group.date}>
          <div className="flex items-center gap-3 mb-2 px-1">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {group.label}
            </h3>
            <div className="flex-1 h-px bg-gray-800" />
          </div>
          <div className="space-y-2">
            {group.items.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onClick={onRowClick}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
