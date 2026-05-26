-- 가계부 트리거: 자동 생성 및 updated_at 갱신
-- auth.users → profiles 자동 생성, 기본 카테고리/결제수단 시드, updated_at 자동 갱신

-- ============================================================
-- 4-1. auth.users 생성 시 profiles 자동 INSERT
-- display_name: raw_user_meta_data의 full_name → name → email 앞부분 순서로 fallback
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    )
  );
  RETURN NEW;
END;
$$;

-- auth.users AFTER INSERT 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 4-2. profiles 생성 시 기본 데이터 자동 생성
-- 수입 카테고리 3개, 지출 카테고리 9개, 현금 결제수단
-- ============================================================
CREATE OR REPLACE FUNCTION public.seed_default_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- 수입 카테고리
  INSERT INTO public.categories (user_id, name, type, icon, color, sort_order) VALUES
    (NEW.id, '급여',   'income', '💰', '#3B82F6', 1),
    (NEW.id, '부수입', 'income', '💼', '#10B981', 2),
    (NEW.id, '용돈',   'income', '🎁', '#F59E0B', 3);

  -- 지출 카테고리
  INSERT INTO public.categories (user_id, name, type, icon, color, sort_order) VALUES
    (NEW.id, '식비', 'expense', '🍔', '#EF4444', 1),
    (NEW.id, '교통', 'expense', '🚗', '#3B82F6', 2),
    (NEW.id, '주거', 'expense', '🏠', '#8B5CF6', 3),
    (NEW.id, '통신', 'expense', '📱', '#14B8A6', 4),
    (NEW.id, '유흥', 'expense', '🎮', '#EC4899', 5),
    (NEW.id, '쇼핑', 'expense', '🛍️', '#F97316', 6),
    (NEW.id, '의료', 'expense', '🏥', '#10B981', 7),
    (NEW.id, '교육', 'expense', '📚', '#6366F1', 8),
    (NEW.id, '기타', 'expense', '📝', '#64748B', 9);

  -- 현금 결제수단 (기본)
  INSERT INTO public.payment_methods (user_id, name, type, is_default)
  VALUES (NEW.id, '현금', 'cash', true);

  RETURN NEW;
END;
$$;

-- profiles AFTER INSERT 트리거
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_data();

-- ============================================================
-- 4-3. updated_at 자동 갱신 트리거
-- profiles, payment_methods, transactions, recurring_expenses에 적용
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 각 테이블에 updated_at 갱신 트리거 적용
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_recurring_expenses_updated_at
  BEFORE UPDATE ON public.recurring_expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
