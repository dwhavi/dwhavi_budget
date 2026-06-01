// 인증 콜백 — Google OAuth 토큰 획득 후 메인으로 이동
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function AuthCallback() {
  const navigate = useNavigate()
  const { signIn } = useAuth()

  useEffect(() => {
    signIn()
      .then(() => navigate('/', { replace: true }))
      .catch(() => navigate('/login', { replace: true }))
  }, [navigate, signIn])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4" />
        <p className="text-gray-400">로그인 처리 중...</p>
      </div>
    </div>
  )
}
