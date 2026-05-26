// 원화 금액 입력 — 천단위 콤마 자동 포맷팅
import { useState, useEffect, type ChangeEvent } from 'react'

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number
  onChange: (value: number) => void
}

export function CurrencyInput({ value, onChange, className = '', ...props }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState<string>(value === 0 ? '0' : value.toLocaleString('ko-KR'))

  useEffect(() => {
    // 부모 컴포넌트에서 전달된 value가 변경될 때마다 화면에 찍히는 값 업데이트
    setDisplayValue(value === 0 ? '0' : value.toLocaleString('ko-KR'))
  }, [value])

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let rawStr = e.target.value

    // 1. 숫자 이외의 문자 제거 (콤마 등)
    rawStr = rawStr.replace(/[^0-9]/g, '')

    // 2. 만약 값을 다 지워서 빈 문자가 되었다면 0으로 처리
    if (rawStr === '') {
      rawStr = '0'
    }
    // 3. 처음에 0이 있는 상태에서 다른 숫자를 입력하면 앞의 0을 제거
    else if (rawStr.length > 1 && rawStr.startsWith('0')) {
      rawStr = rawStr.replace(/^0+/, '')
      if (rawStr === '') rawStr = '0'
    }

    // 4. 숫자로 변환한 뒤 부모 컴포넌트로 전달
    const numericValue = parseInt(rawStr, 10)
    onChange(numericValue)
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      className={className}
      {...props}
    />
  )
}
