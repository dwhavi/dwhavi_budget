import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from '@/shared/lib/queryClient'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { MonthNavigationProvider } from '@/shared/hooks/useMonthNavigation'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MonthNavigationProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </MonthNavigationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
