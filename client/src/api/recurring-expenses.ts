import api from './axios.js';
import type {
  ApiResponse,
  RecurringExpense,
  RecurringExpenseCreateRequest,
  RecurringExpenseUpdateRequest,
} from '../types/index.js';

export const recurringExpenseApi = {
  list: () =>
    api.get<ApiResponse<RecurringExpense[]>>('/recurring-expenses'),

  get: (id: number) =>
    api.get<ApiResponse<RecurringExpense>>(`/recurring-expenses/${id}`),

  create: (data: RecurringExpenseCreateRequest) =>
    api.post<ApiResponse<RecurringExpense>>('/recurring-expenses', data),

  update: (id: number, data: RecurringExpenseUpdateRequest) =>
    api.put<ApiResponse<RecurringExpense>>(`/recurring-expenses/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/recurring-expenses/${id}`),
};
