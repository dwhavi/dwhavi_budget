# Learnings - Budget App

## Project Context
- Greenfield project → Supabase 전환 완료 (Express+SQLite → Supabase 직접 쿼리, Google OAuth 로그인)
- Korean language interface (hardcoded, no i18n)
- Tech stack: React 19 + Vite + TypeScript, Tailwind CSS + Recharts, TanStack React Query
- PWA (vite-plugin-pwa, Workbox, generateSW)
- 배포: Vercel (GitHub 연동 안 됨, `vercel --prod` 수동 배포 필요)
- Auth: Supabase Auth + Google OAuth, RLS 기반 접근 제어
- **모든 시간은 KST(UTC+9) 기준** — DB에 UTC 저장되더라도 표시/입력/변환 모두 KST

## Active Routes (App.tsx)
- `/` → ExpenseDashboardPage (features/expense-dashboard/)
- `/overview` → OverviewPage (features/overview/)
- `/transactions` → TransactionsPage (features/transactions/)
- `/settings` → SettingsPage (features/settings/)
- `/login` → LoginPage (features/auth/)
- 구버전 pages/ 디렉토리 있으나 사용 안 함 (라우팅 안 됨)

## Key Spec Notes
- First registered user → profile 트리거 → 기본 카테고리 12개 + 현금 결제수단 자동 생성
- Category: user_id=null이면 전역 카테고리, not null이면 개인 카테고리
- Soft delete: deleted_at 필드 (Category, Transaction, PaymentMethod, RecurringExpense)
- Amount: 1 ~ 99,999,999 (INTEGER)
- Transaction.type: 'income' | 'expense' | 'transfer' (migration 00004에서 transfer 추가)
- PaymentMethod에 billing_start_day, payment_day 추가됨 (migration 00004)

## 이번 세션에서 발견한 버그/수정 내역

### 1. 커스텀 카테고리/결제수단 직접입력 미동작 (feat)
- **원인**: features/TransactionForm이 onSubmit에 customCategoryName/customPaymentMethodName 전달 안 함
- **해결**: onSubmit 시그니처 확장 + 부모 핸들러에서 useCreateCategory/useCreatePaymentMethod로 선 생성

### 2. 30일 이하 달에서 날짜 쿼리 실패 (fix)
- **원인**: 모든 월별 쿼리가 `${month}-31` 하드코딩 → 6월(30일)에서 `'2026-06-31'` 유효하지 않은 날짜 → Postgres 에러
- **해결**: `getMonthEndDate()` 유훨리티로 실제 마지막 날 계산 (useStats.ts, useTransactions.ts)

### 3. PWA 서비스워커 API 응답 캐싱으로 화면 갱신 안 됨 (fix)
- **원인**: vite.config.ts에 `runtimeCaching`에서 Supabase API를 `StaleWhileRevalidate`로 24시간 캐싱
- **해결**: `NetworkFirst`로 변경 (온라인 시 항상 최신 데이터, 오프라인 시에만 캐시 폴백)

### 4. 거래 수정 시 created_at 시차 버그 (fix)
- **원인**: UTC 날짜 + KST 로컬 시간을 단순 문자열 조합 → 시차 꼬임
- **해결**: `new Date()` → `setHours()` → `toISOString()` 으로 UTC/KST 변환 정상 처리

## Architecture Patterns
- TransactionForm: features/ 버전이 활성 (components/ 버전은 미사용)
- ExpenseDashboardPage: useCreateTransaction → handleFormSubmit에서 커스텀 생성 후 insert
- React Query: staleTime 5분, refetchOnWindowFocus false (서비스워커가 API 캐싱 담당)
- Query key: ['stats', 'expense-summary', ...], ['transactions', ...] — invalidateQueries로 prefix matching
- Supabase RLS: 모든 테이블 user_id = auth.uid() 기반 단순 정책
