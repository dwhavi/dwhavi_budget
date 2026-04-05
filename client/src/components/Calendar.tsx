import { useState, useEffect } from 'react';
import type { Transaction } from '../types/index.js';

interface CalendarProps {
  month: string;
  onMonthChange: (month: string) => void;
  onDateSelect?: (date: string) => void;
  transactions?: Transaction[];
}

interface DayData {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  income: number;
  expense: number;
}

export function Calendar({ month = new Date().toISOString().slice(0, 7), onMonthChange, onDateSelect, transactions = [] }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(month);
  const [days, setDays] = useState<DayData[]>([]);

  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  const getDaysInMonth = (dateString: string): DayData[] => {
    const parts = dateString.split('-').map(Number);
    const year = parts[0] ?? 0;
    const monthNum = parts[1] ?? 1;
    const firstDay = new Date(year, monthNum - 1, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const today = new Date();
    const todayString = today.toISOString().split('T')[0] ?? '';

    const result: DayData[] = [];

    for (let i = 0; i < 42; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const ds = d.toISOString().split('T')[0] ?? '';
      const day = d.getDate();
      const isCurrentMonth = d.getMonth() === (monthNum - 1);
      const isToday = ds === todayString;

      // Aggregate transactions for this date
      const dayTransactions = transactions.filter(t => t.date === ds);
      const income = dayTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      result.push({
        date: ds,
        day,
        isCurrentMonth,
        isToday,
        income,
        expense,
      });
    }

    return result;
  };

  useEffect(() => {
    setDays(getDaysInMonth(currentMonth));
  }, [currentMonth, transactions]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    const parts = currentMonth.split('-').map(Number);
    const y = parts[0] ?? 0;
    const m = parts[1] ?? 1;
    const newDate = new Date(y, m - 1 + (direction === 'next' ? 1 : -1));
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
    onMonthChange(newMonth);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
  };

  const handleDateClick = (dateString: string) => {
    if (onDateSelect) {
      onDateSelect(dateString);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth('prev')}
          className="text-gray-400 hover:text-white p-1"
          aria-label="이전 달"
        >
          ◀
        </button>
        <h3 className="text-base font-semibold">
          {formatDate(currentMonth + '-01')}
        </h3>
        <button
          onClick={() => navigateMonth('next')}
          className="text-gray-400 hover:text-white p-1"
          aria-label="다음 달"
        >
          ▶
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs text-gray-500 py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => (
          <div
            key={day.date}
            onClick={() => handleDateClick(day.date)}
            className={`cal-day rounded-lg p-2 h-20 border border-gray-800 cursor-pointer transition-colors ${
              day.isToday
                ? 'border-2 border-blue-500 bg-blue-500/5'
                : 'hover:bg-gray-800/50'
            } ${!day.isCurrentMonth ? 'opacity-30' : ''}`}
          >
            <div className="text-xs text-gray-400 mb-1">{day.day}</div>
            {day.expense > 0 && (
              <div className="text-xs text-red-400 truncate">
                -{day.expense.toLocaleString('ko-KR')}
              </div>
            )}
            {day.income > 0 && (
              <div className="text-xs text-blue-400 truncate">
                +{day.income.toLocaleString('ko-KR')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}