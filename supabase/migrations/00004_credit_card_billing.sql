-- 신용카드 결제일/취합기간 컬럼 추가 + transactions transfer 타입 추가

-- 1. payment_methods: 결제기간 시작일 (신용카드 전용, NULL 허용)
ALTER TABLE payment_methods
  ADD COLUMN IF NOT EXISTS billing_start_day INTEGER;

-- 2. payment_methods: 실제 결제일 (신용카드 전용, NULL 허용)
ALTER TABLE payment_methods
  ADD COLUMN IF NOT EXISTS payment_day INTEGER;

-- 3. transactions.type CHECK 제약에 'transfer' 추가
DO $$
BEGIN
  -- 기존 제약 제거
  ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
  -- 새 제약 추가
  ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
    CHECK (type IN ('income', 'expense', 'transfer'));
END $$;
