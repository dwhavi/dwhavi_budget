// 404 페이지 — 잘못된 경로 접근 시 표시
import { useNavigate } from 'react-router-dom'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-gray-100 mb-2">페이지를 찾을 수 없습니다</h1>
        <p className="text-gray-500 mb-8 text-sm">요청하신 경로가 존재하지 않습니다.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
        >
          홈으로 가기
        </button>
      </div>
    </div>
  )
}
