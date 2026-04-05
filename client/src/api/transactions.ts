import api from './axios.js';
import type {
  ApiResponse,
  Transaction,
  TransactionListResponse,
  TransactionCreateRequest,
  TransactionUpdateRequest,
  TransactionQueryParams,
} from '../types/index.js';

export const transactionApi = {
  list: (params?: TransactionQueryParams) =>
    api.get<ApiResponse<TransactionListResponse>>('/transactions', { params }),

  get: (id: number) =>
    api.get<ApiResponse<Transaction>>(`/transactions/${id}`),

  create: (data: TransactionCreateRequest) =>
    api.post<ApiResponse<Transaction>>('/transactions', data),

  update: (id: number, data: TransactionUpdateRequest) =>
    api.put<ApiResponse<Transaction>>(`/transactions/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/transactions/${id}`),
};
