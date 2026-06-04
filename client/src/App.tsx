import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { ExpenseDashboardPage } from '@/features/expense-dashboard/ExpenseDashboardPage'
import { OverviewPage } from '@/features/overview/OverviewPage'
import { TransactionsPage } from '@/features/transactions/TransactionsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'
import { Layout } from '@/shared/components/Layout'
import { NotFoundPage } from '@/shared/components/NotFoundPage'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/" element={<ExpenseDashboardPage />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
