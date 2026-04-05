import api from './axios.js';
import type {
  ApiResponse,
  Budget,
  BudgetUpsertRequest,
} from '../types/index.js';

export const budgetApi = {
  list: (month?: string) =>
    api.get<ApiResponse<Budget[]>>('/budgets', { params: { month } }),

  upsert: (data: BudgetUpsertRequest) =>
    api.post<ApiResponse<Budget>>('/budgets', data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/budgets/${id}`),
};
