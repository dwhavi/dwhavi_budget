import api from './axios.js';
import type {
  ApiResponse,
  DashboardSummary,
  MonthlyTrend,
  CategoryStat,
  PaymentMethodStat,
} from '../types/index.js';

export const statsApi = {
  dashboard: (month?: string) =>
    api.get<ApiResponse<DashboardSummary>>('/stats/dashboard', { params: { month } }),

  monthlyTrend: (months?: number) =>
    api.get<ApiResponse<MonthlyTrend[]>>('/stats/monthly-trend', { params: { months } }),

  categoryStats: (params?: { type?: 'income' | 'expense'; month?: string }) =>
    api.get<ApiResponse<CategoryStat[]>>('/stats/category', { params }),

  paymentMethodStats: (params?: { month?: string }) =>
    api.get<ApiResponse<PaymentMethodStat[]>>('/stats/payment-methods', { params }),
};
