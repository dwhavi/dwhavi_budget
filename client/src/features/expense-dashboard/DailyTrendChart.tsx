// 일일 지출 추이 라인 차트 — Recharts AreaChart 기반
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatWon } from '@/shared/hooks/useCurrency'

interface DailyPoint {
  date: string
  total: number
}

interface DailyTrendChartProps {
  dailyBreakdown: DailyPoint[]
}

function formatXAxis(dateStr: string): string {
  const parts = dateStr.split('-')
  const day = parts[2]
  return day ? String(Number(day)) : ''
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
      <p className="text-gray-300">{label}</p>
      <p className="text-red-400 font-medium">{formatWon(payload[0]!.value)}</p>
    </div>
  )
}

export function DailyTrendChart({ dailyBreakdown }: DailyTrendChartProps) {
  if (dailyBreakdown.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center text-gray-400 text-sm py-8">
        표시할 지출 추이 데이터가 없습니다.
      </div>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <h3 className="text-sm font-semibold text-gray-100 mb-3">
        일일 지출 추이
      </h3>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dailyBreakdown}>
            <defs>
              <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              axisLine={{ stroke: '#374151' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}만`}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="total"
              stroke="#EF4444"
              strokeWidth={2}
              fill="url(#expenseGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
