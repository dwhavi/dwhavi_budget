// 원화 포맷 유틸리티
export function formatWon(amount: number): string {
  return amount.toLocaleString('ko-KR') + '원'
}

export function formatWonCompact(amount: number): string {
  if (amount >= 10000) {
    const man = Math.floor(amount / 10000)
    const rest = amount % 10000
    return rest > 0
      ? `${man}만 ${rest.toLocaleString('ko-KR')}원`
      : `${man}만원`
  }
  return amount.toLocaleString('ko-KR') + '원'
}
