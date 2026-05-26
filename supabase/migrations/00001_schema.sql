-- 가계부 스키마: 테이블 생성
-- 1인용 가계부, Google 로그인 전용

-- ============================================================
-- profiles: auth.users와 1:1 매핑되는 사용자 프로필
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- categories: 수입/지출 카테고리
-- ============================================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  type VARCHAR(7) NOT NULL CHECK (type IN ('income', 'expense')),
  icon VARCHAR(10) NOT NULL,
  color VARCHAR(7) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ
);

-- 소프트 삭제된 항목은 유니크 제약에서 제외
CREATE UNIQUE INDEX idx_categories_user_name_type
  ON categories(user_id, name, type)
  WHERE deleted_at IS NULL;

-- 유형별 필터링
CREATE INDEX idx_categories_user_type
  ON categories(user_id, type);

-- ============================================================
-- payment_methods: 결제 수단
-- ============================================================
CREATE TABLE payment_methods (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  issuer VARCHAR(50),
  type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit', 'cash', 'transfer')),
  color VARCHAR(7),
  is_default BOOLEAN NOT NULL DEFAULT false,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 소프트 삭제 필터링
CREATE INDEX idx_payment_methods_user_deleted
  ON payment_methods(user_id, deleted_at);

-- ============================================================
-- transactions: 거래 내역
-- ============================================================
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(7) NOT NULL CHECK (type IN ('income', 'expense')),
  amount INTEGER NOT NULL CHECK (amount >= 1 AND amount <= 99999999),
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  payment_method_id INTEGER REFERENCES payment_methods(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  sub_category VARCHAR(50),
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- 월별 조회용 복합 인덱스
CREATE INDEX idx_transactions_user_date
  ON transactions(user_id, date);

-- 소프트 삭제 필터링
CREATE INDEX idx_transactions_user_deleted
  ON transactions(user_id, deleted_at);

-- ============================================================
-- budgets: 월별 카테고리 예산
-- ============================================================
CREATE TABLE budgets (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL CHECK (month ~ '^\d{4}-\d{2}$'),
  amount INTEGER NOT NULL CHECK (amount >= 1),
  UNIQUE(user_id, category_id, month)
);

-- ============================================================
-- recurring_expenses: 정기 지출
-- ============================================================
CREATE TABLE recurring_expenses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 1),
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  payment_method_id INTEGER REFERENCES payment_methods(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  memo TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
