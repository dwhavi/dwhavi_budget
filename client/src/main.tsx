import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from './contexts/AuthContext'
import { DataProvider } from './shared/contexts/DataContext'
import { ToastProvider } from './contexts/ToastContext'
import { MonthNavigationProvider } from '@/shared/hooks/useMonthNavigation'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <DataProvider>
        <MonthNavigationProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </MonthNavigationProvider>
      </DataProvider>
    </AuthProvider>
  </StrictMode>,
)
