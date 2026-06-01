// Supabase → Google Drive 1회성 마이그레이션 페이지
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { saveFile } from '@/shared/lib/google-drive-service'
import { useAuth } from '@/contexts/AuthContext'
import type { BudgetData } from '@/shared/contexts/DataContext'

const SUPABASE_URL = 'https://wabbbupmrvlmalkosslx.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_VWYO2xqu8b357V0XZeQkEQ_anXuuYte'

type OldCategory = { id: number; name: string; type: string; icon: string; color: string; sort_order: number; deleted_at?: string | null }
type OldPaymentMethod = { id: number; name: string; issuer?: string; type: string; color?: string; is_default: boolean; memo?: string; billing_start_day?: number; payment_day?: number; deleted_at?: string | null }
type OldTransaction = { id: number; type: string; amount: number; category_id: number; payment_method_id?: number; date: string; sub_category?: string; memo?: string; created_at: string; updated_at: string; deleted_at?: string | null }
type OldBudget = { id: number; category_id: number; month: string; amount: number }
type OldRecurringExpense = { id: number; name: string; amount: number; category_id: number; payment_method_id: number; start_date: string; end_date?: string; memo?: string; is_active: boolean; deleted_at?: string | null }

interface MigrationResult {
  categories: number
  paymentMethods: number
  transactions: number
  budgets: number
  recurringExpenses: number
}

async function fetchTable<T>(tableName: string): Promise<T[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=*&order=id.asc`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  })
  if (!res.ok) throw new Error(`${tableName} 조회 실패: ${res.status} ${await res.text()}`)
  return res.json()
}

function migrateId(oldToNew: Map<number, string>, oldId: number): string {
  return oldToNew.get(oldId) ?? uuidv4()
}

export function MigratePage() {
  const { authenticated, loading } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'fetching' | 'uploading' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<MigrationResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-400 mb-4">먼저 Google 로그인이 필요합니다.</p>
          <button onClick={() => navigate('/login')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
            로그인
          </button>
        </div>
      </div>
    )
  }

  const handleMigrate = async () => {
    try {
      setStatus('fetching')
      setErrorMessage(null)

      const [oldCategories, oldPaymentMethods, oldTransactions, oldBudgets, oldRecurringExpenses] = await Promise.all([
        fetchTable<OldCategory>('categories'),
        fetchTable<OldPaymentMethod>('payment_methods'),
        fetchTable<OldTransaction>('transactions'),
        fetchTable<OldBudget>('budgets'),
        fetchTable<OldRecurringExpense>('recurring_expenses'),
      ])

      const catIdMap = new Map<number, string>()
      const pmIdMap = new Map<number, string>()

      const categories = oldCategories
        .filter((c) => !c.deleted_at)
        .map((c) => {
          const newId = uuidv4()
          catIdMap.set(c.id, newId)
          return { ...c, id: newId }
        })

      const paymentMethods = oldPaymentMethods
        .filter((p) => !p.deleted_at)
        .map((p) => {
          const newId = uuidv4()
          pmIdMap.set(p.id, newId)
          return { ...p, id: newId }
        })

      const transactions = oldTransactions
        .filter((t) => !t.deleted_at)
        .map((t) => ({
          ...t,
          id: uuidv4(),
          category_id: migrateId(catIdMap, t.category_id),
          payment_method_id: t.payment_method_id ? migrateId(pmIdMap, t.payment_method_id) : undefined,
        }))

      const budgets = oldBudgets.map((b) => ({
        ...b,
        id: uuidv4(),
        category_id: migrateId(catIdMap, b.category_id),
      }))

      const recurringExpenses = oldRecurringExpenses
        .filter((r) => !r.deleted_at)
        .map((r) => ({
          ...r,
          id: uuidv4(),
          category_id: migrateId(catIdMap, r.category_id),
          payment_method_id: migrateId(pmIdMap, r.payment_method_id),
        }))

      const budgetData: BudgetData = {
        version: 1,
        lastSync: new Date().toISOString(),
        categories: categories as BudgetData['categories'],
        paymentMethods: paymentMethods as BudgetData['paymentMethods'],
        transactions: transactions as BudgetData['transactions'],
        budgets: budgets as BudgetData['budgets'],
        recurringExpenses: recurringExpenses as BudgetData['recurringExpenses'],
      }

      setResult({
        categories: categories.length,
        paymentMethods: paymentMethods.length,
        transactions: transactions.length,
        budgets: budgets.length,
        recurringExpenses: recurringExpenses.length,
      })

      setStatus('uploading')
      await saveFile(JSON.stringify(budgetData, null, 2))
      setStatus('done')
    } catch (err) {
      setStatus('error')
      setErrorMessage(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-3">📦</div>
          <h1 className="text-xl font-bold text-gray-100">데이터 마이그레이션</h1>
          <p className="text-gray-500 text-sm mt-1">Supabase에서 Google Drive로 데이터를 옮깁니다.</p>
        </div>

        {status === 'done' && result ? (
          <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 space-y-2">
            <p className="text-green-400 font-medium">마이그레이션 완료!</p>
            <div className="text-sm text-gray-400 space-y-1">
              <p>카테고리: {result.categories}개</p>
              <p>결제수단: {result.paymentMethods}개</p>
              <p>거래: {result.transactions}건</p>
              <p>예산: {result.budgets}개</p>
              <p>고정비: {result.recurringExpenses}개</p>
            </div>
          </div>
        ) : null}

        {status === 'error' && errorMessage ? (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <p className="text-red-400 text-sm">{errorMessage}</p>
          </div>
        ) : null}

        {(status === 'fetching' || status === 'uploading') && (
          <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2" />
            <p className="text-blue-400 text-sm">
              {status === 'fetching' ? 'Supabase에서 데이터를 읽어오는 중...' : 'Google Drive에 저장 중...'}
            </p>
          </div>
        )}

        {status !== 'done' && (
          <button
            onClick={handleMigrate}
            disabled={status === 'fetching' || status === 'uploading'}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
          >
            마이그레이션 시작
          </button>
        )}

        {status === 'done' && (
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition"
          >
            가계부로 이동
          </button>
        )}

        <p className="text-gray-600 text-xs text-center">
          1회 실행 후 이 페이지는 삭제됩니다.
        </p>
      </div>
    </div>
  )
}
