import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext.js';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message ?? '로그인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) {
      setError('Google 인증 토큰을 가져올 수 없습니다');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/dashboard');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message ?? 'Google 로그인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">로그인</h2>

        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google 로그인에 실패했습니다')}
          text="signin_with"
          shape="rectangular"
          size="large"
          width="100%"
        />

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-700" />
          <span className="px-4 text-sm text-gray-500">또는</span>
          <div className="flex-1 border-t border-gray-700" />
        </div>

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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호를 입력하세요"
              required
            />
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
            {isLoading ? '로그인 중...' : '로그인'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <a href="/register" className="text-blue-400 hover:text-blue-300 text-sm">
            계정이 없으신가요? 회원가입
          </a>
        </div>
      </div>
    </div>
  );
}
