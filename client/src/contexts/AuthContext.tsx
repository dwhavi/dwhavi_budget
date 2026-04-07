import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { User, LoginRequest, RegisterRequest } from '../types/index.js';
import { authApi } from '../api/auth.js';

const PUBLIC_PATHS = ['/login', '/register'];

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  useEffect(() => {
    const isPublic = PUBLIC_PATHS.some((p) => window.location.pathname.startsWith(p));
    if (isPublic) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function restoreSession() {
      try {
        try {
          const res = await authApi.me();
          if (!cancelled && res.data?.data?.user) {
            setUser(res.data.data.user);
            return;
          }
        } catch {
          // ignore
        }

        try {
          const refreshRes = await authApi.refresh();
          if (!cancelled && refreshRes.data?.data?.accessToken) {
            localStorage.setItem('accessToken', refreshRes.data.data.accessToken);
            if (refreshRes.data.data.user) {
              setUser(refreshRes.data.data.user);
              return;
            }
            const meRes = await authApi.me();
            if (!cancelled && meRes.data?.data?.user) {
              setUser(meRes.data.data.user);
            }
          }
        } catch {
          // ignore
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    const payload = res.data?.data;
    if (!payload) throw new Error('로그인에 실패했습니다.');
    localStorage.setItem('accessToken', payload.accessToken);
    setUser(payload.user);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await authApi.register(data);
    const payload = res.data?.data;
    if (!payload) throw new Error('회원가입에 실패했습니다.');
    localStorage.setItem('accessToken', payload.accessToken);
    setUser(payload.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
