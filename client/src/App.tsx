import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';
import { Layout } from './components/Layout.tsx';
import { SkeletonCard } from './components/Skeleton.tsx';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <SkeletonCard className="w-full max-w-md" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <SkeletonCard className="w-full max-w-md" />
        </div>
      </Layout>
    );
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">로그인</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">이메일</label>
            <input
              type="email"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="이메일을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">비밀번호</label>
            <input
              type="password"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호를 입력하세요"
            />
          </div>
          <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}

function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-100 mb-6">회원가입</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">이메일</label>
            <input
              type="email"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="이메일을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">비밀번호</label>
            <input
              type="password"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호를 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">닉네임</label>
            <input
              type="text"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="닉네임을 입력하세요"
            />
          </div>
          <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition">
            회원가입
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">총수입</span>
            <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 text-sm">↑</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">+5,000,000원</div>
          <div className="text-xs text-gray-500 mt-1">급여, 부수입</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">총지출</span>
            <span className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 text-sm">↓</span>
          </div>
          <div className="text-2xl font-bold text-red-400">-2,340,500원</div>
          <div className="text-xs text-gray-500 mt-1">46.8% 사용</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">잔액</span>
            <span className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 text-sm">💰</span>
          </div>
          <div className="text-2xl font-bold text-green-400">2,659,500원</div>
          <div className="text-xs text-gray-500 mt-1">이번 달 남은 금액</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">예산 달성률</span>
            <span className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400 text-sm">⚡</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">78%</div>
          <div className="w-full bg-gray-800 rounded-full h-2 mt-2">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full" style={{width: '78%'}}></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">식비 예산 초과 주의!</div>
        </div>
      </div>
    </div>
  );
}

function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">거래 내역</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center text-sm">🍔</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-100">점심 식비</div>
              <div className="text-xs text-gray-500">오늘 · 카드 · 식비</div>
            </div>
            <div className="text-sm font-semibold text-red-400">-23,000</div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/50">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-sm">💼</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-100">급여</div>
              <div className="text-xs text-gray-500">4/3 · 이체 · 급여</div>
            </div>
            <div className="text-sm font-semibold text-blue-400">+5,000,000</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">통계</h3>
        <div className="text-gray-400">통계 페이지 내용</div>
      </div>
    </div>
  );
}

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">설정</h3>
        <div className="text-gray-400">설정 페이지 내용</div>
      </div>
    </div>
  );
}

function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-gray-100 mb-4">관리자</h3>
        <div className="text-gray-400">관리자 페이지 내용</div>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <Layout>
              <TransactionsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <Layout>
              <StatsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <SettingsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Layout>
              <AdminPage />
            </Layout>
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <AppRoutes />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}