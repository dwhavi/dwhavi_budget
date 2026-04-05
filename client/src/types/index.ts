export interface User {
  id: number;
  email: string;
  display_name: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  display_name: string;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}


export interface Category {
  id: number;
  user_id: number | null;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  sort_order: number;
}


export interface SubCategorySuggestion {
  sub_category: string;
  frequency: number;
}


export interface Transaction {
  id: number;
  user_id: number;
  type: 'income' | 'expense';
  amount: number;
  category_id: number;
  payment_method_id?: number;
  date: string;
  sub_category?: string;
  memo?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  category?: Category;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TransactionCreateRequest {
  type: 'income' | 'expense';
  amount: number;
  category_id: number;
  payment_method_id?: number;
  date: string;
  sub_category?: string;
  memo?: string;
}

export interface TransactionUpdateRequest {
  type?: 'income' | 'expense';
  amount?: number;
  category_id?: number;
  payment_method_id?: number;
  date?: string;
  sub_category?: string;
  memo?: string;
}

export interface TransactionQueryParams {
  page?: number;
  limit?: number;
  type?: 'income' | 'expense';
  category_id?: number;
  payment_method_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
}


export interface PaymentMethod {
  id: number;
  user_id: number;
  name: string;
  issuer?: string;
  type: 'credit' | 'debit' | 'cash' | 'transfer';
  color?: string;
  is_default: boolean;
  memo?: string;
}

export interface PaymentMethodCreateRequest {
  name: string;
  issuer?: string;
  type: 'credit' | 'debit' | 'cash' | 'transfer';
  color?: string;
  is_default?: boolean;
  memo?: string;
}

export interface PaymentMethodUpdateRequest {
  name?: string;
  issuer?: string;
  type?: 'credit' | 'debit' | 'cash' | 'transfer';
  color?: string;
  is_default?: boolean;
  memo?: string;
}


export interface Budget {
  id: number;
  user_id: number;
  category_id: number;
  month: string;
  amount: number;
  category?: Category;
}

export interface BudgetUpsertRequest {
  category_id: number;
  month: string;
  amount: number;
}


export interface RecurringExpense {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  category_id: number;
  payment_method_id: number;
  start_date: string;
  end_date?: string;
  memo?: string;
  is_active: boolean;
}

export interface RecurringExpenseCreateRequest {
  name: string;
  amount: number;
  category_id: number;
  payment_method_id: number;
  start_date: string;
  end_date?: string;
  memo?: string;
}

export interface RecurringExpenseUpdateRequest {
  name?: string;
  amount?: number;
  category_id?: number;
  payment_method_id?: number;
  start_date?: string;
  end_date?: string;
  memo?: string;
  is_active?: boolean;
}


export interface CategoryRanking {
  category_id: number;
  category_name: string;
  total: number;
  color: string;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  dailyAllowance: number;
  categoryRanking: CategoryRanking[];
  recentTransactions: Transaction[];
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expense: number;
}

export interface CategoryStat {
  category_id: number;
  category_name: string;
  total: number;
  percentage: number;
  color: string;
}

export interface PaymentMethodStat {
  payment_method_id: number;
  payment_method_name: string;
  total: number;
  percentage: number;
}


export interface SystemSettings {
  app_name: string;
  budget_alert_threshold: number;
  default_currency: string;
}

export interface AdminUser {
  id: number;
  email: string;
  display_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface SystemSummary {
  totalUsers: number;
  totalTransactions: number;
  totalCategories: number;
}


export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
