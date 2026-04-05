import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface MobileNavProps {
}

export function MobileNav({}: MobileNavProps) {
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
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800">
      <div className="flex">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition ${
              isActive(item.path)
                ? 'text-blue-400'
                : 'text-gray-500'
            }`}
          >
            <span className="text-lg mb-1">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
        {user?.role === 'admin' && adminNavItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex-1 flex flex-col items-center justify-center py-2 px-1 transition ${
              isActive(item.path)
                ? 'text-blue-400'
                : 'text-gray-500'
            }`}
          >
            <span className="text-lg mb-1">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}