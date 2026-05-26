// Supabase OAuth 콜백 처리
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/shared/lib/supabase'

export function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    if (code) {
      // PKCE flow: code를 session으로 교환
      supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
        if (exchangeError) {
          setError('로그인 처리에 실패했습니다.')
          setTimeout(() => navigate('/login', { replace: true }), 2000)
        } else {
          navigate('/', { replace: true })
        }
      })
    } else {
      // Implicit flow: Supabase가 자동 처리
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          navigate('/', { replace: true })
        } else {
          navigate('/login', { replace: true })
        }
      })
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-red-400 mb-2">{error}</p>
            <p className="text-gray-500 text-sm">로그인 페이지로 이동합니다...</p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4" />
            <p className="text-gray-400">로그인 처리 중...</p>
          </>
        )}
      </div>
    </div>
  )
}
