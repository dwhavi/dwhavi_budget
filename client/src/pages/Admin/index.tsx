import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/contexts/ToastContext.tsx';
import { Modal } from '@/components/Modal.tsx';
import { ConfirmDialog } from '@/components/ConfirmDialog.tsx';
import { SkeletonCard } from '@/components/Skeleton.tsx';
import { adminApi } from '@/api/admin.ts';
import { categoryApi } from '@/api/categories.ts';
import type {
  AdminUser,
  SystemSettings,
  SystemSummary,
  Category,
} from '@/types/index.js';

interface AdminPageProps { }

export function AdminPage({ }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'categories' | 'settings'>('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  // System Summary state
  const [summary, setSummary] = useState<SystemSummary | null>(null);

  // Users state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCategoryDeleteConfirm, setShowCategoryDeleteConfirm] = useState<number | null>(null);

  // Settings state
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Color options for categories
  const colorOptions = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899',
    '#6366F1', '#14B8A6', '#F97316', '#64748B'
  ];

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, usersData, categoriesData, settingsData] = await Promise.all([
        adminApi.getSummary().then(res => res.data.data?.summary || null),
        adminApi.listUsers().then(res => res.data.data?.users || []),
        categoryApi.list().then(res => res.data.data?.categories || []),
        adminApi.getSettings().then(res => res.data.data?.settings || null),
      ]);

      setSummary(summaryData);
      setUsers(usersData);
      setCategories(categoriesData);
      setSettings(settingsData);
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      addToast('데이터를 불러오는 중 오류가 발생했습니다.', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Users functions
  const handleSaveUser = async (data: Partial<Pick<AdminUser, 'display_name' | 'role' | 'is_active'>>, id?: number) => {
    try {
      if (id) {
        const updated = await adminApi.updateUser(id, data);
        setUsers(prev => prev.map(user => user.id === id ? (updated.data.data || user) : user));
        addToast('사용자 정보가 업데이트되었습니다.', 'success');
      }
      setShowUserModal(false);
      setEditingUser(null);
    } catch (err) {
      addToast('저장 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await adminApi.deleteUser(id);
      setUsers(prev => prev.filter(user => user.id !== id));
      setShowDeleteConfirm(null);
      addToast('사용자가 삭제되었습니다.', 'success');
    } catch (err) {
      addToast('삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  // Categories functions
  const handleSaveCategory = async (data: Category, id?: number) => {
    try {
      if (id) {
        const updated = await categoryApi.update(id, data);
        setCategories(prev => prev.map(cat => cat.id === id ? (updated.data.data || cat) : cat));
        addToast('카테고리가 업데이트되었습니다.', 'success');
      } else {
        const created = await categoryApi.create(data);
        setCategories(prev => [...prev, created.data.data].filter((item): item is Category => item !== undefined && item !== null));
        addToast('새로운 카테고리가 추가되었습니다.', 'success');
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
    } catch (err) {
      addToast('저장 중 오류가 발생했습니다.', 'error');
    }
  };

  const handleDeleteCategory = async (id: number) => {
    try {
      await categoryApi.delete(id);
      setCategories(prev => prev.filter(cat => cat.id !== id));
      setShowCategoryDeleteConfirm(null);
      addToast('카테고리가 삭제되었습니다.', 'success');
    } catch (err) {
      addToast('삭제 중 오류가 발생했습니다.', 'error');
    }
  };

  // Settings functions
  const handleSaveSettings = async (data: Partial<SystemSettings>) => {
    try {
      const updated = await adminApi.updateSettings(data);
      setSettings(updated.data.data || null);
      addToast('시스템 설정이 업데이트되었습니다.', 'success');
      setShowSettingsModal(false);
    } catch (err) {
      addToast('저장 중 오류가 발생했습니다.', 'error');
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
      case 'users':
        return <UsersTab />;
      case 'categories':
        return <CategoriesTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return null;
    }
  };

  const UsersTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">사용자 관리</h3>
      </div>

      {users.length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl p-8 text-center">
          <p className="text-gray-400 mb-4">등록된 사용자가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(user => (
            <div key={user.id} className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg">
                  {user.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-100 font-medium">{user.email}</span>
                    <span className="text-sm text-gray-400">{user.display_name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300'
                      }`}>
                      {user.role === 'admin' ? '관리자' : '사용자'}
                    </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${user.is_active
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                      }`}>
                      {user.is_active ? '활성' : '비활성'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    가입일: {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingUser(user);
                    setShowUserModal(true);
                  }}
                  className="px-3 py-1 text-gray-400 hover:text-gray-200 transition"
                >
                  수정
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(user.id)}
                  className="px-3 py-1 text-red-400 hover:text-red-300 transition"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <UserModal />
      <DeleteConfirmDialog />
    </div>
  );

  const CategoriesTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">전역 카테고리 관리</h3>
        <button
          onClick={() => {
            setEditingCategory(null);
            setShowCategoryModal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
        >
          + 새로운 카테고리
        </button>
      </div>

      {categories.filter(cat => cat.user_id === null).length === 0 ? (
        <div className="bg-gray-800/50 rounded-xl p-8 text-center">
          <p className="text-gray-400 mb-4">전역 카테고리가 없습니다.</p>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition"
          >
            첫 번째 카테고리 추가
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {categories.filter(cat => cat.user_id === null).map(cat => (
            <div key={cat.id} className="bg-gray-800/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: cat.color || '#6B7280' }}
                >
                  {cat.icon || '📊'}
                </div>
                <div>
                  <div className="text-gray-100 font-medium">{cat.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${cat.type === 'income'
                        ? 'bg-blue-600 text-white'
                        : 'bg-red-600 text-white'
                      }`}>
                      {cat.type === 'income' ? '수입' : '지출'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingCategory(cat);
                    setShowCategoryModal(true);
                  }}
                  className="px-3 py-1 text-gray-400 hover:text-gray-200 transition"
                >
                  수정
                </button>
                <button
                  onClick={() => setShowCategoryDeleteConfirm(cat.id)}
                  className="px-3 py-1 text-red-400 hover:text-red-300 transition"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryModal />
      <CategoryDeleteConfirmDialog />
    </div>
  );

  const SettingsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-100">시스템 설정</h3>
      </div>

      {settings ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">앱 이름</label>
            <input
              type="text"
              value={settings.app_name}
              onChange={(e) => setSettings(prev => prev ? { ...prev, app_name: e.target.value } : null)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">예산 경고 임계값 (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={settings.budget_alert_threshold}
              onChange={(e) => setSettings(prev => prev ? { ...prev, budget_alert_threshold: parseInt(e.target.value) } : null)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">기본 통화</label>
            <input
              type="text"
              value={settings.default_currency}
              onChange={(e) => setSettings(prev => prev ? { ...prev, default_currency: e.target.value } : null)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            설정 저장
          </button>
        </div>
      ) : (
        <div className="bg-gray-800/50 rounded-xl p-8 text-center">
          <p className="text-gray-400">설정을 불러오는 중...</p>
        </div>
      )}

      <SettingsModal />
    </div>
  );

  const UserModal = () => (
    <Modal
      isOpen={showUserModal}
      onClose={() => {
        setShowUserModal(false);
        setEditingUser(null);
      }}
      title={editingUser ? '사용자 정보 수정' : '사용자 정보'}
    >
      <div className="space-y-4">
        {editingUser && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">이메일</label>
              <input
                type="email"
                value={editingUser.email}
                disabled
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">이름</label>
              <input
                type="text"
                value={editingUser.display_name}
                onChange={(e) => setEditingUser(prev => prev ? { ...prev, display_name: e.target.value } : null)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">역할</label>
              <select
                value={editingUser.role}
                onChange={(e) => setEditingUser(prev => prev ? { ...prev, role: e.target.value } : null)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
              >
                <option value="admin">관리자</option>
                <option value="user">사용자</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">상태</label>
              <select
                value={editingUser.is_active ? 'active' : 'inactive'}
                onChange={(e) => setEditingUser(prev => prev ? { ...prev, is_active: e.target.value === 'active' } : null)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
              >
                <option value="active">활성</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
          </>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setShowUserModal(false);
              setEditingUser(null);
            }}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => editingUser && handleSaveUser({
              display_name: editingUser.display_name,
              role: editingUser.role,
              is_active: editingUser.is_active
            }, editingUser.id)}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            저장
          </button>
        </div>
      </div>
    </Modal>
  );

  const DeleteConfirmDialog = () => (
    <ConfirmDialog
      isOpen={showDeleteConfirm !== null}
      onClose={() => setShowDeleteConfirm(null)}
      onConfirm={() => showDeleteConfirm && handleDeleteUser(showDeleteConfirm)}
      title="사용자 삭제"
      message="이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      variant="danger"
    />
  );

  const CategoryModal = () => (
    <Modal
      isOpen={showCategoryModal}
      onClose={() => {
        setShowCategoryModal(false);
        setEditingCategory(null);
      }}
      title={editingCategory ? '카테고리 수정' : '새로운 카테고리'}
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">이름</label>
          <input
            type="text"
            value={editingCategory?.name || ''}
            onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            placeholder="카테고리 이름"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">유형</label>
          <select
            value={editingCategory?.type || 'expense'}
            onChange={(e) => setEditingCategory(prev => prev ? { ...prev, type: e.target.value as 'income' | 'expense' } : null)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
          >
            <option value="income">수입</option>
            <option value="expense">지출</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">아이콘</label>
          <input
            type="text"
            value={editingCategory?.icon || ''}
            onChange={(e) => setEditingCategory(prev => prev ? { ...prev, icon: e.target.value } : null)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            placeholder="아이콘 (예: 🍔, 💼)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">색상</label>
          <div className="flex gap-2 flex-wrap">
            {colorOptions.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => setEditingCategory(prev => prev ? { ...prev, color } : null)}
                className={`w-8 h-8 rounded-full border-2 transition ${editingCategory?.color === color ? 'border-white' : 'border-gray-600'
                  }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">정렬 순서</label>
          <input
            type="number"
            value={editingCategory?.sort_order || 0}
            onChange={(e) => setEditingCategory(prev => prev ? { ...prev, sort_order: parseInt(e.target.value) || 0 } : null)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
            min="0"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => {
              setShowCategoryModal(false);
              setEditingCategory(null);
            }}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => editingCategory && handleSaveCategory(editingCategory, editingCategory.id)}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            저장
          </button>
        </div>
      </div>
    </Modal>
  );

  const CategoryDeleteConfirmDialog = () => (
    <ConfirmDialog
      isOpen={showCategoryDeleteConfirm !== null}
      onClose={() => setShowCategoryDeleteConfirm(null)}
      onConfirm={() => showCategoryDeleteConfirm && handleDeleteCategory(showCategoryDeleteConfirm)}
      title="카테고리 삭제"
      message="이 카테고리를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
      variant="danger"
    />
  );

  const SettingsModal = () => (
    <Modal
      isOpen={showSettingsModal}
      onClose={() => setShowSettingsModal(false)}
      title="시스템 설정 저장"
    >
      <div className="space-y-4">
        <p className="text-gray-300">아래 설정을 저장하시겠습니까?</p>

        {settings && (
          <div className="bg-gray-800/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">앱 이름:</span>
              <span className="text-gray-100">{settings.app_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">예산 경고 임계값:</span>
              <span className="text-gray-100">{settings.budget_alert_threshold}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">기본 통화:</span>
              <span className="text-gray-100">{settings.default_currency}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={() => setShowSettingsModal(false)}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition"
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => settings && handleSaveSettings({
              app_name: settings.app_name,
              budget_alert_threshold: settings.budget_alert_threshold,
              default_currency: settings.default_currency
            })}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            저장
          </button>
        </div>
      </div>
    </Modal>
  );

  return (
    <div className="space-y-6">
      {/* System Summary Dashboard */}
      {summary && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-gray-100 mb-4">시스템 요약</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">총 사용자 수</p>
                  <p className="text-2xl font-bold text-gray-100">{summary.totalUsers}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-xl">
                  👥
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">총 거래 수</p>
                  <p className="text-2xl font-bold text-gray-100">{summary.totalTransactions}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-600/10 flex items-center justify-center text-xl">
                  📊
                </div>
              </div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">총 카테고리 수</p>
                  <p className="text-2xl font-bold text-gray-100">{summary.totalCategories}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-600/10 flex items-center justify-center text-xl">
                  🏷️
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Content */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">관리자</h3>

        <div className="flex gap-1 bg-gray-800 rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            사용자 관리
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${activeTab === 'categories'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            카테고리 관리
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${activeTab === 'settings'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
              }`}
          >
            시스템 설정
          </button>
        </div>

        {getTabContent()}
      </div>
    </div>
  );
}