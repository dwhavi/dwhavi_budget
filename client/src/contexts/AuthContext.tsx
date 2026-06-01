// Google OAuth 기반 인증 컨텍스트
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import {
  initTokenClient,
  ensureAuthenticated,
  logout as gDriveLogout,
} from '@/shared/lib/google-drive-service'

interface AuthContextValue {
  authenticated: boolean
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initTokenClient()
    ensureAuthenticated()
      .then(() => setAuthenticated(true))
      .catch(() => setAuthenticated(false))
      .finally(() => setLoading(false))
  }, [])

  const signIn = useCallback(async () => {
    await ensureAuthenticated()
    setAuthenticated(true)
  }, [])

  const signOut = useCallback(() => {
    gDriveLogout()
    setAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ authenticated, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
