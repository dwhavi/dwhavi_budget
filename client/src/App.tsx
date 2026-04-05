import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { ToastProvider } from './contexts/ToastContext.tsx';
import { Layout } from './components/Layout.tsx';
import { SkeletonCard } from './components/Skeleton.tsx';
import { LoginPage } from './pages/LoginPage/index.tsx';
import { RegisterPage } from './pages/RegisterPage/index.tsx';
import { DashboardPage } from './pages/Dashboard/index.tsx';

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

// LoginPage and RegisterPage are imported from their respective files

// DashboardPage is imported from ./pages/Dashboard/index.tsx

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