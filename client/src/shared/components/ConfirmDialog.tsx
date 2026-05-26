// 확인 대화상자 — 삭제 등 위험 동작 확인용
import { Modal } from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
}: ConfirmDialogProps) {
  const confirmClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-blue-600 hover:bg-blue-700'

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="pt-2">
        <p className="text-gray-300 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg
                       font-medium transition min-h-[44px]"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-3 ${confirmClass} text-white rounded-lg
                        font-medium transition min-h-[44px]`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}
