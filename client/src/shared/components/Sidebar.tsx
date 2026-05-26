// 데스크톱 사이드바 네비게이션 — 로고, 네비게이션 탭, 사용자 정보, 로그아웃
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const NAV_ITEMS = [
  { path: '/', label: '지출', icon: '💸' },
  { path: '/overview', label: '현황', icon: '📊' },
  { path: '/transactions', label: '내역', icon: '📋' },
  { path: '/settings', label: '설정', icon: '⚙️' },
] as const

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <aside className="hidden lg:flex lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-64 lg:flex-col lg:bg-gray-900 lg:border-r lg:border-gray-800 z-30">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-800">
        <span className="text-2xl" aria-hidden="true">💸</span>
        <h1 className="text-xl font-bold text-gray-100">가계부</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-600/15 text-blue-400'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="text-lg leading-none" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-gray-800">
        {user?.email && (
          <p className="text-xs text-gray-500 truncate mb-3">{user.email}</p>
        )}
        <button
          onClick={handleSignOut}
          className="w-full px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-gray-200
                     bg-gray-800 hover:bg-gray-700 rounded-lg transition border border-gray-700"
        >
          로그아웃
        </button>
      </div>
    </aside>
  )
}
