// 인증 가드 컴포넌트
import { useAuth } from '@/contexts/AuthContext'
import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authenticated } = useAuth()

  if (!authenticated) return <Navigate to="/login" replace />

  return <>{children}</>
}
