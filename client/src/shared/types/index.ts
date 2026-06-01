export interface Category {
  id: string
  name: string
  type: 'income' | 'expense'
  icon: string
  color: string
  sort_order: number
}

export interface SubCategorySuggestion {
  sub_category: string
  frequency: number
}

export interface Transaction {
  id: string
  type: 'income' | 'expense' | 'transfer'
  amount: number
  category_id: string
  payment_method_id?: string
  date: string
  sub_category?: string
  memo?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  category?: Category
  category_name?: string
  category_color?: string
  payment_method_name?: string
  payment_method_color?: string
}

export interface TransactionCreateRequest {
  type: 'income' | 'expense' | 'transfer'
  amount: number
  category_id: string
  payment_method_id?: string
  date: string
  sub_category?: string
  memo?: string
  created_at?: string
}

export interface TransactionUpdateRequest {
  type?: 'income' | 'expense' | 'transfer'
  amount?: number
  category_id?: string
  payment_method_id?: string
  date?: string
  sub_category?: string
  memo?: string
  created_at?: string
}

export interface PaymentMethod {
  id: string
  name: string
  issuer?: string
  type: 'credit' | 'debit' | 'cash' | 'transfer'
  color?: string
  is_default: boolean
  memo?: string
  billing_start_day?: number
  payment_day?: number
}

export interface PaymentMethodCreateRequest {
  name: string
  issuer?: string
  type: 'credit' | 'debit' | 'cash' | 'transfer'
  color?: string
  is_default?: boolean
  memo?: string
  billing_start_day?: number
  payment_day?: number
}

export interface PaymentMethodUpdateRequest {
  name?: string
  issuer?: string
  type?: 'credit' | 'debit' | 'cash' | 'transfer'
  color?: string
  is_default?: boolean
  memo?: string
  billing_start_day?: number
  payment_day?: number
}

export interface Budget {
  id: string
  category_id: string
  month: string
  amount: number
  category?: Category
}

export interface BudgetUpsertRequest {
  category_id: string
  month: string
  amount: number
}

export interface RecurringExpense {
  id: string
  name: string
  amount: number
  category_id: string
  payment_method_id: string
  start_date: string
  end_date?: string
  memo?: string
  is_active: boolean
}

export interface RecurringExpenseCreateRequest {
  name: string
  amount: number
  category_id: string
  payment_method_id: string
  start_date: string
  end_date?: string
  memo?: string
}

export interface RecurringExpenseUpdateRequest {
  name?: string
  amount?: number
  category_id?: string
  payment_method_id?: string
  start_date?: string
  end_date?: string
  memo?: string
  is_active?: boolean
}

export interface CategoryRanking {
  category_id: string
  category_name: string
  total: number
  color: string
}

export interface DashboardSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  dailyAllowance: number
  categoryRanking: CategoryRanking[]
  recentTransactions: Transaction[]
}

export interface MonthlyTrend {
  month: string
  income: number
  expense: number
}

export interface CategoryStat {
  category_id: string
  category_name: string
  total: number
  percentage: number
  color: string
}

export interface PaymentMethodStat {
  payment_method_id: string
  payment_method_name: string
  total: number
  percentage: number
}

export interface CreditCardBilling {
  paymentMethodId: string
  paymentMethodName: string
  paymentMethodColor: string
  billingPeriodStart: string
  billingPeriodEnd: string
  totalSpent: number
  nextPaymentDate: string
}
