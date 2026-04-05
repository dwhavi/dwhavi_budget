import api from './axios.js';
import type {
  ApiResponse,
  SubCategorySuggestion,
} from '../types/index.js';

export const subCategoryApi = {
  list: (categoryId: number) =>
    api.get<ApiResponse<SubCategorySuggestion[]>>(`/categories/${categoryId}/subcategories`),
};
