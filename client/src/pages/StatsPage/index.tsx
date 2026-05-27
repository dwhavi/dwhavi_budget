import { useState, useEffect, useCallback } from 'react';
import { SkeletonCard } from '@/components/Skeleton.tsx';
import { statsApi } from '@/api/stats.ts';
import { budgetApi } from '@/api/budgets.ts';
import { categoryApi } from '@/api/categories.ts';
import type { 
  MonthlyTrend, 
  CategoryStat, 
  Budget, 
  Category 
} from '@/types/index.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface StatsPageProps {
  month?: string;
}

export function StatsPage({ month = new Date().toLocaleDateString('sv-SE').slice(0, 7) }: StatsPageProps) {
  const [currentMonth, setCurrentMonth] = useState(month);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statsType, setStatsType] = useState<'income' | 'expense'>('expense');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pieColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#64748B'];

  const fetchStatsData = useCallback(async (monthToFetch: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [trendResponse, categoryResponse, budgetsResponse, categoriesResponse] = await Promise.all([
        statsApi.monthlyTrend(6).then((r) => r.data?.data),
        statsApi.categoryStats({ type: statsType, month: monthToFetch }).then((r) => r.data?.data),
        budgetApi.list(monthToFetch).then((r) => (r.data?.data as any)?.budgets || []),
        categoryApi.list().then((r) => (r.data?.data as any)?.categories || [])
      ]);

      setMonthlyTrend(trendResponse ?? []);
      setCategoryStats(categoryResponse ?? []);
      setBudgets(budgetsResponse ?? []);
      setCategories(categoriesResponse ?? []);
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [statsType]);

  useEffect(() => {
    fetchStatsData(currentMonth);
  }, [currentMonth, statsType, fetchStatsData]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const parts = currentMonth.split('-').map(Number);
    const y = parts[0] ?? 0;
    const m = parts[1] ?? 1;
    const newDate = new Date(y, m - 1 + (direction === 'next' ? 1 : -1));
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  const handleRetry = () => {
    fetchStatsData(currentMonth);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard className="w-full" />
          <SkeletonCard className="w-full" />
          <SkeletonCard className="w-full" />
        </div>
        <SkeletonCard className="w-full" />
        <SkeletonCard className="w-full" />
        <SkeletonCard className="w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-5 text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
          >
            재시도
          </button>
        </div>
      </div>
    );
  }

  if (!monthlyTrend.length && !categoryStats.length && !budgets.length) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
          <div className="text-gray-400">통계 데이터가 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation and Type Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => handleMonthChange('prev')}
            className="text-gray-400 hover:text-white p-2"
            aria-label="이전 달"
          >
            ◀
          </button>
          <h1 className="text-2xl font-bold text-gray-100">
            {currentMonth} 월 통계
          </h1>
          <button
            onClick={() => handleMonthChange('next')}
            className="text-gray-400 hover:text-white p-2"
            aria-label="다음 달"
          >
            ▶
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">유형:</span>
          <button
            onClick={() => setStatsType('income')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              statsType === 'income' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:text-gray-100'
            }`}
          >
            수입
          </button>
          <button
            onClick={() => setStatsType('expense')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
              statsType === 'expense' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:text-gray-100'
            }`}
          >
            지출
          </button>
        </div>
      </div>

      {/* Monthly Trend Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">월별 추이 (6개월)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month" 
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              stroke="#9CA3AF"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1F2937', 
                border: '1px solid #374151',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#F3F4F6' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: 12 }}
              iconType="rect"
            />
            <Bar 
              dataKey="income" 
              fill="#3B82F6" 
              name="수입"
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="expense" 
              fill="#EF4444" 
              name="지출"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Category Pie Chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">
          {statsType === 'income' ? '수입' : '지출'} 카테고리 분포
        </h3>
        {categoryStats.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryStats}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => `${props.percentage?.toFixed(1) ?? ''}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total"
              >
                {categoryStats.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px'
                }}
                labelStyle={{ color: '#F3F4F6' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center text-gray-400 py-8">
            해당 유형의 카테고리 데이터가 없습니다.
          </div>
        )}
      </div>

      {/* Budget Progress Section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">예산 진행 상황</h3>
        <div className="space-y-4">
          {budgets.map((budget) => {
            const category = categories.find(c => c.id === budget.category_id);
            const spent = categoryStats.find(s => s.category_id === budget.category_id)?.total ?? 0;
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            const barColor = percentage < 70 ? 'bg-green-500' : percentage < 90 ? 'bg-yellow-500' : 'bg-red-500';
            
            return (
              <div key={budget.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-300">
                    {category?.name ?? '기타'}
                  </span>
                  <span className="text-sm text-gray-400">
                    {spent.toLocaleString('ko-KR')}원 / {budget.amount.toLocaleString('ko-KR')}원
                    <span className="ml-2 text-xs">
                      ({percentage.toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${barColor}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}