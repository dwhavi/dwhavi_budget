import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/Modal.tsx';
import { TransactionForm } from '@/components/TransactionForm.tsx';
import { Calendar } from '@/components/Calendar.tsx';
import { SkeletonCard } from '@/components/Skeleton.tsx';
import { statsApi } from '@/api/stats.ts';
import { categoryApi } from '@/api/categories.ts';
import { paymentMethodApi } from '@/api/payment-methods.ts';
import type { 
  DashboardSummary, 
  MonthlyTrend, 
  Category, 
  Transaction, 
  PaymentMethod 
} from '@/types/index.js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardPageProps {
  month?: string;
}

interface SummaryCardProps {
  title: string;
  value: string;
  icon: string;
  color: string;
  subtext?: string;
}

interface TransactionRowProps {
  transaction: Transaction;
  categories: Category[];
}

interface CategoryRankingProps {
  category: {
    category_id: number;
    category_name: string;
    total: number;
    color: string;
  };
  totalExpense: number;
}

export function DashboardPage({ month = new Date().toISOString().slice(0, 7) }: DashboardPageProps) {
  const [currentMonth, setCurrentMonth] = useState(month);
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  const fetchDashboardData = useCallback(async (monthToFetch: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
const [dashboardResponse, trendResponse, categoriesResponse, paymentMethodsResponse] = await Promise.all([
  statsApi.dashboard(monthToFetch).then((r) => r.data?.data),
  statsApi.monthlyTrend(6).then((r) => r.data?.data),
  categoryApi.list().then((r) => r.data?.data),
  paymentMethodApi.list().then((r) => r.data?.data)
]);

      setDashboardData(dashboardResponse ?? null);
      setMonthlyTrend(trendResponse ?? []);
      setCategories(categoriesResponse ?? []);
      setPaymentMethods(paymentMethodsResponse ?? []);
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(currentMonth);
  }, [currentMonth, fetchDashboardData]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const parts = currentMonth.split('-').map(Number);
    const y = parts[0] ?? 0;
    const m = parts[1] ?? 1;
    const newDate = new Date(y, m - 1 + (direction === 'next' ? 1 : -1));
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
  };

  const handleTransactionSubmit = async () => {
    setIsTransactionModalOpen(false);
    fetchDashboardData(currentMonth);
  };

  const SummaryCard = ({ title, value, icon, color, subtext }: SummaryCardProps) => (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">{title}</span>
        <span className={`w-8 h-8 rounded-lg ${color}/10 flex items-center justify-center text-sm ${color}`}>
          {icon}
        </span>
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
    </div>
  );

const TransactionRow = ({ transaction, categories }: TransactionRowProps) => {
  const category = categories.find(c => c.id === transaction.category_id);
  const icon = category?.icon || '📝';
  const color = transaction.type === 'income' ? 'text-blue-400' : 'text-red-400';
  const amount = transaction.type === 'income' 
    ? `+${transaction.amount.toLocaleString('ko-KR')}` 
    : `-${transaction.amount.toLocaleString('ko-KR')}`;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50 cursor-pointer hover:bg-gray-800/70 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center text-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-100">
          {transaction.category_name ?? transaction.sub_category ?? '기타'}
        </div>
        <div className="text-xs text-gray-500">
          {transaction.date} · {transaction.payment_method_name ?? '기타'}
        </div>
      </div>
      <div className={`text-sm font-semibold ${color}`}>
        {amount}
      </div>
    </div>
  );
};

  const CategoryRanking = ({ category, totalExpense }: CategoryRankingProps) => {
    const percentage = totalExpense > 0 ? (category.total / totalExpense) * 100 : 0;
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">{category.category_name}</span>
          <span className="text-sm text-gray-400">
            {category.total.toLocaleString('ko-KR')}원 ({percentage.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${category.color}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SkeletonCard className="w-full" />
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
          <div className="text-red-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
          <div className="text-gray-400">데이터를 불러올 수 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Month Navigation and Transaction Button */}
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
            {currentMonth} 월 대시보드
          </h1>
          <button
            onClick={() => handleMonthChange('next')}
            className="text-gray-400 hover:text-white p-2"
            aria-label="다음 달"
          >
            ▶
          </button>
        </div>
        <button
          onClick={() => setIsTransactionModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          + 수입/지출 등록
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          title="총수입"
          value={`+${dashboardData.totalIncome.toLocaleString('ko-KR')}원`}
          icon="↑"
          color="text-blue-400"
          subtext="급여, 부수입"
        />
        <SummaryCard
          title="총지출"
          value={`-${dashboardData.totalExpense.toLocaleString('ko-KR')}원`}
          icon="↓"
          color="text-red-400"
          subtext={`${((dashboardData.totalExpense / dashboardData.totalIncome) * 100).toFixed(1)}% 사용`}
        />
        <SummaryCard
          title="잔액"
          value={`${dashboardData.balance.toLocaleString('ko-KR')}원`}
          icon="💰"
          color="text-green-400"
          subtext="이번 달 남은 금액"
        />
        <SummaryCard
          title="일일예상소비액"
          value={`${dashboardData.dailyAllowance.toLocaleString('ko-KR')}원`}
          icon="⚡"
          color="text-yellow-400"
          subtext="남은 일수 기준"
        />
      </div>

      {/* Calendar Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Transactions */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">최근 거래 내역</h3>
            <div className="space-y-3">
              {dashboardData.recentTransactions.slice(0, 5).map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  categories={categories}
                />
              ))}
            </div>
          </div>

          {/* Monthly Trend Chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">월별 추이 (6개월)</h3>
            <ResponsiveContainer width="100%" height={200}>
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
        </div>

        {/* Category Ranking */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">카테고리별 지출 순위</h3>
          {dashboardData.categoryRanking.map((category) => (
            <CategoryRanking
              key={category.category_id}
              category={category}
              totalExpense={dashboardData.totalExpense}
            />
          ))}
        </div>
      </div>

      {/* Calendar Widget */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <Calendar
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          transactions={dashboardData.recentTransactions}
        />
      </div>

      {/* Transaction Form Modal */}
      <Modal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        title="거래 등록"
      >
        <TransactionForm
          onSubmit={handleTransactionSubmit}
          onCancel={() => setIsTransactionModalOpen(false)}
          categories={categories}
          paymentMethods={paymentMethods}
        />
      </Modal>
    </div>
  );
}