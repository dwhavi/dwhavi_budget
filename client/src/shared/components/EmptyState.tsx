// 빈 상태 표시 — 데이터가 없을 때 아이콘 + 안내 문구 + CTA 버튼
interface EmptyStateProps {
  icon?: string
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <span className="text-4xl mb-4" aria-hidden="true">{icon}</span>
      )}
      <h3 className="text-gray-100 font-semibold text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-gray-400 text-sm max-w-xs mb-6">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg
                     font-medium transition min-h-[44px]"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
