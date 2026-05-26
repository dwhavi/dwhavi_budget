import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
}

export function Sidebar({}: SidebarProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems = [
    { icon: '📊', label: '대시보드', path: '/dashboard' },
    { icon: '📋', label: '기록', path: '/transactions' },
    { icon: '📈', label: '통계', path: '/stats' },
    { icon: '⚙️', label: '설정', path: '/settings' },
  ];

  const adminNavItems = [
    { icon: '👑', label: '관리자', path: '/admin' },
  ];

  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 h-screen">
      <div className="p-5 border-b border-gray-800">
        <h1 className="text-lg font-bold text-blue-400">💰 가계부</h1>
      </div>
      <nav className="flex-1 py-4">
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`nav-item flex items-center gap-3 px-5 py-3 text-sm font-medium w-full text-left transition ${
                isActive(item.path)
                  ? 'bg-blue-500/15 text-blue-400 border-r-3 border-blue-500'
                  : 'text-gray-400 hover:bg-gray-800/50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
          {user?.role === 'admin' && adminNavItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`nav-item flex items-center gap-3 px-5 py-3 text-sm font-medium w-full text-left transition ${
                isActive(item.path)
                  ? 'bg-blue-500/15 text-blue-400 border-r-3 border-blue-500'
                  : 'text-gray-400 hover:bg-gray-800/50'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      <div className="p-4 border-t border-gray-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold">
          {user?.display_name?.charAt(0) || 'M'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate text-gray-100">
            {user?.display_name || '마스터'}
          </div>
          <div className="text-xs text-gray-500 truncate">
            {user?.email || 'master@email.com'}
          </div>
        </div>
      </div>
    </aside>
  );
}