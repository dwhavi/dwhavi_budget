// 하단 탭 네비게이션 — 4개 탭(지출, 현황, 내역, 설정) 전환 컴포넌트
import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path: '/', label: '지출', icon: '💸' },
  { path: '/overview', label: '현황', icon: '📊' },
  { path: '/transactions', label: '내역', icon: '📋' },
  { path: '/settings', label: '설정', icon: '⚙️' },
] as const

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-gray-800 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="max-w-lg mx-auto flex items-center justify-around h-14">
        {TABS.map((tab) => {
          const active = isActive(tab.path)
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full min-h-[44px] transition-colors ${
                active ? 'text-blue-400' : 'text-gray-500'
              }`}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              <span className="text-lg leading-none" aria-hidden="true">{tab.icon}</span>
              <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
