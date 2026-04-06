import { useTheme } from '../contexts/ThemeContext';

interface HeaderProps {
  onAddTransaction?: () => void;
  pageTitle: string;
}

export function Header({ onAddTransaction, pageTitle }: HeaderProps) {
  const { toggleTheme } = useTheme();

const showAddButton = pageTitle === '대시보드' || pageTitle === '거래 내역';

  return (
    <header className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur border-b border-gray-800 px-6 py-4 flex items-center justify-between">
<div>
  <h2 className="text-xl font-bold text-gray-100">{pageTitle}</h2>
  <p className="text-sm text-gray-500">2026년 4월</p>
</div>
      <div className="flex items-center gap-3">
        {showAddButton && (
          <button
            onClick={onAddTransaction}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
          >
            + 수입/지출 등록
          </button>
        )}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-400 hover:text-gray-200 transition"
          aria-label="테마 전환"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}