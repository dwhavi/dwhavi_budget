# Budget App: Supabase → Google Drive JSON 전환 계획

## TL;DR
Supabase PostgreSQL + React Query → Google Drive AppData JSON + 인메모리 DataContext

## 결정 사항
- DB 포맷: 단일 JSON 파일 (`budget_data.json`)
- 동기화: 메모리 즉시 반영, 2초 debounce 후 Google Drive 업로드
- 인증: Google OAuth only
- 파일 위치: AppData 폴더 (`spaces: appDataFolder`)
- 파일명: `budget_data.json`
- 백엔드: 없음 (gapi.js 브라우저 직접 호출)
- 오프라인: 메모리 정상 동작, 복구 시 자동 업로드
- 다중 기기: Last Write Wins
- ID: UUID v4 (클라이언트 생성)

## 환경 변수
```
VITE_GOOGLE_API_KEY=AIzaSyCuQh2o6uKFHXVzLkc-5PAVyJgvNNuCaJ4
VITE_GOOGLE_CLIENT_ID=576209183382-9ciejolp6op6kupmd4goik732i2q40uh.apps.googleusercontent.com
```

## JSON 데이터 구조
```json
{
  "version": 1,
  "lastSync": "2026-06-01T18:30:00+09:00",
  "categories": [...],
  "paymentMethods": [...],
  "transactions": [...],
  "budgets": [...],
  "recurringExpenses": [...]
}
```

## 교체 대상 파일

### 삭제
- `client/src/shared/lib/supabase.ts`

### 신규 작성
- `client/src/shared/lib/google-drive-service.ts` — gapi.js 래퍼, CRUD
- `client/src/shared/contexts/DataContext.tsx` — 전역 데이터 상태 + sync

### 전면 재작성
- `client/src/contexts/AuthContext.tsx` — GIS 기반 Google OAuth
- `client/src/features/auth/AuthCallback.tsx` — OAuth 콜백

### 재작성 (Supabase → DataContext)
- `client/src/shared/hooks/useTransactions.ts`
- `client/src/shared/hooks/useCategories.ts`
- `client/src/shared/hooks/usePaymentMethods.ts`
- `client/src/shared/hooks/useStats.ts`
- `client/src/shared/hooks/useBudgets.ts`
- `client/src/shared/hooks/useRecurringExpenses.ts`
- `client/src/shared/hooks/useCreditCardBilling.ts`

### 소폭 수정
- `client/index.html` — gapi.js, GIS 스크립트 추가
- `client/src/main.tsx` — QueryClientProvider 제거, DataContextProvider 추가
- `client/vite.config.ts` — PWA runtimeCaching Supabase API 제거
- `client/.env` — Supabase 변수 제거, Google 변수 추가
- `client/package.json` — @supabase/supabase-js, @tanstack/react-query 제거, uuid 추가

### 영향 없음
- App.tsx, ProtectedRoute.tsx, types/index.ts, feature 컴포넌트 전체

## 실행 웨이브

### Wave 1: 기반 레어어 (모든 것의 전제조건)
- [ ] 1.1 `google-drive-service.ts` — GoogleDriveService 클래스
  - initialize(): gapi + GIS 초기화
  - loadFile(): AppData에서 budget_data.json 다운로드
  - saveFile(): JSON 업로드 (debounce 2초)
  - createFile(): 첫 로그인 시 기본 데이터 생성
- [ ] 1.2 `DataContext.tsx` — React Context
  - 전역 데이터 상태 (transactions, categories, etc.)
  - CRUD 헬퍼 함수 (addTransaction, updateCategory 등)
  - 초기 로딩 (앱 시작 시 Google Drive에서 JSON 로드)
  - debounce 저장 훅 (2초 후 자동 Google Drive 업로드)
  - 오프라인 감지 + 복구 시 자동 업로드
  - 기본 데이터 시딩 (첫 로그인 시 카테고리 12개 + 현금 결제수단)
- [ ] 1.3 의존성 업데이트
  - package.json: uuid 추가, @supabase/supabase-js 제거, @tanstack/react-query 제거
  - npm install
- [ ] 1.4 .env 업데이트
  - VITE_GOOGLE_API_KEY, VITE_GOOGLE_CLIENT_ID
- [ ] 1.5 index.html에 gapi.js + GIS 스크립트 태그 추가

**Acceptance**: google-drive-service.ts 단위 테스트(불가), DataContext.tsx가 메모리에서 데이터 CRUD 가능

### Wave 2: 인증 (Wave 1 완료 후)
- [ ] 2.1 AuthContext.tsx — Google OAuth 재작성
  - google.accounts.oauth2.initTokenClient로 토큰 획득
  - GIS 스크립트 로드
  - token으로 사용자 정보(userId, name, email) 추출
  - session 상태 관리
- [ ] 2.2 AuthCallback.tsx — OAuth 콜백
  - URL에서 token 추출
  - DataContext 초기화 트리거
  - 대시보드로 이동

**Acceptance**: 구글 로그인 → 콜백 → 대시보드 진입

### Wave 3: 데이터 훅 (Wave 1+2 완료 후, 병렬 가능)
- [ ] 3.1 useTransactions.ts — CRUD + 필터
- [ ] 3.2 useCategories.ts — CRUD + 타입 필터
- [ ] 3.3 usePaymentMethods.ts — CRUD
- [ ] 3.4 useStats.ts — Array.reduce 집계
- [ ] 3.5 useBudgets.ts — CRUD
- [ ] 3.6 useRecurringExpenses.ts — CRUD
- [ ] 3.7 useCreditCardBilling.ts — 청구 계산

**Acceptance**: 각 훅이 DataContext에서 데이터를 읽고 쓰며 Supabase import 없음

### Wave 4: 정리 (Wave 3 완료 후)
- [ ] 4.1 main.tsx — QueryClientProvider → DataContextProvider 교체
- [ ] 4.2 vite.config.ts — runtimeCaching에서 Supabase API 항목 제거
- [ ] 4.3 supabase.ts 삭제
- [ ] 4.4 Feature 컴포넌트에서 React Query import 제거
- [ ] 4.5 불필요한 import 정리

**Acceptance**: tsc --noEmit 에러 0

### Final Verification
- [ ] F1: `tsc --noEmit` 통과
- [ ] F2: `npm run build` 성공
- [ ] F3: Vercel 배포 + 구글 로그인 테스트
- [ ] F4: 거래 등록/수정/삭제 정상 동작

## Final Verification Wave (MANDATORY)
- [ ] F1. 빌드 통과
- [ ] F2. 타입 체크 통과
- [ ] F3. 배포 + 기본 동작 확인
- [ F4. 핵심 시나리오 테스트
