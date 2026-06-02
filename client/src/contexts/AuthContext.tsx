// Google OAuth 기반 인증 컨텍스트
import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  extractTokenFromHash,
  getAuthUrl,
  logout as gDriveLogout,
} from '@/shared/lib/google-drive-service'

interface AuthContextValue {
  authenticated: boolean
  signIn: () => void
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(() => !!extractTokenFromHash())

  const signIn = useCallback(() => {
    window.location.href = getAuthUrl('select_account')
  }, [])

  const signOut = useCallback(() => {
    gDriveLogout()
    setAuthenticated(false)
  }, [])

  return (
    <AuthContext.Provider value={{ authenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
