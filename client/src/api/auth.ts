import api from './axios.js';
import type {
  ApiResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  PasswordChangeRequest,
  User,
} from '../types/index.js';

export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/register', data),

  login: (data: LoginRequest) =>
    api.post<ApiResponse<AuthResponse>>('/auth/login', data),

  logout: () => api.post<ApiResponse<null>>('/auth/logout'),

  refresh: () => api.post<ApiResponse<AuthResponse>>('/auth/refresh'),

  me: () => api.get<ApiResponse<{ user: User }>>('/auth/me'),

  changePassword: (data: PasswordChangeRequest) =>
    api.patch<ApiResponse<null>>('/auth/password', data),
};
