// 전역 데이터 컨텍스트 — Google Drive JSON ↔ 인메모리 상태 동기화
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { v4 as uuidv4 } from 'uuid'
import { loadFile, saveFile } from '@/shared/lib/google-drive-service'
import { useAuth } from '@/contexts/AuthContext'
import type {
  Category,
  PaymentMethod,
  Transaction,
  Budget,
  RecurringExpense,
} from '@/shared/types'

const DATA_VERSION = 1

export interface BudgetData {
  version: number
  lastSync: string
  categories: Category[]
  paymentMethods: PaymentMethod[]
  transactions: Transaction[]
  budgets: Budget[]
  recurringExpenses: RecurringExpense[]
}

interface DataContextValue {
  data: BudgetData | null
  loading: boolean
  uploadError: string | null
  reload: () => Promise<void>

  addCategory: (input: Omit<Category, 'id'>) => Category
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void

  addPaymentMethod: (input: Omit<PaymentMethod, 'id'>) => PaymentMethod
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethod>) => void
  deletePaymentMethod: (id: string) => void

  addTransaction: (input: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => Transaction
  updateTransaction: (id: string, updates: Partial<Transaction>) => void
  deleteTransaction: (id: string) => void

  upsertBudget: (input: Budget) => void

  addRecurringExpense: (input: Omit<RecurringExpense, 'id' | 'user_id'>) => RecurringExpense
  updateRecurringExpense: (id: string, updates: Partial<RecurringExpense>) => void
  deleteRecurringExpense: (id: string) => void
  toggleRecurringExpense: (id: string) => void
}

const DataContext = createContext<DataContextValue | null>(null)

function createDefaultData(): BudgetData {
  const now = new Date().toISOString()
  return {
    version: DATA_VERSION,
    lastSync: now,
    categories: [
      { id: uuidv4(), name: '급여', type: 'income', icon: '💰', color: '#10B981', sort_order: 1 },
      { id: uuidv4(), name: '부수입', type: 'income', icon: '🎁', color: '#34D399', sort_order: 2 },
      { id: uuidv4(), name: '식비', type: 'expense', icon: '🍔', color: '#F59E0B', sort_order: 3 },
      { id: uuidv4(), name: '교통', type: 'expense', icon: '🚌', color: '#3B82F6', sort_order: 4 },
      { id: uuidv4(), name: '쇼핑', type: 'expense', icon: '🛍️', color: '#EC4899', sort_order: 5 },
      { id: uuidv4(), name: '주거', type: 'expense', icon: '🏠', color: '#8B5CF6', sort_order: 6 },
      { id: uuidv4(), name: '통신', type: 'expense', icon: '📱', color: '#6366F1', sort_order: 7 },
      { id: uuidv4(), name: '의료', type: 'expense', icon: '🏥', color: '#EF4444', sort_order: 8 },
      { id: uuidv4(), name: '교육', type: 'expense', icon: '📚', color: '#14B8A6', sort_order: 9 },
      { id: uuidv4(), name: '문화', type: 'expense', icon: '🎬', color: '#F97316', sort_order: 10 },
      { id: uuidv4(), name: '경조사', type: 'expense', icon: '💝', color: '#E11D48', sort_order: 11 },
      { id: uuidv4(), name: '기타', type: 'expense', icon: '📌', color: '#6B7280', sort_order: 12 },
    ],
    paymentMethods: [
      { id: uuidv4(), name: '현금', type: 'cash', is_default: true },
    ],
    transactions: [],
    budgets: [],
    recurringExpenses: [],
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { authenticated } = useAuth()
  const [data, setData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pendingSaveRef = useRef(false)

  // dataRef: 연속 mutate 호출 시(예: 카테고리 생성→트랜잭션 생성) closure 스테일 문제 방지
  const dataRef = useRef(data ?? null)

  const persist = useCallback(async (content: string) => {
    try {
      await saveFile(content)
      setUploadError(null)
      pendingSaveRef.current = false
      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current)
        retryTimerRef.current = null
      }
    } catch (err) {
      setUploadError('Google Drive 저장에 실패했습니다. 잠시 후 재시도합니다.')
      pendingSaveRef.current = true
      if (!retryTimerRef.current) {
        retryTimerRef.current = setInterval(() => {
          if (pendingSaveRef.current) {
            saveFile(content).then(() => {
              setUploadError(null)
              pendingSaveRef.current = false
              if (retryTimerRef.current) {
                clearInterval(retryTimerRef.current)
                retryTimerRef.current = null
              }
            }).catch(() => setUploadError('Google Drive 저장에 실패했습니다. 잠시 후 재시도합니다.'))
          }
        }, 30000)
      }
    }
  }, [])

  const scheduleSave = useCallback((nextData: BudgetData) => {
    dataRef.current = nextData
    setData(nextData)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      persist(JSON.stringify(nextData))
    }, 2000)
  }, [persist])

  const load = useCallback(async () => {
    setLoading(true)
    const result = await loadFile()
    if (result && result.content) {
      try {
        const parsed = JSON.parse(result.content) as BudgetData
        dataRef.current = parsed
        setData(parsed)
      } catch {
        const fallback = createDefaultData()
        dataRef.current = fallback
        setData(fallback)
        await saveFile(JSON.stringify(fallback))
      }
    } else {
      const fresh = createDefaultData()
      dataRef.current = fresh
      setData(fresh)
      await saveFile(JSON.stringify(fresh))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (authenticated) {
      load()
    }
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (retryTimerRef.current) clearInterval(retryTimerRef.current)
    }
  }, [authenticated, load])

  useEffect(() => {
    if (!authenticated) return
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [authenticated, load])

  const addCategory = useCallback((input: Omit<Category, 'id'>) => {
    const current = dataRef.current
    if (!current) throw new Error('데이터가 로드되지 않았습니다.')
    const newItem: Category = { ...input, id: uuidv4() }
    scheduleSave({ ...current, categories: [...current.categories, newItem] })
    return newItem
  }, [scheduleSave])

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    const current = dataRef.current
    if (!current) return
    scheduleSave({
      ...current,
      categories: current.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })
  }, [scheduleSave])

  const deleteCategory = useCallback((id: string) => {
    const current = dataRef.current
    if (!current) return
    scheduleSave({
      ...current,
      categories: current.categories.filter((c) => c.id !== id),
    })
  }, [scheduleSave])

  const addPaymentMethod = useCallback((input: Omit<PaymentMethod, 'id'>) => {
    const current = dataRef.current
    if (!current) throw new Error('데이터가 로드되지 않았습니다.')
    const newItem: PaymentMethod = { ...input, id: uuidv4() }
    scheduleSave({ ...current, paymentMethods: [...current.paymentMethods, newItem] })
    return newItem
  }, [scheduleSave])

  const updatePaymentMethod = useCallback((id: string, updates: Partial<PaymentMethod>) => {
    const current = dataRef.current
    if (!current) return
    scheduleSave({
      ...current,
      paymentMethods: current.paymentMethods.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })
  }, [scheduleSave])

  const deletePaymentMethod = useCallback((id: string) => {
    const current = dataRef.current
    if (!current) return
    const target = current.paymentMethods.find((p) => p.id === id)
    if (target?.name === '현금') throw new Error('현금 결제수단은 삭제할 수 없습니다')
    scheduleSave({
      ...current,
      paymentMethods: current.paymentMethods.filter((p) => p.id !== id),
    })
  }, [scheduleSave])

  const addTransaction = useCallback((input: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
    const current = dataRef.current
    if (!current) throw new Error('데이터가 로드되지 않았습니다.')
    const now = new Date().toISOString()
    const newItem: Transaction = { ...input, id: uuidv4(), created_at: now, updated_at: now }
    scheduleSave({ ...current, transactions: [...current.transactions, newItem] })
    return newItem
  }, [scheduleSave])

  const updateTransaction = useCallback((id: string, updates: Partial<Transaction>) => {
    const current = dataRef.current
    if (!current) return
    scheduleSave({
      ...current,
      transactions: current.transactions.map((t) =>
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t,
      ),
    })
  }, [scheduleSave])

  const deleteTransaction = useCallback((id: string) => {
    const current = dataRef.current
    if (!current) return
    scheduleSave({
      ...current,
      transactions: current.transactions.filter((t) => t.id !== id),
    })
  }, [scheduleSave])

  const upsertBudget = useCallback((input: Budget) => {
    const current = dataRef.current
    if (!current) return
    const exists = current.budgets.find(
      (b) => b.category_id === input.category_id && b.month === input.month,
    )
    if (exists) {
      scheduleSave({
        ...current,
        budgets: current.budgets.map((b) => (b.id === exists.id ? input : b)),
      })
    } else {
      scheduleSave({ ...current, budgets: [...current.budgets, input] })
    }
  }, [scheduleSave])

  const addRecurringExpense = useCallback((input: Omit<RecurringExpense, 'id'>) => {
    const current = dataRef.current
    if (!current) throw new Error('데이터가 로드되지 않았습니다.')
    const newItem: RecurringExpense = { ...input, id: uuidv4() }
    scheduleSave({ ...current, recurringExpenses: [...current.recurringExpenses, newItem] })
    return newItem
  }, [scheduleSave])

  const updateRecurringExpense = useCallback((id: string, updates: Partial<RecurringExpense>) => {
    const current = dataRef.current
    if (!current) return
    scheduleSave({
      ...current,
      recurringExpenses: current.recurringExpenses.map((r) =>
        r.id === id ? { ...r, ...updates } : r,
      ),
    })
  }, [scheduleSave])

  const deleteRecurringExpense = useCallback((id: string) => {
    const current = dataRef.current
    if (!current) return
    scheduleSave({
      ...current,
      recurringExpenses: current.recurringExpenses.filter((r) => r.id !== id),
    })
  }, [scheduleSave])

  const toggleRecurringExpense = useCallback((id: string) => {
    const current = dataRef.current
    if (!current) return
    scheduleSave({
      ...current,
      recurringExpenses: current.recurringExpenses.map((r) =>
        r.id === id ? { ...r, is_active: !r.is_active } : r,
      ),
    })
  }, [scheduleSave])

  return (
    <DataContext.Provider
      value={{
        data,
        loading,
        uploadError,
        reload: load,
        addCategory,
        updateCategory,
        deleteCategory,
        addPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        upsertBudget,
        addRecurringExpense,
        updateRecurringExpense,
        deleteRecurringExpense,
        toggleRecurringExpense,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
