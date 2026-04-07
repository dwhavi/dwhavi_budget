# 🧠 AI Agent 지식 베이스 (Knowledge Base)

> **⚠️ AI Agent 제약사항 (Constraints)**
> 작업 시 전체 프로젝트 폴더를 탐색(`list_dir`, `grep_search` 등)하지 마십시오. 요구사항과 일치하는 아래의 도메인(기능)별 매핑된 파일 목록만 제한적으로 확인하고 수정해야 합니다.

각 기능별 작업 시 아래 명시된 연관 파일들만 분석하세요. 각 기능의 API 상세 및 하네스 테스트 내역은 `API 문서` 링크를 참고하세요.

## 1. Auth (인증/회원가입)
- **API 문서**: [docs/api/auth.md](./api/auth.md)
- **백엔드 (Server)**
  - 라우트: `server/src/routes/auth.ts`
  - 스키마: `server/src/validations/auth.ts`
  - 테스트: `server/src/__tests__/auth.test.ts`
- **프론트엔드 (Client)**
  - 모듈: `client/src/api/auth.ts`
  - UI: `client/src/pages/LoginPage/`, `client/src/pages/RegisterPage/`
  - Context: `client/src/contexts/AuthContext.tsx` (존재할 경우)

## 2. Transactions (거래내역)
- **API 문서**: [docs/api/transactions.md](./api/transactions.md)
- **백엔드 (Server)**
  - 라우트: `server/src/routes/transactions.ts`
  - 모델: `server/src/models/Transaction.ts`
  - 스키마: `server/src/validations/transaction.ts`
  - 테스트: `server/src/__tests__/transactions.test.ts`
- **프론트엔드 (Client)**
  - 모듈: `client/src/api/transactions.ts`
  - UI: `client/src/pages/Transactions/`

## 3. Categories (카테고리)
- **API 문서**: [docs/api/categories.md](./api/categories.md)
- **백엔드 (Server)**
  - 라우트: `server/src/routes/categories.ts`
  - 모델: `server/src/models/Category.ts`
  - 스키마: `server/src/validations/category.ts`
  - 테스트: `server/src/__tests__/categories.test.ts`
- **프론트엔드 (Client)**
  - 모듈: `client/src/api/categories.ts`
  - UI: `client/src/pages/Settings/` 또는 공통 컴포넌트

## 4. Payment Methods (결제수단)
- **API 문서**: [docs/api/payment-methods.md](./api/payment-methods.md)
- **백엔드 (Server)**
  - 라우트: `server/src/routes/payment-methods.ts`
  - 모델: `server/src/models/PaymentMethod.ts`
  - 스키마: `server/src/validations/payment-method.ts`
  - 테스트: `server/src/__tests__/payment-methods.test.ts`
- **프론트엔드 (Client)**
  - 모듈: `client/src/api/payment-methods.ts`
  - UI: `client/src/pages/Settings/`

## 5. Subcategories (서브카테고리)
- **API 문서**: [docs/api/subcategories.md](./api/subcategories.md)
- **백엔드 (Server)**
  - 라우트: `server/src/routes/subcategories.ts`
  - 테스트: `server/src/__tests__/subcategories.test.ts`
- **프론트엔드 (Client)**
  - 모듈: `client/src/api/subcategories.ts`

## 6. Recurring Expenses (고정 지출)
- **API 문서**: [docs/api/recurring-expenses.md](./api/recurring-expenses.md)
- **백엔드 (Server)**
  - 라우트: `server/src/routes/recurring-expenses.ts`
  - 모델: `server/src/models/RecurringExpense.ts`
  - 스키마: `server/src/validations/recurring-expense.ts`
  - 테스트: `server/src/__tests__/recurring-expenses.test.ts`
- **프론트엔드 (Client)**
  - 모듈: `client/src/api/recurring-expenses.ts`
  - UI: `client/src/pages/Settings/`

## 7. Budgets (예산)
- **API 문서**: [docs/api/budgets.md](./api/budgets.md)
- **백엔드 (Server)**
  - 라우트: `server/src/routes/budgets.ts`
  - 모델: `server/src/models/Budget.ts`
  - 스키마: `server/src/validations/budget.ts`
  - 테스트: `server/src/__tests__/budgets.test.ts`
- **프론트엔드 (Client)**
  - 모듈: `client/src/api/budgets.ts`

## 8. Stats (통계)
- **API 문서**: [docs/api/stats.md](./api/stats.md)
- **백엔드 (Server)**
  - 라우트: `server/src/routes/stats.ts`
  - 테스트: `server/src/__tests__/stats.test.ts`
- **프론트엔드 (Client)**
  - 모듈: `client/src/api/stats.ts`
  - UI: `client/src/pages/Stats/`, `client/src/pages/Dashboard/`

## 9. Admin (관리자)
- **API 문서**: [docs/api/admin.md](./api/admin.md)
- **백엔드 (Server)**
  - 라우트: `server/src/routes/admin.ts`
  - 스키마: `server/src/validations/admin.ts`
  - 테스트: `server/src/__tests__/admin.test.ts`
- **프론트엔드 (Client)**
  - 모듈: `client/src/api/admin.ts`
  - UI: `client/src/pages/Admin/`
