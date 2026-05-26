// 설정 페이지 — 카드/예산/고정비/카테고리 4개 탭 라우팅
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/contexts/ToastContext'
import { PaymentMethodTab } from './PaymentMethodTab'
import { BudgetTab } from './BudgetTab'
import { RecurringExpenseTab } from './RecurringExpenseTab'
import { CategoryTab } from './CategoryTab'

type TabKey = 'payment-methods' | 'budgets' | 'recurring-expenses' | 'categories'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'payment-methods', label: '카드' },
  { key: 'budgets', label: '예산' },
  { key: 'recurring-expenses', label: '고정비' },
  { key: 'categories', label: '카테고리' },
]

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('payment-methods')
  const { signOut } = useAuth()
  const { addToast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch {
      addToast('로그아웃 중 오류가 발생했습니다.', 'error')
    }
  }

  return (
    <div className="space-y-6 lg:max-w-4xl lg:mx-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">설정</h2>

        <div className="flex gap-1 bg-gray-800 rounded-lg p-1 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>


        {activeTab === 'payment-methods' && <PaymentMethodTab />}
        {activeTab === 'budgets' && <BudgetTab />}
        {activeTab === 'recurring-expenses' && <RecurringExpenseTab />}
        {activeTab === 'categories' && <CategoryTab />}
      </div>

      <button
        onClick={handleSignOut}
        className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300
                   rounded-xl font-medium transition border border-gray-700"
      >
        로그아웃
      </button>
    </div>
  )
}
