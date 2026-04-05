import { useState, useEffect, useRef } from 'react';
import type { Category, PaymentMethod, SubCategorySuggestion, TransactionCreateRequest } from '../types/index.js';
import { subCategoryApi } from '../api/subcategories.js';

interface TransactionFormProps {
  onSubmit: (data: TransactionCreateRequest) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<TransactionCreateRequest>;
  categories: Category[];
  paymentMethods: PaymentMethod[];
}

interface SubCategoryOption {
  value: string;
  label: string;
  frequency: number;
}

export function TransactionForm({ 
  onSubmit, 
  onCancel, 
  initialData = {}, 
  categories, 
  paymentMethods 
}: TransactionFormProps) {
const [formData, setFormData] = useState<TransactionCreateRequest>({
  type: 'expense',
  amount: 0,
  category_id: 0,
  payment_method_id: undefined,
  date: initialData.date ?? new Date().toISOString().split('T')[0] ?? '',
  sub_category: '',
  memo: '',
  ...initialData
});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subCategorySuggestions, setSubCategorySuggestions] = useState<SubCategoryOption[]>([]);
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredCategories = categories.filter(c => c.type === formData.type);

  // Debounce search term
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      if (searchTerm && formData.category_id) {
        try {
          const response = await subCategoryApi.list(formData.category_id);
          if (response.data?.success && response.data.data) {
            const suggestions = response.data.data.map((s: SubCategorySuggestion) => ({
              value: s.sub_category,
              label: s.sub_category,
              frequency: s.frequency
            }));
            setSubCategorySuggestions(suggestions);
            setShowSubCategoryDropdown(suggestions.length > 0);
          }
        } catch {
          setSubCategorySuggestions([]);
        }
      } else {
        setSubCategorySuggestions([]);
        setShowSubCategoryDropdown(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchTerm, formData.category_id]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSubCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (field: keyof TransactionCreateRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (categoryId: number) => {
    setFormData(prev => ({ ...prev, category_id: categoryId, sub_category: '' }));
    setSearchTerm('');
    setSubCategorySuggestions([]);
    setShowSubCategoryDropdown(false);
  };

  const handleSubCategorySelect = (option: SubCategoryOption) => {
    setFormData(prev => ({ ...prev, sub_category: option.value }));
    setSearchTerm('');
    setShowSubCategoryDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category_id || formData.amount <= 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Type Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">유형</label>
        <div className="flex rounded-lg bg-gray-800 p-1">
          <button
            type="button"
            onClick={() => handleInputChange('type', 'income')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              formData.type === 'income'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            수입
          </button>
          <button
            type="button"
            onClick={() => handleInputChange('type', 'expense')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition ${
              formData.type === 'expense'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            지출
          </button>
        </div>
      </div>

      {/* Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">금액</label>
        <div className="relative">
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', Number(e.target.value))}
            min="1"
            max="99999999"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
          <span className="absolute right-3 top-2 text-gray-400 text-sm">
            원
          </span>
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">카테고리</label>
        <select
          value={formData.category_id || ''}
          onChange={(e) => handleCategoryChange(Number(e.target.value))}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">선택하세요</option>
          {filteredCategories.map(category => (
            <option key={category.id} value={category.id}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Payment Method */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">결제수단</label>
        <select
          value={formData.payment_method_id || ''}
          onChange={(e) => handleInputChange('payment_method_id', e.target.value ? Number(e.target.value) : undefined)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">선택하세요</option>
          {paymentMethods.map(method => (
            <option key={method.id} value={method.id}>
              {method.name}
            </option>
          ))}
        </select>
      </div>

      {/* Sub-category with Autocomplete */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-300 mb-2">하위 카테고리</label>
        <input
          type="text"
          value={formData.sub_category}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            handleInputChange('sub_category', e.target.value);
          }}
          onFocus={() => formData.sub_category && setShowSubCategoryDropdown(true)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="하위 카테고리 입력"
        />
        
        {showSubCategoryDropdown && subCategorySuggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-auto"
          >
            {subCategorySuggestions.map(option => (
              <div
                key={option.value}
                onClick={() => handleSubCategorySelect(option)}
                className="px-4 py-2 text-sm text-gray-100 hover:bg-gray-700 cursor-pointer"
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">날짜</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => handleInputChange('date', e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Memo */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">메모</label>
        <textarea
          value={formData.memo || ''}
          onChange={(e) => handleInputChange('memo', e.target.value)}
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="메모를 입력하세요"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={isSubmitting || formData.amount <= 0 || !formData.category_id}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
        >
          {isSubmitting ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}