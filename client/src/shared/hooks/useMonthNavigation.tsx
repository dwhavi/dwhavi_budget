// 전역 월 네비게이션 상태 (Context 기반)
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'

interface MonthNavigationContextValue {
  selectedMonth: string // 'YYYY-MM' 형식
  setSelectedMonth: (month: string) => void
  goToPrevMonth: () => void
  goToNextMonth: () => void
  goToCurrentMonth: () => void
}

const MonthNavigationContext =
  createContext<MonthNavigationContextValue | null>(null)

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function shiftMonth(month: string, direction: 1 | -1): string {
  const parts = month.split('-').map(Number)
  const year = parts[0]!
  const m = parts[1]!
  const d = new Date(year, m - 1 + direction)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function MonthNavigationProvider({
  children,
}: {
  children: ReactNode
}) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth)

  const goToPrevMonth = useCallback(() => {
    setSelectedMonth((prev) => shiftMonth(prev, -1))
  }, [])

  const goToNextMonth = useCallback(() => {
    setSelectedMonth((prev) => shiftMonth(prev, 1))
  }, [])

  const goToCurrentMonth = useCallback(() => {
    setSelectedMonth(getCurrentMonth())
  }, [])

  return (
    <MonthNavigationContext.Provider
      value={{
        selectedMonth,
        setSelectedMonth,
        goToPrevMonth,
        goToNextMonth,
        goToCurrentMonth,
      }}
    >
      {children}
    </MonthNavigationContext.Provider>
  )
}

export function useMonthNavigation(): MonthNavigationContextValue {
  const ctx = useContext(MonthNavigationContext)
  if (!ctx)
    throw new Error(
      'useMonthNavigation은 MonthNavigationProvider 내부에서만 사용할 수 있습니다',
    )
  return ctx
}
