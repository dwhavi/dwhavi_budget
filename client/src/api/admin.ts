import api from './axios.js';
import type {
  ApiResponse,
  SystemSettings,
  AdminUser,
  SystemSummary,
} from '../types/index.js';

export const adminApi = {
  getSettings: () =>
    api.get<ApiResponse<SystemSettings>>('/admin/settings'),

  updateSettings: (data: Partial<SystemSettings>) =>
    api.put<ApiResponse<SystemSettings>>('/admin/settings', data),

  listUsers: () =>
    api.get<ApiResponse<AdminUser[]>>('/admin/users'),

  updateUser: (id: number, data: Partial<Pick<AdminUser, 'display_name' | 'role' | 'is_active'>>) =>
    api.put<ApiResponse<AdminUser>>(`/admin/users/${id}`, data),

  deleteUser: (id: number) =>
    api.delete<ApiResponse<null>>(`/admin/users/${id}`),

  getSummary: () =>
    api.get<ApiResponse<SystemSummary>>('/admin/summary'),
};
