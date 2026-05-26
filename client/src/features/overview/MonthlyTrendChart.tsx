// 6개월 수입 vs 지출 막대 차트 — Recharts BarChart
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { MonthlyTrend } from '@/shared/types'
import { EmptyState } from '@/shared/components/EmptyState'
import { formatWon } from '@/shared/hooks/useCurrency'

interface MonthlyTrendChartProps {
  data: MonthlyTrend[]
}

function formatMonthLabel(monthStr: string): string {
  const parts = monthStr.split('-')
  const m = Number(parts[1])
  return `${m}월`
}

interface TooltipPayloadItem {
  name: string
  value: number
  color: string
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 shadow-lg">
      <p className="text-gray-300 text-xs font-medium mb-1">{label}</p>
      {payload.map((item) => (
        <p key={item.name} className="text-xs" style={{ color: item.color }}>
          {item.name}: {formatWon(item.value)}
        </p>
      ))}
    </div>
  )
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
        <h3 className="text-gray-400 text-sm font-medium mb-4">월별 추이</h3>
        <EmptyState
          icon="📊"
          title="데이터가 없습니다"
          description="거래를 등록하면 월별 추이를 볼 수 있습니다."
        />
      </div>
    )
  }

  const chartData = data.map((d) => ({
    ...d,
    name: formatMonthLabel(d.month),
  }))

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <h3 className="text-gray-400 text-sm font-medium mb-4">월별 추이</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={false}
              tickFormatter={(v: number) => {
                if (v >= 10000) return `${Math.floor(v / 10000)}만`
                return v.toLocaleString('ko-KR')
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
            />
            <Bar
              dataKey="income"
              name="수입"
              fill="#60a5fa"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="expense"
              name="지출"
              fill="#f87171"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
