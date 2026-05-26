// 저축률 원형 프로그레스바 — conic-gradient 기반
interface SavingsRateProps {
  savingsRate: number // 0~100
}

function getRateColor(rate: number): { ring: string; text: string; label: string } {
  if (rate >= 30) {
    return { ring: '#4ade80', text: 'text-green-400', label: '훌륭해요!' }
  }
  if (rate >= 10) {
    return { ring: '#facc15', text: 'text-yellow-400', label: '괜찮아요' }
  }
  return { ring: '#f87171', text: 'text-red-400', label: '주의 필요' }
}

export function SavingsRate({ savingsRate }: SavingsRateProps) {
  const clampedRate = Math.max(0, Math.min(100, savingsRate))
  const { ring, text, label } = getRateColor(clampedRate)

  // conic-gradient: 채워진 부분 + 남은 부분
  const conicGradient = `conic-gradient(${ring} ${clampedRate * 3.6}deg, #1f2937 ${clampedRate * 3.6}deg)`

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
      <h3 className="text-gray-400 text-sm font-medium mb-4">저축률</h3>
      <div className="flex items-center gap-6">
        {/* 원형 프로그레스바 */}
        <div className="relative flex-shrink-0">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{ background: conicGradient }}
          >
            <div className="w-18 h-18 rounded-full bg-gray-900 flex items-center justify-center">
              <span className={`text-2xl font-bold ${text}`}>
                {clampedRate}
                <span className="text-sm ml-0.5">%</span>
              </span>
            </div>
          </div>
        </div>

        {/* 설명 */}
        <div className="flex flex-col gap-1">
          <span className={`text-sm font-medium ${text}`}>{label}</span>
          <p className="text-gray-500 text-xs leading-relaxed">
            수입 대비 저축 비율입니다.
            <br />
            30% 이상이면 건강한 재정 상태입니다.
          </p>
        </div>
      </div>
    </div>
  )
}
