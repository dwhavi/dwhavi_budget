# 가계부 앱 (Budget App) v2 — Supabase 전환 + UX 고도화

## TL;DR

> **Quick Summary**: 기존 Express+SQLite 백엔드를 Supabase로 전환하고, 지출-퍼스트 프라이버시 설계로 전면 재구축한다. 모바일 폰 주력, PWA, 다크모드 전용.
>
> **Deliverables**:
> - Supabase 기반 백엔드 (PostgreSQL + Auth + RLS)
> - 지출 대시보드 (프라이버시 안전, 첫 화면)
> - 전체 현황 탭 (수입/잔액, 프라이버시 구역)
> - 거래 내역 (필터/검색/CRUD)
> - 통계 페이지
> - 설정 페이지 (카드/예산/고정비/카테고리)
> - PWA (홈화면 설치, 오프라인 조회)
> - Google 로그인
>
> **Estimated Effort**: L (18 태스크, 5 웨이브)
> **Critical Path**: T1(Supabase) → T4(데이터 훅) → T5(지출 대시보드) → T12(PWA) → F1-F4

---

## Context

### 결정 사항

| # | 항목 | 결정 |
|---|------|------|
| 1 | 사용자 | 1인용 (admin/role/사용자관리 제거) |
| 2 | 기존 데이터 | 없음 (Supabase 클린 시작) |
| 3 | 로그인 | Google 로그인만 (이메일/비밀번호 회원가입 제거) |
| 4 | 고정비 | 수동 등록 (자동 스케줄링 없음) |
| 5 | 주력 기기 | 모바일 폰 (모바일 퍼스트 설계) |
| 6 | PWA | 적용 (홈화면 설치, 전체화면, 오프라인 조회) |
| 7 | 테마 | 다크모드 전용 (토글 없음) |
| 8 | 백엔드 | Supabase (Express 서버 제거) |
| 9 | 데이터 페칭 | React Query (TanStack Query) |
| 10 | 메인 화면 | 지출-퍼스트 (수입 노출 안 함) |
| 11 | 수입/잔액 | 별도 "전체 현황" 탭에서만 표시 |

### 삭제되는 것

- `server/` 디렉토리 전체 (Express, Sequelize, SQLite, JWT 직접 구현)
- Admin 페이지 + 라우트 + API
- Role 시스템 (admin/user)
- 이메일/비밀번호 회원가입 + 로그인 페이지
- RegisterPage
- ThemeContext (다크 전용)
- Docker 관련 파일 (docker-compose.yml, Dockerfile, deploy.sh)
- `@react-oauth/google` → Supabase Auth로 교체
- `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `cors` (서버 의존성)

### 탭 구조 (모바일 하단 네비게이션)

```
📱 지출    │  📊 현황  │  📋 내역  │  ⚙️ 설정
```

| 탭 | 라우트 | 내용 | 프라이버시 |
|----|--------|------|-----------|
| 지출 (기본) | `/` | 지출 요약, 카테고리 도넛, 일일 추이, 캘린더, 결제수단 | ✅ 안전 |
| 현황 | `/overview` | 수입/지출/잔액, 저축률, 월별 추이, 수입 분해 | 🔒 노출 주의 |
| 내역 | `/transactions` | 거래 목록, 필터, CRUD, 검색 | 🔒 노출 주의 |
| 설정 | `/settings` | 카드 관리, 예산, 고정비, 카테고리 | 🔒 노출 주의 |

---

## Architecture

### Supabase 스키마

```sql
-- profiles (Supabase Auth users와 1:1)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT NOT NULL DEFAULT '📝',
  color TEXT NOT NULL DEFAULT '#6B7280',
  sort_order INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, name, type)
);

-- payment_methods
CREATE TABLE payment_methods (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issuer TEXT DEFAULT '',
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'cash', 'transfer')),
  color TEXT DEFAULT '#3B82F6',
  is_default BOOLEAN DEFAULT false,
  memo TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- transactions
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount INTEGER NOT NULL CHECK (amount >= 1 AND amount <= 99999999),
  category_id INTEGER NOT NULL REFERENCES categories(id),
  payment_method_id INTEGER REFERENCES payment_methods(id),
  date DATE NOT NULL,
  sub_category TEXT,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- budgets
CREATE TABLE budgets (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  month TEXT NOT NULL CHECK (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  amount INTEGER NOT NULL CHECK (amount >= 1),
  UNIQUE(user_id, category_id, month)
);

-- recurring_expenses
CREATE TABLE recurring_expenses (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 1),
  category_id INTEGER NOT NULL REFERENCES categories(id),
  payment_method_id INTEGER NOT NULL REFERENCES payment_methods(id),
  start_date DATE NOT NULL,
  end_date DATE,
  memo TEXT DEFAULT '',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
```

### RLS (Row Level Security) 정책

모든 테이블에 `user_id = auth.uid()` 기반 RLS 적용. 사용자는 자신의 데이터만 접근 가능.

### 프론트엔드 폴더 구조

```
client/src/
├── features/
│   ├── expense-dashboard/          # 지출 대시보드 탭
│   │   ├── ExpenseDashboardPage.tsx
│   │   ├── ExpenseSummaryCards.tsx
│   │   ├── CategoryDonutChart.tsx
│   │   ├── DailyTrendChart.tsx
│   │   ├── PaymentMethodBreakdown.tsx
│   │   ├── BudgetProgressList.tsx
│   │   ├── CalendarSection.tsx
│   │   ├── DayDetailPanel.tsx
│   │   └── RecentExpenses.tsx
│   │
│   ├── overview/                   # 전체 현황 탭
│   │   ├── OverviewPage.tsx
│   │   ├── IncomeExpenseSummary.tsx
│   │   ├── SavingsRate.tsx
│   │   ├── MonthlyTrendChart.tsx
│   │   └── IncomeBreakdown.tsx
│   │
│   ├── transactions/               # 거래 내역 탭
│   │   ├── TransactionsPage.tsx
│   │   ├── TransactionList.tsx
│   │   ├── TransactionRow.tsx
│   │   ├── FilterBar.tsx
│   │   ├── Pagination.tsx
│   │   └── TransactionForm.tsx
│   │
│   ├── settings/                   # 설정 탭
│   │   ├── SettingsPage.tsx
│   │   ├── PaymentMethodTab.tsx
│   │   ├── BudgetTab.tsx
│   │   ├── RecurringExpenseTab.tsx
│   │   ├── CategoryTab.tsx
│   │   └── forms/
│   │       ├── PaymentMethodForm.tsx
│   │       ├── BudgetForm.tsx
│   │       ├── RecurringExpenseForm.tsx
│   │       └── CategoryForm.tsx
│   │
│   └── auth/
│       ├── LoginPage.tsx
│       └── AuthCallback.tsx
│
├── shared/
│   ├── hooks/
│   │   ├── useMonthNavigation.ts   # 전역 월 상태 (Context)
│   │   ├── useCategories.ts        # React Query
│   │   ├── usePaymentMethods.ts    # React Query
│   │   ├── useTransactions.ts      # React Query
│   │   ├── useBudgets.ts           # React Query
│   │   ├── useRecurringExpenses.ts # React Query
│   │   ├── useStats.ts             # React Query
│   │   └── useCurrency.ts          # 원화 포맷 유틸
│   │
│   ├── components/
│   │   ├── Layout.tsx              # 모바일 하단 탭바 포함
│   │   ├── BottomNav.tsx           # 모바일 하단 네비게이션
│   │   ├── Modal.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── Skeleton.tsx
│   │   ├── CurrencyInput.tsx
│   │   └── EmptyState.tsx          # 데이터 없을 때 화면
│   │
│   ├── lib/
│   │   ├── supabase.ts             # Supabase 클라이언트
│   │   └── queryClient.ts          # React Query 설정
│   │
│   └── types/
│       └── index.ts                # TypeScript 타입 정의
│
├── App.tsx
├── main.tsx
└── index.css                       # Tailwind CSS + 다크모드 전용 스타일
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — NO dependencies):
├── Task 1:  Supabase 프로젝트 설정 + 스키마 + RLS + 시드 [deep]
├── Task 2:  클라이언트 클린업 + Supabase 클라이언트 세팅 + React Query [unspecified-high]
└── Task 3:  Google 로그인 + Auth 콜백 + 라우트 가드 [deep]

Wave 2 (Data Layer — After Wave 1):
├── Task 4:  공유 훅 (useMonthNavigation, useCategories, usePaymentMethods, useTransactions, useStats, useBudgets, useRecurringExpenses) [deep]
└── Task 5:  공유 컴포넌트 (Layout, BottomNav, Modal, ConfirmDialog, Skeleton, CurrencyInput, EmptyState) [visual-engineering]

Wave 3 (Core Pages — After Wave 2, MAX PARALLEL):
├── Task 6:  지출 대시보드 (전체 구현) [visual-engineering]
├── Task 7:  전체 현황 페이지 [visual-engineering]
├── Task 8:  거래 내역 페이지 [visual-engineering]
└── Task 9:  설정 페이지 (카드/예산/고정비/카테고리) [visual-engineering]

Wave 4 (Polish — After Wave 3):
├── Task 10: PWA 설정 (manifest, service worker, 아이콘) [quick]
├── Task 11: 반응형 데스크톱 레이아웃 (사이드바) [visual-engineering]
└── Task 12: 전체 통합 테스트 + 버그 수정 [deep]

Wave FINAL (Verification):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real QA with Playwright — 모바일+데스크톱 (unspecified-high + playwright)
└── F4: Scope fidelity check (deep)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | - | 4 | 1 |
| 2 | - | 3, 4, 5 | 1 |
| 3 | 2 | 4 | 1 |
| 4 | 1, 2, 3 | 6, 7, 8, 9 | 2 |
| 5 | 2 | 6, 7, 8, 9 | 2 |
| 6 | 4, 5 | 10, 11 | 3 |
| 7 | 4, 5 | 10, 11 | 3 |
| 8 | 4, 5 | 10, 11 | 3 |
| 9 | 4, 5 | 10, 11 | 3 |
| 10 | 6, 7, 8, 9 | 12 | 4 |
| 11 | 6, 7, 8, 9 | 12 | 4 |
| 12 | 10, 11 | F1-F4 | 4 |

---

## TODOs

- [ ] 1. Supabase 프로젝트 설정 + 스키마 + RLS + 시드

  **What to do**:
  - Supabase 프로젝트 생성 (supabase.com 또는 로컬 Docker)
  - 위 스키마대로 PostgreSQL 테이블 생성 (마이그레이션 파일)
  - RLS 정책 작성: 모든 테이블에 `USING (user_id = auth.uid())`
  - Google Auth 프로바이더 활성화
  - 트리거: `auth.users` 생성 시 `profiles` 자동 INSERT
  - 트리거: 회원가입 시 기본 카테고리 12개 + "현금" 결제수단 자동 생성
  - 시드: 기본 카테고리 (수입 3개 + 지출 9개)
  - 마이그레이션 실행 및 동작 확인

  **Must NOT do**:
  - 이메일/비밀번호 Auth 활성화하지 마세요 (Google만)
  - admin/user role 컬럼 추가하지 마세요
  - API 키를 코드에 하드코딩하지 마세요

  **Acceptance Criteria**:
  - [ ] 모든 테이블 생성됨
  - [ ] RLS 활성화, 다른 사용자 데이터 접근 불가
  - [ ] Google 로그인 시 profile + 기본 카테고리 + 현금 자동 생성
  - [ ] Supabase 대시보드에서 테이블/RLS 확인 가능

- [ ] 2. 클라이언트 클린업 + Supabase 클라이언트 세팅 + React Query

  **What to do**:
  - `server/` 디렉토리 삭제
  - `docker-compose.yml`, `Dockerfile`, `deploy.sh` 삭제
  - `client/src/api/` 전체 삭제 (axios 기반 API 호출)
  - `client/src/contexts/ThemeContext.tsx` 삭제
  - `client/src/pages/RegisterPage/` 삭제
  - `client/src/pages/Admin/` 삭제
  - `client/src/pages/Stats/` (빈 디렉토리) 삭제
  - `client/src/pages/Settings/` (빈 디렉토리) 삭제
  - `@supabase/supabase-js` 설치
  - `@tanstack/react-query` 설치
  - `src/shared/lib/supabase.ts` — Supabase 클라이언트 생성
  - `src/shared/lib/queryClient.ts` — React Query 설정
  - `src/main.tsx` — QueryClientProvider + Supabase Auth 리스너
  - `.env.example` 업데이트: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - `client/src/contexts/AuthContext.tsx` → Supabase Auth 기반으로 재작성
  - `features/` 폴더 구조 생성 (빈 파일들)
  - `App.tsx` 라우트 업데이트: `/` → ExpenseDashboard, `/overview`, `/transactions`, `/settings`
  - `package.json` 정리 (server 스크립트 제거)

  **Must NOT do**:
  - 기존 `client/src/pages/` 내 구현 파일들을 삭제하지 마세요 (참고용으로 유지, 나중에 교체)
  - `node_modules` 삭제하지 마세요

  **Acceptance Criteria**:
  - [ ] `server/` 디렉토리 삭제됨
  - [ ] Docker 관련 파일 삭제됨
  - [ ] Supabase 클라이언트 초기화됨
  - [ ] React Query 설정됨
  - [ ] AuthContext가 Supabase Auth 기반으로 동작
  - [ ] `npm run dev` 실행 시 빈 페이지라도 에러 없이 렌더링

- [ ] 3. Google 로그인 + Auth 콜백 + 라우트 가드

  **What to do**:
  - `src/features/auth/LoginPage.tsx` — Google 로그인 버튼만 있는 심플한 페이지
  - `src/features/auth/AuthCallback.tsx` — Supabase OAuth 콜백 처리
  - 라우트: `/login` → LoginPage, `/auth/callback` → AuthCallback
  - ProtectedRoute: 로그인 안 되어 있으면 `/login`으로 리다이렉트
  - 로그인 성공 시 `/` (지출 대시보드)로 이동
  - 로그아웃 기능 (설정 페이지에 배치)
  - AuthContext: `session` 상태 관리, `signInWithGoogle`, `signOut`

  **Must NOT do**:
  - 이메일/비밀번호 입력 폼 만들지 마세요
  - 회원가입 페이지 만들지 마세요

  **Acceptance Criteria**:
  - [ ] Google 로그인 버튼 클릭 → Google 인증 → 콜백 → 대시보드 진입
  - [ ] 미인증 시 `/login`으로 리다이렉트
  - [ ] 로그아웃 시 `/login`으로 이동
  - [ ] 세션 유지 (브라우저 재시작 시 자동 로그인)

- [ ] 4. 공유 훅 (React Query 기반)

  **What to do**:
  - `useMonthNavigation.ts` — Context 기반 전역 월 상태. `selectedMonth`, `prevMonth`, `nextMonth`
  - `useCategories.ts` — `useQuery`로 카테고리 목록 캐싱. `createCategory`, `updateCategory`, `deleteCategory` (useMutation)
  - `usePaymentMethods.ts` — 결제수단 CRUD
  - `useTransactions.ts` — 거래 CRUD + 필터/페이징. `createTransaction`, `updateTransaction`, `deleteTransaction`, `restoreTransaction`. mutation 성공 시 관련 쿼리 자동 무효화
  - `useStats.ts` — 대시보드용 집계 쿼리 (월별 지출 합계, 카테고리별, 일별, 결제수단별). Supabase RPC 또는 클라이언트에서 집계
  - `useBudgets.ts` — 예산 CRUD
  - `useRecurringExpenses.ts` — 고정비 CRUD + 토글
  - `useCurrency.ts` — `formatWon(amount)` 유틸

  **Supabase 쿼리 예시**:
  ```typescript
  // 월간 거래 조회
  const { data } = useQuery({
    queryKey: ['transactions', 'month', month],
    queryFn: async () => {
      const start = `${month}-01`
      const end = `${month}-31`
      const { data } = await supabase
        .from('transactions')
        .select('*, category:categories(*), payment_method:payment_methods(*)')
        .eq('user_id', userId)
        .gte('date', start)
        .lte('date', end)
        .is('deleted_at', null)
        .order('date', { ascending: false })
      return data
    },
  })
  ```

  **집계 전략**:
  - 카테고리별/결제수단별 통계는 클라이언트에서 `useMemo`로 집계 (Supabase에서 월간 거래를 가져온 후)
  - 월별 추이(6개월)는 별도 쿼리로 6개월치 데이터 조회 후 클라이언트 집계
  - 또는 Supabase RPC 함수로 서버 사이드 집계 (데이터 많아지면 전환)

  **Must NOT do**:
  - 모든 집계를 Supabase RPC로 만들지 마세요 (초기에는 클라이언트 집계로 충분)
  - `as any` 사용하지 마세요

  **Acceptance Criteria**:
  - [ ] 모든 훅이 React Query 기반으로 동작
  - [ ] mutation 성공 시 관련 캐시 자동 무효화
  - [ ] 월 네비게이션이 전역 상태로 동작
  - [ ] 타입 안전 (no `as any`)

- [ ] 5. 공유 컴포넌트

  **What to do**:
  - `Layout.tsx` — 모바일 하단 탭바 포함. `children` 영역. 로딩/에러 바운더리
  - `BottomNav.tsx` — 4개 탭 (지출/현황/내역/설정). 활성 탭 하이라이트. 아이콘 + 라벨
  - `Modal.tsx` — 바텀시트 스타일 (모바일), 모달 스타일 (데스크톱)
  - `ConfirmDialog.tsx` — 삭제 확인 등
  - `Skeleton.tsx` — 로딩 스켈레톤
  - `CurrencyInput.tsx` — 기존 것 재사용 (필요시 수정)
  - `EmptyState.tsx` — 데이터 없을 때 (아이콘 + 메시지 + CTA 버튼)

  **모바일 퍼스트 원칙**:
  - 모든 컴포넌트가 모바일 크기(375px)에서 먼저 잘 보이게 설계
  - 탭바는 `fixed bottom-0`, safe-area-inset 고려
  - 터치 타겟 최소 44px

  **Acceptance Criteria**:
  - [ ] 하단 탭바 4개 탭 정상 동작
  - [ ] 모바일 뷰포트에서 자연스러운 레이아웃
  - [ ] 모달이 바텀시트로 모바일에서 동작

- [ ] 6. 지출 대시보드 (전체 구현)

  **What to do**:
  - `ExpenseDashboardPage.tsx` — 오케스트레이터. 전역 month 상태 사용
  - `ExpenseSummaryCards.tsx` — 총지출, 일일가능금액 ("오늘까지 써도 되는 금액" 표시, 잔액 역산 어려운 형태). 예산 경고가 있으면 노란색/빨간색 표시
  - `CategoryDonutChart.tsx` — Recharts PieChart로 카테고리별 지출 비율. 범례 포함
  - `DailyTrendChart.tsx` — Recharts LineChart로 일일 지출 추이. X축: 1~31일
  - `PaymentMethodBreakdown.tsx` — 결제수단별 수평 막대 (신용카드/체크카드/현금 비율)
  - `BudgetProgressList.tsx` — 카테고리별 예산 진행 바. 70% 노랑, 90% 빨강
  - `CalendarSection.tsx` — 접기/펼치기 캘린더. 지출만 표시 (수입 숨김)
  - `DayDetailPanel.tsx` — 날짜 클릭 시 바텀시트로 해당 일 지출 목록
  - `RecentExpenses.tsx` — 최근 지출 5건 + "전체보기 →" 링크

  **레이아웃 (모바일)**:
  ```
  [◀ 월 네비게이션 ▶]  [+ 지출 등록]
  ┌─ 요약 카드 (총지출, 일일가능액) ─┐
  ├─ 카테고리 도넛 차트 ─────────────┤
  ├─ 일일 지출 추이 ─────────────────┤
  ├─ 결제수단별 │ 예산 진행 ─────────┤
  ├─ 캘린더 (접기/펼치기) ──────────┤
  └─ 최근 지출 5건 ─────────────────┘
  ```

  **프라이버시 원칙**:
  - 이 화면에 수입 관련 숫자가 단 하나도 없어야 함
  - "일일 가능 금액"은 숫자만 보여주고, 잔액이나 수입은 표시하지 않음

  **Must NOT do**:
  - 수입 데이터를 이 페이지에서 조회하지 마세요
  - 잔액(수입-지출)을 표시하지 마세요

  **Acceptance Criteria**:
  - [ ] 수입 관련 숫자가 화면에 0개
  - [ ] 카테고리 도넛 차트 정상 렌더링
  - [ ] 일일 추이 차트 정상 렌더링
  - [ ] 캘린더에 전체 월 지출 데이터가 정확히 표시됨
  - [ ] 날짜 클릭 → 해당 일 지출 상세 바텀시트 열림
  - [ ] "+ 지출 등록" 버튼 → 거래 등록 모달 열림

- [ ] 7. 전체 현황 페이지

  **What to do**:
  - `OverviewPage.tsx` — 오케스트레이터
  - `IncomeExpenseSummary.tsx` — 수입/지출/잔액 카드 (여기서만 수입 노출)
  - `SavingsRate.tsx` — 저축률 원형 프로그레스바 (수입-지출)/수입 × 100
  - `MonthlyTrendChart.tsx` — 6개월 수입 vs 지출 막대 차트
  - `IncomeBreakdown.tsx` — 수입 출처별 (급여/부수입/용돈) 수평 막대

  **Acceptance Criteria**:
  - [ ] 수입/지출/잔액 정상 표시
  - [ ] 저축률 퍼센트 표시
  - [ ] 6개월 추이 차트 정상 렌더링
  - [ ] 전월 대비 증감 표시 (▲▼)

- [ ] 8. 거래 내역 페이지

  **What to do**:
  - `TransactionsPage.tsx` — 오케스트레이터
  - `FilterBar.tsx` — 유형(수입/지출), 카테고리, 결제수단, 키워드 검색
  - `TransactionList.tsx` — 무한 스크롤 또는 페이지네이션
  - `TransactionRow.tsx` — 개별 거래 행. 카테고리 아이콘, 금액, 날짜, 결제수단. 클릭 → 수정 모달
  - `Pagination.tsx` — 페이지네이션
  - `TransactionForm.tsx` — 등록/수정 공통 폼. 하위카테고리 자동완성 포함
  - 거래 등록 시 카테고리/결제수단 즉석 생성 가능 (기존 로직 유지)

  **Acceptance Criteria**:
  - [ ] 필터가 API에 정확히 연결됨 (월 + 카테고리 + 결제수단 + 키워드)
  - [ ] CRUD 전체 동작
  - [ ] 소프트 삭제 + 복구
  - [ ] 카테고리 타입 검증 (지출 카테고리로 수입 등록 불가)
  - [ ] 하위카테고리 자동완성 동작

- [ ] 9. 설정 페이지

  **What to do**:
  - `SettingsPage.tsx` — 탭 라우팅 (카드/예산/고정비/카테고리 4개 탭)
  - `PaymentMethodTab.tsx` — 카드 목록 + CRUD. 현금 삭제 불가
  - `BudgetTab.tsx` — 월별 카테고리별 예산 설정 + 진행률
  - `RecurringExpenseTab.tsx` — 고정비 목록 + CRUD + 활성/비활성 토글. 카테고리명/결제수단명 표시 (raw ID 금지)
  - `CategoryTab.tsx` — 카테고리 관리 (수입/지출 분리). 색상/아이콘 편집
  - 각 탭별 Form 모달 (별도 파일)
  - 로그아웃 버튼 (설정 페이지 하단)

  **Must NOT do**:
  - 고정비 raw ID를 화면에 표시하지 마세요 (카테고리명, 결제수단명으로 변환)
  - Admin 탭 만들지 마세요

  **Acceptance Criteria**:
  - [ ] 4개 탭 정상 전환
  - [ ] 카드 CRUD + 현금 삭제 방지
  - [ ] 예산 설정 + 진행률 표시
  - [ ] 고정비 CRUD + 토글 + 카테고리명/결제수단명 표시
  - [ ] 카테고리 관리
  - [ ] 로그아웃 동작

- [ ] 10. PWA 설정

  **What to do**:
  - `public/manifest.json` — 앱명, 아이콘, 테마색, display: standalone
  - `public/icons/` — 192x192, 512x512 아이콘 생성
  - Service Worker 설정 (vite-plugin-pwa 사용 또는 수동)
  - `index.html`에 manifest 링크 + meta 태그 추가
  - 오프라인 시 이전 데이터 조회 가능 (React Query 캐시 활용)

  **Acceptance Criteria**:
  - [ ] 모바일 브라우저에서 "홈화면에 추가" 표시
  - [ ] 설치 후 전체화면 실행 (브라우저 UI 없음)
  - [ ] 오프라인 시 캐시된 데이터 조회

- [ ] 11. 반응형 데스크톱 레이아웃

  **What to do**:
  - `lg:` 이상에서 사이드바 네비게이션 표시 (하단 탭바 숨김)
  - 사이드바: 앱 로고 + 4개 네비게이션 + 사용자 정보 + 로그아웃
  - 대시보드 2-column 레이아웃 (요약 + 차트 나란히)
  - 모달이 바텀시트 대신 일반 모달로 표시

  **Acceptance Criteria**:
  - [ ] 1024px+ 에서 사이드바 표시
  - [ ] 375px에서 하단 탭바 정상
  - [ ] 중간 크기(768px)에서도 자연스러운 레이아웃

- [ ] 12. 전체 통합 테스트 + 버그 수정

  **What to do**:
  - 전체 사용자 흐름 테스트: 로그인 → 지출 등록 → 대시보드 확인 → 현황 확인 → 내역 필터 → 설정 변경
  - 모바일 뷰포트(375x812)와 데스크톱(1440x900) 모두 테스트
  - 에러 처리: 네트워크 오류, Supabase 응답 오류, 빈 데이터 상태
  - 발견된 버그 수정
  - `npm run build` 성공 확인

  **Acceptance Criteria**:
  - [ ] 전체 흐름 에러 없이 동작
  - [ ] `npm run build` exit code 0
  - [ ] 모바일 + 데스크톱 레이아웃 정상

---

## Final Verification Wave (MANDATORY)

- [ ] F1. **Plan Compliance Audit** — oracle
  모든 결정 사항이 구현되었는지 확인. "Must NOT" 위반 탐지.

- [ ] F2. **Code Quality Review** — unspecified-high
  TypeScript 에러 0개, `as any` 0개, 빈 catch 0개, console.log 0개 확인.

- [ ] F3. **Real QA with Playwright** — unspecified-high + playwright skill
  모바일(375px) + 데스크톱(1440px)에서 전체 흐름 테스트. 프라이버시 검증 (지출 대시보드에 수입 노출 없음).

- [ ] F4. **Scope Fidelity Check** — deep
  각 태스크별 "What to do" vs 실제 구현 1:1 비교. 범위 확장 탐지.

---

## Guardrails

### Must Have
- Google 로그인 (Supabase Auth)
- 지출-퍼스트 대시보드 (수입 노출 없음)
- 전체 현황 탭 (수입/잔액 표시)
- 거래 CRUD (소프트 삭제, 복구)
- 하위 카테고리 자동완성
- 카테고리별 도넛 차트
- 일일 지출 추이 라인 차트
- 결제수단별 분포
- 예산 진행 바
- 캘린더 (지출만, 날짜 클릭 → 상세)
- 카드(결제수단) 관리
- 고정비 관리 (수동)
- PWA (홈화면 설치)
- 다크모드 전용
- 모바일 퍼스트 (하단 탭바)
- 데스크톱 반응형 (사이드바)
- React Query 캐싱
- Row Level Security

### Must NOT Have
- ❌ Express 서버 (Supabase로 대체)
- ❌ SQLite (PostgreSQL 사용)
- ❌ JWT 직접 구현 (Supabase Auth 사용)
- ❌ 이메일/비밀번호 로그인 (Google만)
- ❌ 회원가입 페이지
- ❌ Admin 페이지/Role 시스템
- ❌ ThemeContext/다크모드 토글 (항상 다크)
- ❌ Docker 배포
- ❌ CORS 설정
- ❌ 고정비 자동 등록 스케줄러
- ❌ TypeScript `any`
- ❌ `as any` 캐스팅
- ❌ 빈 catch 블록
- ❌ console.log in production
- ❌ 서드파티 캘린더 라이브러리
- ❌ Recharts 외 차트 라이브러리
- ❌ 상태관리 라이브러리 (Zustand, Redux)
- ❌ CSS-in-JS
