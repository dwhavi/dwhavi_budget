import { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/Modal.tsx';
import { TransactionForm } from '@/components/TransactionForm.tsx';
import { ConfirmDialog } from '@/components/ConfirmDialog.tsx';
import { SkeletonCard } from '@/components/Skeleton.tsx';
import { transactionApi } from '@/api/transactions.ts';
import { categoryApi } from '@/api/categories.ts';
import { paymentMethodApi } from '@/api/payment-methods.ts';
import type {
  Transaction,
  TransactionListResponse,
  TransactionQueryParams,
  Category,
  PaymentMethod,
} from '@/types/index.js';
import { useToast } from '@/contexts/ToastContext.tsx';

interface TransactionsPageProps {
  month?: string;
}

interface FilterBarProps {
  filters: TransactionQueryParams;
  onFilterChange: (filters: TransactionQueryParams) => void;
  categories: Category[];
  paymentMethods: PaymentMethod[];
}

interface TransactionRowProps {
  transaction: Transaction;
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

interface PaginationProps {
  pagination: TransactionListResponse['pagination'];
  onPageChange: (page: number) => void;
}

const TransactionsPage = ({ month = new Date().toISOString().slice(0, 7) }: TransactionsPageProps) => {
  const [currentMonth, setCurrentMonth] = useState(month);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
const [filters, setFilters] = useState<TransactionQueryParams>({
  page: 1,
  limit: 20,
  type: undefined,
  category_id: undefined,
  payment_method_id: undefined,
  start_date: undefined,
  end_date: undefined,
  search: undefined,
});
  const [pagination, setPagination] = useState<TransactionListResponse['pagination']>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);
  const { addToast } = useToast();

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await transactionApi.list(filters);
      const data = response.data?.data;
      
      if (data) {
        setTransactions(data.transactions);
        setPagination(data.pagination);
      }
    } catch (err) {
      setError('거래 내역을 불러오는 중 오류가 발생했습니다.');
      addToast('거래 내역을 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filters, addToast]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await categoryApi.list();
      const data = response.data?.data;
      if (data) {
        setCategories(data);
      }
    } catch (err) {
      console.error('카테고리를 불러오는 중 오류가 발생했습니다:', err);
    }
  }, []);

  const fetchPaymentMethods = useCallback(async () => {
    try {
      const response = await paymentMethodApi.list();
      const data = response.data?.data;
      if (data) {
        setPaymentMethods(data);
      }
    } catch (err) {
      console.error('결제수단을 불러오는 중 오류가 발생했습니다:', err);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchCategories();
    fetchPaymentMethods();
  }, [fetchCategories, fetchPaymentMethods]);

  const handleFilterChange = (newFilters: TransactionQueryParams) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const parts = currentMonth.split('-').map(Number);
    const y = parts[0] ?? 0;
    const m = parts[1] ?? 1;
    const newDate = new Date(y, m - 1 + (direction === 'next' ? 1 : -1));
    const newMonth = `${newDate.getFullYear()}-${String(newDate.getMonth() + 1).padStart(2, '0')}`;
    setCurrentMonth(newMonth);
    setFilters({ ...filters, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleCreateSubmit = async () => {
    setIsCreateModalOpen(false);
    fetchTransactions();
  };

  const handleEditSubmit = async () => {
    setIsEditModalOpen(false);
    setEditingTransaction(null);
    fetchTransactions();
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleDelete = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingTransaction) {
      try {
        await transactionApi.delete(deletingTransaction.id);
        addToast('거래 내역이 삭제되었습니다.', 'success');
        fetchTransactions();
      } catch (err) {
        addToast('삭제 중 오류가 발생했습니다.', 'error');
      } finally {
        setIsDeleteModalOpen(false);
        setDeletingTransaction(null);
      }
    }
  };

  

  const FilterBar = ({ filters, onFilterChange, categories, paymentMethods }: FilterBarProps) => {
    const handleTypeChange = (type: 'income' | 'expense' | undefined) => {
      onFilterChange({ ...filters, type, page: 1 });
    };

    const handleCategoryChange = (categoryId: number | undefined) => {
      onFilterChange({ ...filters, category_id: categoryId, page: 1 });
    };

    const handlePaymentMethodChange = (paymentMethodId: number | undefined) => {
      onFilterChange({ ...filters, payment_method_id: paymentMethodId, page: 1 });
    };

    const handleSearchChange = (search: string) => {
      onFilterChange({ ...filters, search, page: 1 });
    };

    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">필터</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">유형</label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleTypeChange(e.target.value as 'income' | 'expense' | undefined)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="income">수입</option>
              <option value="expense">지출</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">카테고리</label>
            <select
              value={filters.category_id || ''}
              onChange={(e) => handleCategoryChange(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">결제수단</label>
            <select
              value={filters.payment_method_id || ''}
              onChange={(e) => handlePaymentMethodChange(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              {paymentMethods.map(method => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">검색</label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="키워드 검색"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    );
  };

  const TransactionRow = ({ transaction, categories, paymentMethods, onEdit, onDelete }: TransactionRowProps) => {
    const category = categories.find(c => c.id === transaction.category_id);
    const paymentMethod = paymentMethods.find(m => m.id === transaction.payment_method_id);
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
            {transaction.date} · {paymentMethod?.name ?? '기타'}
          </div>
        </div>
        <div className={`text-sm font-semibold ${color}`}>
          {amount}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(transaction)}
            className="text-gray-400 hover:text-blue-400 p-1"
            aria-label="수정"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(transaction)}
            className="text-gray-400 hover:text-red-400 p-1"
            aria-label="삭제"
          >
            🗑️
          </button>
        </div>
      </div>
    );
  };

  const Pagination = ({ pagination, onPageChange }: PaginationProps) => {
    return (
      <div className="flex items-center justify-between mt-6">
        <div className="text-sm text-gray-400">
          총 {pagination.total}개의 거래 내역
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
            disabled={pagination.page === 1}
            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>
          <span className="text-sm text-gray-400">
            {pagination.page} / {pagination.totalPages}
          </span>
          <button
            onClick={() => onPageChange(Math.min(pagination.totalPages, pagination.page + 1))}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
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
          <button
            onClick={fetchTransactions}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
          <div className="text-gray-400">거래 내역이 없습니다.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
            {currentMonth} 월 거래 내역
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
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          + 거래 등록
        </button>
      </div>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        categories={categories}
        paymentMethods={paymentMethods}
      />

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">거래 내역 목록</h3>
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              categories={categories}
              paymentMethods={paymentMethods}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      </div>

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="거래 등록"
      >
        <TransactionForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setIsCreateModalOpen(false)}
          categories={categories}
          paymentMethods={paymentMethods}
        />
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        title="거래 수정"
      >
        {editingTransaction && (
          <TransactionForm
            onSubmit={handleEditSubmit}
            onCancel={() => {
              setIsEditModalOpen(false);
              setEditingTransaction(null);
            }}
            initialData={{
              type: editingTransaction.type,
              amount: editingTransaction.amount,
              category_id: editingTransaction.category_id,
              payment_method_id: editingTransaction.payment_method_id,
              date: editingTransaction.date,
              sub_category: editingTransaction.sub_category,
              memo: editingTransaction.memo,
            }}
            categories={categories}
            paymentMethods={paymentMethods}
          />
        )}
      </Modal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingTransaction(null);
        }}
        onConfirm={handleConfirmDelete}
        title="거래 삭제"
        message="이 거래 내역을 삭제하시겠습니까? (소프트 삭제됩니다)"
        variant="danger"
      />
    </div>
  );
};

export default TransactionsPage;