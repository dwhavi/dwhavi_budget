import api from './axios.js';
import type {
  ApiResponse,
  Category,
} from '../types/index.js';

export interface CategoryCreateRequest {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  sort_order?: number;
}

export interface CategoryUpdateRequest {
  name?: string;
  type?: 'income' | 'expense';
  icon?: string;
  color?: string;
  sort_order?: number;
}

export const categoryApi = {
  list: () =>
    api.get<ApiResponse<Category[]>>('/categories'),

  get: (id: number) =>
    api.get<ApiResponse<Category>>(`/categories/${id}`),

  create: (data: CategoryCreateRequest) =>
    api.post<ApiResponse<Category>>('/categories', data),

  update: (id: number, data: CategoryUpdateRequest) =>
    api.put<ApiResponse<Category>>(`/categories/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/categories/${id}`),
};
