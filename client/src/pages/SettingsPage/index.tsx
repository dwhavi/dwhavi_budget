import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext.tsx';
import { Modal } from '@/components/Modal.tsx';
import { ConfirmDialog } from '@/components/ConfirmDialog.tsx';
import { SkeletonCard } from '@/components/Skeleton.tsx';
import { CurrencyInput } from '@/components/CurrencyInput.tsx';
import { paymentMethodApi } from '@/api/payment-methods.ts';
import { budgetApi } from '@/api/budgets.ts';
import { recurringExpenseApi } from '@/api/recurring-expenses.ts';
import { categoryApi } from '@/api/categories.ts';
import type {
  PaymentMethod,
  PaymentMethodCreateRequest,
  PaymentMethodUpdateRequest,
  Budget,
  BudgetUpsertRequest,
  RecurringExpense,
  RecurringExpenseCreateRequest,
  RecurringExpenseUpdateRequest,
  Category,
} from '@/types/index.js';

interface SettingsPageProps { }

export function SettingsPage({ }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<'payment-methods' | 'budgets' | 'recurring-expenses'>('payment-methods');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  // Payment Methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // Budgets state
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toLocaleDateString('sv-SE').slice(0, 7));
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [showBudgetDeleteConfirm, setShowBudgetDeleteConfirm] = useState<number | null>(null);

  // Recurring Expenses state
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);
  const [showRecurringExpenseModal, setShowRecurringExpenseModal] = useState(false);
  const [editingRecurringExpense, setEditingRecurringExpense] = useState<RecurringExpense | null>(null);
  const [showRecurringExpenseDeleteConfirm, setShowRecurringExpenseDeleteConfirm] = useState<number | null>(null);

  // Categories for dropdowns
  const [categories, setCategories] = useState<Category[]>([]);
  const [paymentMethodsList, setPaymentMethodsList] = useState<PaymentMethod[]>([]);

  // Color picker options
  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
    '#6366F1', '#14B8A6', '#F97316', '#64748B'
  ];

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [paymentMethodsData, budgetsData, recurringExpensesData, categoriesData] = await Promise.all([
        paymentMethodApi.list().then(res => (res.data.data as any).paymentMethods || []),
        budgetApi.list(currentMonth).then(res => (res.data.data as any).budgets || []),
        recurringExpenseApi.list().then(res => (res.data.data as any).expenses || []),
        categoryApi.list().then(res => (res.data.data as any).categories || []),
      ]);

      setPaymentMethods(paymentMethodsData);
      setBudgets(budgetsData);
      setRecurringExpenses(recurringExpensesData);
      setCategories(categoriesData);
      setPaymentMethodsList(paymentMethodsData);
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      addToast('데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentMonth, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Payment Methods functions
  const handleSavePaymentMethod = async (data: PaymentMethodCreateRequest | PaymentMethodUpdateRequest, id?: number) => {
    try {
      if (id) {
        const updated = await paymentMethodApi.update(id, data as PaymentMethodUpdateRequest);
        setPaymentMethods(prev => prev.map(pm => pm.id === id ? (updated.data.data as any).paymentMethod : pm));
        addToast('결제 수단이 업데이트되었습니다.', 'success');
      } else {
        const created = await paymentMethodApi.create(data as PaymentMethodCreateRequest);
        setPaymentMethods(prev => [...prev, (created.data.data as any).paymentMethod]);
        addToast('새로운 결제 수단이 추가되었습니다.', 'success');
      }
      setShowPaymentMethodModal(false);
      setEditingPaymentMethod(null);
    } catch (err) {
      addToast('저장 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDeletePaymentMethod = async (id: number) => {
    try {
      await paymentMethodApi.delete(id);
      setPaymentMethods(prev => prev.filter(pm => pm.id !== id));
      setShowDeleteConfirm(null);
      addToast('결제 수단이 삭제되었습니다.', 'success');
    } catch (err) {
      addToast('삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  // Budgets functions
  const handleSaveBudget = async (data: BudgetUpsertRequest, customCategoryName?: string) => {
    try {
      let categoryId = data.category_id;
      if (categoryId === -1 && customCategoryName) {
        const catRes = await categoryApi.create({ name: customCategoryName, type: 'expense' });
        const newCategory = (catRes.data.data as any).category;
        setCategories(prev => [...prev, newCategory]);
        categoryId = newCategory.id;
        data.category_id = categoryId;
      }

      const created = await budgetApi.upsert(data);
      const allBudgets = (created.data.data as any).budgets || [];
      // 현재 선택된 월(currentMonth)의 데이터만 필터링하여 상태에 반영
      setBudgets(allBudgets.filter((b: Budget) => b.month === data.month));
      setShowBudgetModal(false);
      setEditingBudget(null);
      addToast('예산이 저장되었습니다.', 'success');
    } catch (err) {
      addToast('저장 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDeleteBudget = async (id: number) => {
    try {
      await budgetApi.delete(id);
      setBudgets(prev => prev.filter(b => b.id !== id));
      setShowBudgetDeleteConfirm(null);
      addToast('예산이 삭제되었습니다.', 'success');
    } catch (err) {
      addToast('삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  // Recurring Expenses functions
  const handleSaveRecurringExpense = async (data: RecurringExpenseCreateRequest | RecurringExpenseUpdateRequest, id?: number, customCategoryName?: string) => {
    try {
      let categoryId = data.category_id;
      if (categoryId === -1 && customCategoryName) {
        const catRes = await categoryApi.create({ name: customCategoryName, type: 'expense' });
        const newCategory = (catRes.data.data as any).category;
        setCategories(prev => [...prev, newCategory]);
        categoryId = newCategory.id;
        data.category_id = categoryId;
      }

      if (id) {
        const updated = await recurringExpenseApi.update(id, data as RecurringExpenseUpdateRequest);
        setRecurringExpenses(prev => prev.map(re => re.id === id ? (updated.data.data as any).expense : re));
        addToast('고정비가 업데이트되었습니다.', 'success');
      } else {
        const created = await recurringExpenseApi.create(data as RecurringExpenseCreateRequest);
        setRecurringExpenses(prev => [...prev, (created.data.data as any).expense]);
        addToast('새로운 고정비가 추가되었습니다.', 'success');
      }
      setShowRecurringExpenseModal(false);
      setEditingRecurringExpense(null);
    } catch (err) {
      addToast('저장 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDeleteRecurringExpense = async (id: number) => {
    try {
      await recurringExpenseApi.delete(id);
      setRecurringExpenses(prev => prev.filter(re => re.id !== id));
      setShowRecurringExpenseDeleteConfirm(null);
      addToast('고정비가 삭제되었습니다.', 'success');
    } catch (err) {
      addToast('삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleToggleRecurringExpense = async (id: number, is_active: boolean) => {
    try {
      await recurringExpenseApi.update(id, { is_active });
      setRecurringExpenses(prev => prev.map(re => re.id === id ? { ...re, is_active } : re));
      addToast(is_active ? '고정비가 활성화되었습니다.' : '고정비가 비활성화되었습니다.', 'success');
    } catch (err) {
      addToast('상태 변경 중 오류가 발생했습니다.', 'error');
    }
  };

  const getTabContent = () => {
    if (loading) {
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
          <div className="bg-red-900/20 border border-red-700 rounded-xl p-5">
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'payment-methods':
        return <PaymentMethodsTab />;
      case 'budgets':
        return <BudgetsTab />;
      case 'recurring-expenses':
        return <RecurringExpensesTab />;
      default:
        return null;
    }
  };

  const PaymentMethodsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">결제 수단 관리</h3>
        <button
          onClick={() => {
            setEditingPaymentMethod(null);
            setShowPaymentMethodModal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          + 새로운 결제 수단
        </button>
      </div>

      {paymentMethods.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl p-8 text-center">
          <p className="text-gray-400 mb-4">등록된 결제 수단이 없습니다.</p>
          <button
            onClick={() => setShowPaymentMethodModal(true)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition"
          >
            첫 번째 결제 수단 추가
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map(pm => (
            <div key={pm.id} className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: pm.color || '#6B7280' }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-100 font-medium">{pm.name}</span>
                    {pm.is_default && (
                      <span className="px-2 py-1 bg-blue-600 text-xs text-white rounded-full">기본</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    {pm.issuer && <span>{pm.issuer}</span>}
                    <span className="mx-1">·</span>
                    <span>{pm.type === 'credit' ? '신용카드' : pm.type === 'debit' ? '체크카드' : pm.type === 'cash' ? '현금' : '이체'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingPaymentMethod(pm);
                    setShowPaymentMethodModal(true);
                  }}
                  className="px-3 py-1 text-gray-400 hover:text-gray-200 transition"
                >
                  수정
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(pm.id)}
                  className="px-3 py-1 text-red-400 hover:text-red-300 transition"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <PaymentMethodModal />
      <DeleteConfirmDialog />
    </div>
  );

  const BudgetsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const date = new Date(currentMonth + '-01');
              date.setMonth(date.getMonth() - 1);
              setCurrentMonth(date.toISOString().slice(0, 7));
            }}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition"
          >
            &lt;
          </button>
          <h3 className="text-lg font-semibold text-gray-100">{currentMonth} 예산 설정</h3>
          <button
            onClick={() => {
              const date = new Date(currentMonth + '-01');
              date.setMonth(date.getMonth() + 1);
              setCurrentMonth(date.toISOString().slice(0, 7));
            }}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition"
          >
            &gt;
          </button>
        </div>
        <button
          onClick={() => {
            setEditingBudget(null);
            setShowBudgetModal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          + 예산 추가
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl p-8 text-center">
          <p className="text-gray-400 mb-4">예산이 설정되지 않았습니다.</p>
          <button
            onClick={() => setShowBudgetModal(true)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition"
          >
            첫 번째 예산 추가
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map(budget => (
            <div key={budget.id} className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: budget.category?.color || '#6B7280' }}
                >
                  {budget.category?.icon || '📊'}
                </div>
                <div>
                  <div className="text-gray-100 font-medium">{budget.category?.name}</div>
                  <div className="text-sm text-gray-400">예산: {budget.amount.toLocaleString()}원</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingBudget(budget);
                    setShowBudgetModal(true);
                  }}
                  className="px-3 py-1 text-gray-400 hover:text-gray-200 transition"
                >
                  수정
                </button>
                <button
                  onClick={() => setShowBudgetDeleteConfirm(budget.id)}
                  className="px-3 py-1 text-red-400 hover:text-red-300 transition"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <BudgetModal />
      <BudgetDeleteConfirmDialog />
    </div>
  );

  const RecurringExpensesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">고정비 관리</h3>
        <button
          onClick={() => {
            setEditingRecurringExpense(null);
            setShowRecurringExpenseModal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          + 새로운 고정비
        </button>
      </div>

      {recurringExpenses.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl p-8 text-center">
          <p className="text-gray-400 mb-4">등록된 고정비가 없습니다.</p>
          <button
            onClick={() => setShowRecurringExpenseModal(true)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition"
          >
            첫 번째 고정비 추가
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {recurringExpenses.map(re => (
            <div key={re.id} className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-100 font-medium">{re.name}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${re.is_active ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                      {re.is_active ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRecurringExpense(re.id, !re.is_active)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition ${re.is_active
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                  >
                    {re.is_active ? '비활성화' : '활성화'}
                  </button>
                  <button
                    onClick={() => {
                      setEditingRecurringExpense(re);
                      setShowRecurringExpenseModal(true);
                    }}
                    className="px-3 py-1 text-gray-400 hover:text-gray-200 transition"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => setShowRecurringExpenseDeleteConfirm(re.id)}
                    className="px-3 py-1 text-red-400 hover:text-red-300 transition"
                  >
                    삭제
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-400 ml-16">
                {re.amount.toLocaleString()}원 · {re.category_id} · {re.payment_method_id} ·
                {re.start_date} ~ {re.end_date || '무기한'}
              </div>
            </div>
          ))}
        </div>
      )}

      <RecurringExpenseModal />
      <RecurringExpenseDeleteConfirmDialog />
    </div>
  );

  const PaymentMethodModal = () => (
    <Modal
      isOpen={showPaymentMethodModal}
      onClose={() => {
        setShowPaymentMethodModal(false);
        setEditingPaymentMethod(null);
      }}
      title={editingPaymentMethod ? '결제 수단 수정' : '새로운 결제 수단'}
    >
      <PaymentMethodForm
        onSave={handleSavePaymentMethod}
        onCancel={() => {
          setShowPaymentMethodModal(false);
          setEditingPaymentMethod(null);
        }}
        initialData={editingPaymentMethod ?? undefined}
        colorOptions={colorOptions}

      />
    </Modal>
  );

  const DeleteConfirmDialog = () => (
    <ConfirmDialog
      isOpen={showDeleteConfirm !== null}
      onClose={() => setShowDeleteConfirm(null)}
      onConfirm={() => showDeleteConfirm && handleDeletePaymentMethod(showDeleteConfirm)}
      title="결제 수단 삭제"
      message="이 결제 수단을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      variant="danger"
    />
  );

  const BudgetModal = () => (
    <Modal
      isOpen={showBudgetModal}
      onClose={() => {
        setShowBudgetModal(false);
        setEditingBudget(null);
      }}
      title={editingBudget ? '예산 수정' : '예산 추가'}
    >
      <BudgetForm
        onSave={handleSaveBudget}
        onCancel={() => {
          setShowBudgetModal(false);
          setEditingBudget(null);
        }}
        initialData={editingBudget ?? undefined}
        categories={categories}
        currentMonth={currentMonth}
      />
    </Modal>
  );

  const BudgetDeleteConfirmDialog = () => (
    <ConfirmDialog
      isOpen={showBudgetDeleteConfirm !== null}
      onClose={() => setShowBudgetDeleteConfirm(null)}
      onConfirm={() => showBudgetDeleteConfirm && handleDeleteBudget(showBudgetDeleteConfirm)}
      title="예산 삭제"
      message="이 예산을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      variant="danger"
    />
  );

  const RecurringExpenseModal = () => (
    <Modal
      isOpen={showRecurringExpenseModal}
      onClose={() => {
        setShowRecurringExpenseModal(false);
        setEditingRecurringExpense(null);
      }}
      title={editingRecurringExpense ? '고정비 수정' : '새로운 고정비'}
    >
      <RecurringExpenseForm
        onSave={handleSaveRecurringExpense}
        onCancel={() => {
          setShowRecurringExpenseModal(false);
          setEditingRecurringExpense(null);
        }}
        initialData={editingRecurringExpense ?? undefined}
        categories={categories}
        paymentMethods={paymentMethodsList}
      />
    </Modal>
  );

  const RecurringExpenseDeleteConfirmDialog = () => (
    <ConfirmDialog
      isOpen={showRecurringExpenseDeleteConfirm !== null}
      onClose={() => setShowRecurringExpenseDeleteConfirm(null)}
      onConfirm={() => showRecurringExpenseDeleteConfirm && handleDeleteRecurringExpense(showRecurringExpenseDeleteConfirm)}
      title="고정비 삭제"
      message="이 고정비를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      variant="danger"
    />
  );

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">설정</h3>

        <div className="flex gap-1 bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('payment-methods')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${activeTab === 'payment-methods'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            카드 관리
          </button>
          <button
            onClick={() => setActiveTab('budgets')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${activeTab === 'budgets'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            예산 설정
          </button>
          <button
            onClick={() => setActiveTab('recurring-expenses')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${activeTab === 'recurring-expenses'
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            고정비 관리
          </button>
        </div>

        {getTabContent()}
      </div>
    </div>
  );
}

// Form components (will be implemented in subsequent steps)
function PaymentMethodForm({
  onSave,
  onCancel,
  initialData,
  colorOptions,
}: {
  onSave: (data: PaymentMethodCreateRequest | PaymentMethodUpdateRequest, id?: number) => void;
  onCancel: () => void;
  initialData?: PaymentMethod;
  colorOptions: string[];
}) {
  const [formData, setFormData] = useState<PaymentMethodCreateRequest>({
    name: '',
    issuer: '',
    type: 'credit',
    color: '#3B82F6',
    is_default: false,
    memo: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        issuer: initialData.issuer || '',
        type: initialData.type,
        color: initialData.color || '#3B82F6',
        is_default: initialData.is_default,
        memo: initialData.memo || '',
      });
    } else {
      setFormData({
        name: '',
        issuer: '',
        type: 'credit',
        color: '#3B82F6',
        is_default: false,
        memo: '',
      });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, initialData?.id);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">이름</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">발급사</label>
        <input
          type="text"
          value={formData.issuer}
          onChange={(e) => setFormData({ ...formData, issuer: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">유형</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as 'credit' | 'debit' | 'cash' | 'transfer' })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
        >
          <option value="credit">신용카드</option>
          <option value="debit">체크카드</option>
          <option value="cash">현금</option>
          <option value="transfer">이체</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">색상</label>
        <div className="flex gap-2 flex-wrap">
          {colorOptions.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`w-8 h-8 rounded-full border-2 transition ${formData.color === color ? 'border-white' : 'border-gray-600'
                }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_default"
          checked={formData.is_default}
          onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
          className="mr-2"
        />
        <label htmlFor="is_default" className="text-sm text-gray-300">기본 결제 수단으로 설정</label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">메모</label>
        <textarea
          value={formData.memo}
          onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          저장
        </button>
      </div>
    </form>
  );
}

function BudgetForm({
  onSave,
  onCancel,
  initialData,
  categories,
  currentMonth,
}: {
  onSave: (data: BudgetUpsertRequest, customCategoryName?: string) => void;
  onCancel: () => void;
  initialData?: Budget;
  categories: Category[];
  currentMonth: string;
}) {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    if (initialData) {
      setSelectedCategory(initialData.category_id);
      setAmount(initialData.amount);
    } else {
      setSelectedCategory(null);
      setAmount(0);
    }
  }, [initialData]);

  const isDuplicate = selectedCategory === -1 && categories.some(
    cat => cat.type === 'expense' && cat.name.trim() === customCategoryName.trim()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicate) return;
    if (selectedCategory && amount) {
      onSave({
        category_id: selectedCategory,
        month: currentMonth,
        amount: amount,
      }, selectedCategory === -1 ? customCategoryName : undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">지출 카테고리</label>
        <select
          value={selectedCategory || ''}
          onChange={(e) => {
             const val = parseInt(e.target.value);
             setSelectedCategory(val);
             if (val !== -1) setCustomCategoryName('');
          }}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
          required
        >
          <option value="" disabled>카테고리 선택</option>
          <option value={-1}>직접 입력</option>
          {categories.filter(cat => cat.type === 'expense').map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {selectedCategory === -1 && (
          <div className="mt-2 text-sm">
            <input
               type="text"
               value={customCategoryName}
               onChange={(e) => setCustomCategoryName(e.target.value)}
               className={`w-full px-3 py-2 bg-gray-700 border ${isDuplicate ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-500'} rounded-lg text-gray-100 focus:outline-none`}
               placeholder="새 카테고리 이름"
               required
            />
            {isDuplicate && (
              <p className="mt-1 text-red-400 text-xs text-left">동일한 카테고리는 추가 할 수 없습니다.</p>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">예산 금액</label>
        <CurrencyInput
          value={amount}
          onChange={(val) => setAmount(val)}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
          placeholder="0"
          required
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          저장
        </button>
      </div>
    </form>
  );
}

function RecurringExpenseForm({
  onSave,
  onCancel,
  initialData,
  categories,
  paymentMethods,
}: {
  onSave: (data: RecurringExpenseCreateRequest | RecurringExpenseUpdateRequest, id?: number, customCategoryName?: string) => void;
  onCancel: () => void;
  initialData?: RecurringExpense;
  categories: Category[];
  paymentMethods: PaymentMethod[];
}) {
  const [formData, setFormData] = useState<RecurringExpenseCreateRequest>({
    name: '',
    amount: 0,
    category_id: 0,
    payment_method_id: 0,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: undefined,
    memo: '',
  });
  const [customCategoryName, setCustomCategoryName] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        amount: initialData.amount,
        category_id: initialData.category_id,
        payment_method_id: initialData.payment_method_id,
        start_date: initialData.start_date,
        end_date: initialData.end_date || undefined,
        memo: initialData.memo || '',
      });
    } else {
      setFormData({
        name: '',
        amount: 0,
        category_id: 0,
        payment_method_id: 0,
        start_date: new Date().toISOString().slice(0, 10),
        end_date: undefined,
        memo: '',
      });
    }
  }, [initialData]);

  const isDuplicate = formData.category_id === -1 && categories.some(
    cat => cat.type === 'expense' && cat.name.trim() === customCategoryName.trim()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicate) return;
    onSave(formData, initialData?.id, formData.category_id === -1 ? customCategoryName : undefined);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">이름</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">금액</label>
        <CurrencyInput
          value={formData.amount}
          onChange={(val) => setFormData({ ...formData, amount: val })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">카테고리</label>
        <select
          value={formData.category_id === 0 ? '' : formData.category_id}
          onChange={(e) => {
             const val = parseInt(e.target.value) || 0;
             setFormData({ ...formData, category_id: val });
             if (val !== -1) setCustomCategoryName('');
          }}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
          required
        >
          <option value="" disabled>카테고리 선택</option>
          <option value={-1}>직접 입력</option>
          {categories.filter(cat => cat.type === 'expense').map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        {formData.category_id === -1 && (
          <div className="mt-2 text-sm">
            <input
               type="text"
               value={customCategoryName}
               onChange={(e) => setCustomCategoryName(e.target.value)}
               className={`w-full px-3 py-2 bg-gray-700 border ${isDuplicate ? 'border-red-500 focus:border-red-500' : 'border-gray-600 focus:border-blue-500'} rounded-lg text-gray-100 focus:outline-none`}
               placeholder="새 카테고리 이름"
               required
            />
            {isDuplicate && (
               <p className="mt-1 text-red-400 text-xs text-left">동일한 카테고리는 추가 할 수 없습니다.</p>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">결제 수단</label>
        <select
          value={formData.payment_method_id || ''}
          onChange={(e) => setFormData({ ...formData, payment_method_id: parseInt(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
          required
        >
          <option value="" disabled>결제 수단 선택</option>
          {paymentMethods.map(pm => (
            <option key={pm.id} value={pm.id}>
              {pm.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">시작일</label>
        <input
          type="date"
          value={formData.start_date}
          onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">종료일 (선택 사항)</label>
        <input
          type="date"
          value={formData.end_date || ''}
          onChange={(e) => setFormData({ ...formData, end_date: e.target.value || undefined })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">메모</label>
        <textarea
          value={formData.memo}
          onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition"
        >
          취소
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          저장
        </button>
      </div>
    </form>
  );
}