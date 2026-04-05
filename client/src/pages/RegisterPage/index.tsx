import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.js';

export function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    displayName: ''
  });
  const navigate = useNavigate();
  const { register } = useAuth();

  const validateForm = () => {
    const errors = {
      email: '',
      password: '',
      passwordConfirm: '',
      displayName: ''
    };

    // Email validation
    if (!email) {
      errors.email = '이메일을 입력하세요';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = '올바른 이메일 형식이 아닙니다';
    }

    // Password validation
    if (!password) {
      errors.password = '비밀번호를 입력하세요';
    } else if (password.length < 8) {
      errors.password = '비밀번호는 최소 8자 이상이어야 합니다';
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      errors.password = '비밀번호는 문자와 숫자를 포함해야 합니다';
    }

    // Password confirmation validation
    if (!passwordConfirm) {
      errors.passwordConfirm = '비밀번호 확인을 입력하세요';
    } else if (password !== passwordConfirm) {
      errors.passwordConfirm = '비밀번호가 일치하지 않습니다';
    }

    // Display name validation
    if (!displayName) {
      errors.displayName = '닉네임을 입력하세요';
    } else if (displayName.length < 2 || displayName.length > 20) {
      errors.displayName = '닉네임은 2-20자 이어야 합니다';
    }

    setValidationErrors(errors);
    return !Object.values(errors).some(err => err !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({ email: '', password: '', passwordConfirm: '', displayName: '' });

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await register({ email, password, display_name: displayName });
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message ?? '회원가입에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">회원가입</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="이메일을 입력하세요"
              required
            />
            {validationErrors.email && (
              <div className="text-red-400 text-sm mt-1">
                {validationErrors.email}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호를 입력하세요 (최소 8자, 문자+숫자)"
              required
            />
            {validationErrors.password && (
              <div className="text-red-400 text-sm mt-1">
                {validationErrors.password}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">비밀번호 확인</label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
            {validationErrors.passwordConfirm && (
              <div className="text-red-400 text-sm mt-1">
                {validationErrors.passwordConfirm}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">닉네임</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="닉네임을 입력하세요 (2-20자)"
              required
            />
            {validationErrors.displayName && (
              <div className="text-red-400 text-sm mt-1">
                {validationErrors.displayName}
              </div>
            )}
          </div>
          {error && (
            <div className="text-red-400 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
          >
            {isLoading ? '회원가입 중...' : '회원가입'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <a href="/login" className="text-blue-400 hover:text-blue-300 text-sm">
            이미 계정이 있으신가요? 로그인
          </a>
        </div>
      </div>
    </div>
  );
}