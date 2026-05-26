// 카테고리별 지출 도넛 차트 — Recharts PieChart 기반
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import type { CategoryStat } from '@/shared/types'
import { formatWon } from '@/shared/hooks/useCurrency'
import { EmptyState } from '@/shared/components/EmptyState'

interface CategoryDonutChartProps {
  categoryBreakdown: CategoryStat[]
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: CategoryStat }>
}) {
  if (!active || !payload?.length) return null
  const item = payload[0]!.payload
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
      <p className="text-gray-100 font-medium">{item.category_name}</p>
      <p className="text-red-400">
        {formatWon(item.total)} ({item.percentage}%)
      </p>
    </div>
  )
}

export function CategoryDonutChart({
  categoryBreakdown,
}: CategoryDonutChartProps) {
  if (categoryBreakdown.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <EmptyState title="지출 내역이 없습니다" description="이번 달 지출을 기록하면 카테고리별 통계를 볼 수 있습니다." />
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-100 mb-3">
        카테고리별 지출
      </h3>

      {/* 도넛 차트 */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryBreakdown}
              dataKey="total"
              nameKey="category_name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              strokeWidth={0}
            >
              {categoryBreakdown.map((entry) => (
                <Cell key={entry.category_id} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 범례 */}
      <ul className="mt-3 space-y-2">
        {categoryBreakdown.map((cat) => (
          <li key={cat.category_id} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block w-3 h-3 rounded-sm shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-gray-300 flex-1 truncate">
              {cat.category_name}
            </span>
            <span className="text-gray-400 tabular-nums">
              {formatWon(cat.total)}
            </span>
            <span className="text-gray-500 tabular-nums w-10 text-right">
              {cat.percentage}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
