// 페이지네이션 — 이전/다음 + 페이지 번호 (모바일에서는 번호 생략)
interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const canPrev = page > 1
  const canNext = page < totalPages

  function getPageNumbers(): (number | '...')[] {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const pages: (number | '...')[] = [1]

    if (page > 3) pages.push('...')

    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (page < totalPages - 2) pages.push('...')

    pages.push(totalPages)
    return pages
  }

  const pageNumbers = getPageNumbers()

  const baseButtonClass =
    'px-3 py-2 text-sm font-medium rounded-lg transition min-w-[44px] min-h-[44px] flex items-center justify-center'

  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={!canPrev}
        className={`${baseButtonClass} bg-gray-800 border border-gray-700 text-gray-100 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="이전 페이지"
      >
        ‹
      </button>

      {/* 데스크톱: 페이지 번호 표시 */}
      <div className="hidden sm:flex items-center gap-1">
        {pageNumbers.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-gray-500 text-sm">
              …
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${baseButtonClass} ${
                p === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-gray-100 hover:bg-gray-700'
              }`}
            >
              {p}
            </button>
          ),
        )}
      </div>

      {/* 모바일: 현재 페이지 / 전체 */}
      <span className="sm:hidden text-sm text-gray-400 px-3">
        {page} / {totalPages}
      </span>

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={!canNext}
        className={`${baseButtonClass} bg-gray-800 border border-gray-700 text-gray-100 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed`}
        aria-label="다음 페이지"
      >
        ›
      </button>
    </div>
  )
}
