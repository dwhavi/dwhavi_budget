-- 가계부 RLS 정책: 모든 테이블에 행 수준 보안 적용
-- 1인용이므로 user_id = auth.uid() 기반 단순 정책

-- ============================================================
-- profiles RLS
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE USING (id = auth.uid());

-- ============================================================
-- categories RLS
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select" ON categories
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "categories_insert" ON categories
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "categories_update" ON categories
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "categories_delete" ON categories
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- payment_methods RLS
-- ============================================================
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_methods_select" ON payment_methods
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "payment_methods_insert" ON payment_methods
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "payment_methods_update" ON payment_methods
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "payment_methods_delete" ON payment_methods
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- transactions RLS
-- ============================================================
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_select" ON transactions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "transactions_insert" ON transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_update" ON transactions
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "transactions_delete" ON transactions
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- budgets RLS
-- ============================================================
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_select" ON budgets
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "budgets_insert" ON budgets
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "budgets_update" ON budgets
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "budgets_delete" ON budgets
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- recurring_expenses RLS
-- ============================================================
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recurring_expenses_select" ON recurring_expenses
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "recurring_expenses_insert" ON recurring_expenses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "recurring_expenses_update" ON recurring_expenses
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "recurring_expenses_delete" ON recurring_expenses
  FOR DELETE USING (user_id = auth.uid());
