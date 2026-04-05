import api from './axios.js';
import type {
  ApiResponse,
  PaymentMethod,
  PaymentMethodCreateRequest,
  PaymentMethodUpdateRequest,
} from '../types/index.js';

export const paymentMethodApi = {
  list: () =>
    api.get<ApiResponse<PaymentMethod[]>>('/payment-methods'),

  get: (id: number) =>
    api.get<ApiResponse<PaymentMethod>>(`/payment-methods/${id}`),

  create: (data: PaymentMethodCreateRequest) =>
    api.post<ApiResponse<PaymentMethod>>('/payment-methods', data),

  update: (id: number, data: PaymentMethodUpdateRequest) =>
    api.put<ApiResponse<PaymentMethod>>(`/payment-methods/${id}`, data),

  delete: (id: number) =>
    api.delete<ApiResponse<null>>(`/payment-methods/${id}`),
};
