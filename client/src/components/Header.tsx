interface HeaderProps {
  onAddTransaction?: () => void;
  pageTitle: string;
}

export function Header({ onAddTransaction, pageTitle }: HeaderProps) {
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
      </div>
    </header>
  );
}