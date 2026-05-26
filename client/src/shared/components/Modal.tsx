// 모달/바텀시트 — 모바일에서는 하단 슬라이드업, 데스크톱에서는 중앙 모달
import { useEffect, useRef } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
      {/* 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 패널 */}
      <div
        ref={panelRef}
        className="relative w-full lg:max-w-md bg-gray-900
                   rounded-t-2xl lg:rounded-2xl
                   max-h-[85vh] flex flex-col
                   shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 shrink-0">
          <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-200 transition rounded-lg
                       min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 바디 */}
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}
