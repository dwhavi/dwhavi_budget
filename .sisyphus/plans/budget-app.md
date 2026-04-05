# 가계부 웹 앱 (Budget App) — 풀스택 빌드

## TL;DR

> **Quick Summary**: React + Express + SQLite 기반 한국어 가계부 풀스택 웹 앱을 TDD로 처음부터 구축한다.
> 
> **Deliverables**:
> - 인증 시스템 (JWT, 회원가입/로그인/자동로그인/비밀번호변경)
> - 가계부 기록 CRUD (수입/지출, 하위카테고리 자동완성, 필터/정렬/페이징)
> - 대시보드 (요약카드, 달력, 최근거래, 카테고리순위, 월별추이, 일일예상소비액)
> - 통계 페이지 (월별추이, 카테고리별 파이차트, 예산관리)
> - 설정 페이지 (카드관리, 예산설정, 고정비관리)
> - 관리자 페이지 (사용자/카테고리/시스템 관리)
> - Docker Compose 배포 설정
> - README.md
> 
> **Estimated Effort**: XL (25 태스크, 7 웨이브)
> **Parallel Execution**: YES - 7 waves
> **Critical Path**: T1(scaffold) → T2(test infra) → T4(auth API) → T8(transactions API) → T12(stats API) → T18(dashboard UI) → T25(smoke test)

---

## Context

### Original Request
한국어 가계부 웹 애플리케이션. 사용자가 일상적인 수입/지출을 기록하고, 달력과 차트로 시각적으로 확인하며, 통계를 통해 소비 패턴을 분석할 수 있는 풀스택 앱.

### Interview Summary
**Key Discussions**:
- **고정비**: 자동 등록 제거 → 관리자/설정 페이지에서 수동 관리, 기간(start_date~end_date) 지정 가능
- **테스트**: TDD (Vitest) — RED-GREEN-REFACTOR 사이클
- **UI 방향**: 모바일 우선, 하단 탭바 네비게이션, 다크모드 지원
- **Docker**: 초기부터 포함

**Research Findings**:
- 요구사항 문서(dwhavi_budget.md)가 393줄로 매우 상세 — 기능, DB 스키마, API 명세 모두 포함
- 대시보드 HTML 목업 존재 (다크모드, Tailwind CSS)
- 그린필드 프로젝트 (기존 코드 없음)

### Metis Review
**Identified Gaps** (addressed):
- Transaction ↔ RecurringExpense 연결 필드 필요 → 자동등록 제거로 해결 (불필요해짐)
- PaymentMethod ENUM에 '이체(transfer)' 누락 → ENUM에 transfer 추가로 해결
- 테스트 프레임워크 미지정 → Vitest 확정
- 액세스 토큰 저장소 미지정 → localStorage 확정
- 모바일 네비게이션 미정 → 하단 탭바 확정

### Schema Changes from Original Spec
| Model | Change | Reason |
|-------|--------|--------|
| PaymentMethod.type | ENUM에 'transfer' 추가 | 목업에 '이체' 표시 |
| RecurringExpense | payment_day 제거, start_date/end_date 추가 (DATEONLY) | 기간 지정 가능하도록 변경 |
| RecurringExpense | 자동등록 로직 제거 | 수동 관리로 변경 |

---

## Work Objectives

### Core Objective
React + Express + SQLite 기반 가계부 풀스택 웹 앱을 TDD로 구축하여 `npm install && npm run dev`로 즉시 실행 가능한 상태로 제공한다.

### Concrete Deliverables
- `/home/dwhavi/projects/budget-app/` — 완전히 동작하는 모노레포
- `client/` — React 18 + Vite + TypeScript 프론트엔드
- `server/` — Express + TypeScript 백엔드
- `docker-compose.yml` + Dockerfiles
- `README.md`
- `.env.example`

### Definition of Done
- [ ] `npm install && npm run dev` 실행 시 클라이언트(5173) + 서버(3000) 정상 구동
- [x] 모든 API 엔드포인트 정상 응답 (curl로 검증)- [ ] 회원가입 → 로그인 → 대시보드 → 기록등록 → 통계 확인 플로우 동작
- [ ] Vitest 모든 테스트 통과
- [ ] Docker Compose로 앱 구동 가능

### Must Have
- JWT 인증 (access + refresh token)
- 수입/지출 CRUD (소프트 삭제, 복구)
- 하위 카테고리 자동완성
- 달력 기반 대시보드
- 카테고리별/월별 통계 차트 (Recharts)
- 예산 설정 및 달성률
- 고정비 관리 (수동, 기간 지정)
- 카드(결제수단) 관리
- 관리자 페이지 (사용자/카테고리/설정)
- 다크모드 토글
- 반응형 (모바일 하단 탭바 / 데스크톱 사이드바)
- 토스트 알림, 로딩 스켈레톤

### Must NOT Have (Guardrails)
- ❌ 상태관리 라이브러리 (Redux, Zustand 등) — React Context + hooks만 사용
- ❌ CSS-in-JS (styled-components, emotion) — Tailwind CSS만 사용
- ❌ SSR/SSG (Next.js, Remix) — SPA with Vite
- ❌ WebSocket/SSE — REST API만
- ❌ 파일 업로드
- ❌ i18n 프레임워크 — 한국어 하드코딩
- ❌ 이메일 서비스 (비밀번호 재설정 메일 등)
- ❌ 결제 연동
- ❌ 서드파티 캘린더 라이브러리 — 커스텀 달력 위젯
- ❌ Recharts 외 차트 라이브러리
- ❌ 고정비 자동등록 스케줄러/lazy check — 수동 관리만
- ❌ TypeScript `any` — `unknown` 사용
- ❌ console.log in production
- ❌ 오버엔지니어링 (캐싱 레이어, 메시지 큐, 마이크로서비스)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: NO (greenfield)
- **Automated tests**: TDD (RED-GREEN-REFACTOR)
- **Framework**: Vitest
- **Backend testing**: supertest (API integration tests)
- **Frontend testing**: Vitest + React Testing Library (component tests)
- **Each task**: Write failing test first → implement → make it pass → refactor

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl) — Send requests, assert status + response fields
- **Both**: Test happy path + at least 1 error/edge case per task

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — Start Immediately, NO dependencies):
├── Task 1:  Project scaffolding + TypeScript configs + .env.example [quick]
├── Task 2:  Vitest setup + test helpers (server + client) [quick]
└── Task 3:  DB models + associations + seed data [unspecified-high]

Wave 2 (Auth — After Wave 1):
├── Task 4:  Auth API (register, login, logout, refresh, me, password) + Zod + TDD [deep]
└── Task 5:  Auth middleware + admin middleware + error handler [unspecified-high]

Wave 3 (Core CRUD APIs — After Wave 2, MAX PARALLEL):
├── Task 6:  PaymentMethods API — TDD [unspecified-high]
├── Task 7:  Categories API (global + personal) — TDD [unspecified-high]
├── Task 8:  Transactions API (CRUD, filters, pagination, sort, soft delete) — TDD [deep]
├── Task 9:  SubCategories autocomplete API — TDD [quick]
└── Task 10: RecurringExpenses API (CRUD, toggle, period) — TDD [unspecified-high]

Wave 3.5 (Test Isolation Fix — Before Wave 4):
└── Task 10.5: Fix test isolation — in-memory SQLite per test file [quick]

Wave 4 (Feature APIs — After Wave 3.5):
├── Task 11: Budgets API (upsert, monthly query) — TDD [unspecified-high]
├── Task 12: Stats API (dashboard summary, trends, category, payment-methods) — TDD [deep]
└── Task 13: Admin API (users, categories, settings, system summary) — TDD [unspecified-high]

Wave 5 (Frontend Foundation — After Wave 1, parallel with Waves 2-4):
├── Task 14: React scaffold (router, axios, interceptors, contexts, types) [unspecified-high]
├── Task 15: Layout shell (sidebar + mobile bottom nav + header + dark mode + toast + skeletons) [visual-engineering]
└── Task 16: Shared components (Modal, Calendar widget, TransactionForm, ConfirmDialog) [visual-engineering]

Wave 6 (Frontend Pages — After Wave 5 + Wave 4):
├── Task 17: Login + Register pages [visual-engineering]
├── Task 18: Dashboard page (summary cards, calendar, recent tx, category rank, mini chart) [visual-engineering]
├── Task 19: Transactions page (list, filters, pagination, sort, CRUD modals) [visual-engineering]
├── Task 20: Stats page (trend chart, category pie, budget progress) [visual-engineering]
├── Task 21: Settings page (card mgmt + budget + recurring expenses — 3 tabs) [visual-engineering]
└── Task 22: Admin page (users, categories, settings, system dashboard) [visual-engineering]

Wave 7 (Integration — After ALL):
├── Task 23: Docker Compose + Dockerfiles [quick]
├── Task 24: README.md (setup, API docs, deployment) [writing]
└── Task 25: End-to-end smoke test (full flow) [deep]

Wave FINAL (Verification — After ALL tasks):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA with Playwright (unspecified-high)
└── F4: Scope fidelity check (deep)
→ Present results → Get explicit user okay

Critical Path: T1 → T2 → T4 → T8 → T12 → T18 → T25 → F1-F4
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 5 (Wave 3)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | - | 2-5, 14 | 1 |
| 2 | 1 | 4-13 | 1 |
| 3 | 1 | 4-13 | 1 |
| 4 | 1, 2, 3 | 6-10, 17 | 2 |
| 5 | 4 | 6-13 | 2 |
| 6 | 4, 5 | 12, 21 | 3 |
| 7 | 4, 5 | 8, 11, 12, 13, 22 | 3 |
| 8 | 4, 5, 7 | 9, 12, 19 | 3 |
| 9 | 8 | 19 | 3 |
| 10 | 4, 5, 6, 7 | 21 | 3 |
| 11 | 7 | 12, 20, 21 | 4 |
| 12 | 6, 7, 8, 11 | 18, 20 | 4 |
| 13 | 4, 5, 7 | 22 | 4 |
| 14 | 1 | 15-22 | 5 |
| 15 | 14 | 17-22 | 5 |
| 16 | 14, 15 | 17-22 | 5 |
| 17 | 14, 15, 16 | - | 6 |
| 18 | 14, 15, 16, 12 | - | 6 |
| 19 | 14, 15, 16, 8, 9 | - | 6 |
| 20 | 14, 15, 16, 11, 12 | - | 6 |
| 21 | 14, 15, 16, 6, 10, 11 | - | 6 |
| 22 | 14, 15, 16, 13 | - | 6 |
| 23 | ALL | 25 | 7 |
| 24 | ALL | - | 7 |
| 25 | ALL | F1-F4 | 7 |

### Agent Dispatch Summary

- **Wave 1**: **3** — T1 → `quick`, T2 → `quick`, T3 → `unspecified-high`
- **Wave 2**: **2** — T4 → `deep`, T5 → `unspecified-high`
- **Wave 3**: **5** — T6 → `unspecified-high`, T7 → `unspecified-high`, T8 → `deep`, T9 → `quick`, T10 → `unspecified-high`
- **Wave 4**: **3** — T11 → `unspecified-high`, T12 → `deep`, T13 → `unspecified-high`
- **Wave 5**: **3** — T14 → `unspecified-high`, T15 → `visual-engineering`, T16 → `visual-engineering`
- **Wave 6**: **6** — T17-T22 → `visual-engineering`
- **Wave 7**: **3** — T23 → `quick`, T24 → `writing`, T25 → `deep`
- **FINAL**: **4** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

- [x] 1. Project Scaffolding + TypeScript Configs

  **What to do**:
  - **파일 이동** (작업 파일만, 설정 파일 절대 건드리지 않음):
    - `mv /home/dwhavi/budget-sample.xlsx /home/dwhavi/projects/budget-app/`
    - `mv /home/dwhavi/2026_04_04_work.md /home/dwhavi/projects/budget-app/`
    - ❌ 설정 파일 절대 건드리지 않음: `.claude/`, `.opencode/`, `.openclaw/`, `.npmrc`, `.bashrc`, `.zshrc`, `.gitconfig`, `.ssh/`, `.config/`, `.local/`, `.npm/`, `.npm-global/`, `.bun/`, `.cache/`, `.dotnet/`, `.copilot/`, `.vscode-server/`, `.profile`, `.bash_logout`, `.wget-hsts`, `.sudo_as_admin_successful`, `.opencode.json` 등 모든 숨김 파일/폴더
  - Create monorepo root with `package.json` (concurrently로 server+client 동시 실행)
  - Scaffold `client/` with `npm create vite@latest . -- --template react-ts`
  - Scaffold `server/` with Express + TypeScript (`npx tsc --init`, 기본 설정)
  - Install shared deps: `tailwindcss`, `recharts`, `axios`, `zod` (client), `express`, `sequelize`, `sqlite3`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `cors`, `zod` (server)
  - Configure `tsconfig.json` for both (strict mode, paths alias)
  - Create `.env.example` with all env vars from spec (PORT, DB_PATH, JWT_SECRET, etc.)
  - Create `.gitignore` (node_modules, dist, data/*.db, .env)
  - Verify `npm run dev` starts both client (5173) and server (3000) concurrently

  **Must NOT do**:
  - Do NOT install state management libraries (Redux, Zustand)
  - Do NOT install CSS-in-JS libraries
  - Do NOT install SSR frameworks
  - Do NOT create any business logic yet

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Scaffolding and configuration, no complex logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 2, 3, 14
  - **Blocked By**: None

  **References**:
  **Pattern References**:
  - `dwhavi_budget.md:22-33` — 기술 스택 테이블 (정확한 라이브러리 목록)
  - `dwhavi_budget.md:36-63` — 프로젝트 디렉토리 구조
  - `dwhavi_budget.md:370-386` — 환경변수 목록 (.env.example)

  **Acceptance Criteria**:
  - [ ] Root `package.json` has `dev` script using concurrently
  - [ ] `client/` has working Vite + React + TypeScript setup
  - [ ] `server/` has working Express + TypeScript setup
  - [ ] `npm run dev` starts both services without errors
  - [ ] `.env.example` contains all specified env vars
  - [ ] `.gitignore` covers node_modules, dist, data, .env
  - [ ] Both tsconfig.json have `strict: true`

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Scaffolding verification — npm run dev works
    Tool: Bash
    Preconditions: Fresh directory, Node.js installed
    Steps:
      1. cd /home/dwhavi/projects/budget-app && npm install
      2. cp .env.example .env
      3. npm run dev (run in background, wait 10s)
      4. curl -s http://localhost:5173 | head -5
      5. curl -s http://localhost:3000/api/auth/me
      6. Kill the dev processes
    Expected Result: 
      - Client returns HTML with "Vite + React"
      - Server returns {"success":false,"message":"인증이 필요합니다"}
    Failure Indicators: Either service fails to start, port conflicts, missing deps
    Evidence: .sisyphus/evidence/task-1-scaffold-verify.txt
  ```

  **Commit**: YES
  - Message: `chore: initial project scaffolding with client/server monorepo`
  - Files: root package.json, client/*, server/*, .env.example, .gitignore, tsconfig files

- [x] 2. Vitest Setup + Test Helpers

  **What to do**:
  - Install `vitest` in both client/ and server/
  - Install `supertest` in server/ for API integration tests
  - Install `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` in client/
  - Create `server/vitest.config.ts` with appropriate settings
  - Create `client/vitest.config.ts` with jsdom environment
  - Create `server/src/__tests__/helpers/testApp.ts` — Express app factory for supertest (with test DB path)
  - Create `server/src/__tests__/helpers/testDb.ts` — in-memory SQLite setup/teardown for tests
  - Add `test` scripts to both package.json files
  - Write 1 passing smoke test in each (`describe("smoke", it("works", ...))`) to verify setup

  **Must NOT do**:
  - Do NOT create test utilities that are tied to specific business logic
  - Do NOT install Jest (use Vitest only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Test infrastructure configuration, well-documented setup
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 3)
  - **Parallel Group**: Wave 1 (with Task 3)
  - **Blocks**: Tasks 4-13
  - **Blocked By**: Task 1

  **References**:
  **Pattern References**:
  - `dwhavi_budget.md:22-33` — Vitest is consistent with Vite ecosystem

  **Acceptance Criteria**:
  - [ ] `cd server && npx vitest run` passes with 1 smoke test
  - [ ] `cd client && npx vitest run` passes with 1 smoke test
  - [ ] `testApp.ts` creates an Express app with test DB
  - [ ] `testDb.ts` provides setup/teardown for in-memory SQLite

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Server test infrastructure works
    Tool: Bash
    Preconditions: Task 1 completed, server/ has vitest installed
    Steps:
      1. cd /home/dwhavi/projects/budget-app/server
      2. npx vitest run
    Expected Result: Tests run and pass (1 test, 0 failures)
    Failure Indicators: "no test files found", import errors, config errors
    Evidence: .sisyphus/evidence/task-2-server-test.txt

  Scenario: Client test infrastructure works
    Tool: Bash
    Preconditions: Task 1 completed, client/ has vitest installed
    Steps:
      1. cd /home/dwhavi/projects/budget-app/client
      2. npx vitest run
    Expected Result: Tests run and pass (1 test, 0 failures)
    Failure Indicators: jsdom env errors, React Testing Library import errors
    Evidence: .sisyphus/evidence/task-2-client-test.txt
  ```

  **Commit**: YES
  - Message: `chore: add Vitest test infrastructure for server and client`
  - Files: server/vitest.config.ts, client/vitest.config.ts, test helpers, smoke tests

- [x] 3. DB Models + Associations + Seed Data

  **What to do**:
  - Create Sequelize connection setup in `server/src/models/index.ts` (SQLite path from env)
  - Define all 6 models with exact fields from spec:
    - **User**: id, email (unique), password_hash, display_name(20), role('admin'|'user'), is_active, created_at, updated_at
    - **Category**: id, user_id (FK→User, nullable), name, type('income'|'expense'), icon, color, sort_order, deleted_at
    - **Transaction**: id, user_id (FK→User), type('income'|'expense'), amount (INTEGER 1~99999999), category_id (FK→Category), payment_method_id (FK→PaymentMethod, nullable), date (DATEONLY), sub_category (STRING, nullable), memo (STRING, nullable), created_at, updated_at, deleted_at
    - **PaymentMethod**: id, user_id (FK→User), name, issuer, type('credit'|'debit'|'cash'|'transfer'), color, is_default, memo, created_at, updated_at, deleted_at
    - **Budget**: id, user_id (FK→User), category_id (FK→Category), month (STRING 'YYYY-MM'), amount (INTEGER)
    - **RecurringExpense**: id, user_id (FK→User), name, amount, category_id (FK→Category), payment_method_id (FK→PaymentMethod), start_date (DATEONLY), end_date (DATEONLY, nullable), memo, is_active (default true), created_at, updated_at, deleted_at
  - Define Sequelize associations (belongsTo, hasMany)
  - Create `server/src/seeders/defaultCategories.ts` — 기본 카테고리 시드 (수입 3개 + 지출 9개)
  - Add `db:seed` npm script
  - Write model-level tests (field types, validations, associations)

  **Must NOT do**:
  - Do NOT add `recurring_expense_id` to Transaction (자동등록 제거됨)
  - Do NOT create migration files yet (greenfield, sync 사용)
  - Do NOT add business logic to models (pure data layer)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 6 models with exact field definitions, associations, seed data, and model tests — significant effort
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2)
  - **Parallel Group**: Wave 1 (with Task 2)
  - **Blocks**: Tasks 4-13
  - **Blocked By**: Task 1

  **References**:
  **Pattern References**:
  - `dwhavi_budget.md:192-276` — 전체 DB 모델 스키마 (모든 필드, 타입, 제약조건)
  - `dwhavi_budget.md:94-98` — 기본 카테고리 목록 (수입 3개, 지출 9개)

  **API/Type References**:
  - Sequelize TypeScript patterns — `@types/sequelize`, model定义 with `InitOptions`, `ModelAttributes`

  **Acceptance Criteria**:
  - [ ] All 6 models defined with correct fields and types
  - [ ] Associations work (User.hasMany(Transaction), Transaction.belongsTo(Category), etc.)
  - [ ] `npm run db:seed` creates default categories
  - [ ] Model tests pass: field validations (amount 1~99999999, role enum, type enum)
  - [ ] Soft delete `deleted_at` field on Category, Transaction, PaymentMethod, RecurringExpense

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Models and seed data creation
    Tool: Bash
    Preconditions: Task 1 completed, Sequelize + sqlite3 installed
    Steps:
      1. cd /home/dwhavi/projects/budget-app/server
      2. npx vitest run src/__tests__/models/
    Expected Result: All model tests pass — field types correct, associations work, validations enforce constraints
    Failure Indicators: Sequelize sync errors, validation not enforced, missing fields
    Evidence: .sisyphus/evidence/task-3-models-test.txt

  Scenario: Seed data creates default categories
    Tool: Bash
    Preconditions: DB file doesn't exist yet
    Steps:
      1. cd /home/dwhavi/projects/budget-app/server
      2. npx ts-node src/seeders/defaultCategories.ts
      3. Query the DB: npx ts-node -e "const{sequelize}=require('./src/models');const{QueryTypes}=require('sequelize');sequelize.query('SELECT name,type FROM Categories',QueryTypes.SELECT).then(r=>console.log(r))"
    Expected Result: 12 categories inserted (급여, 부수입, 용돈 + 식비, 교통, 주거, 통신, 유흥, 쇼핑, 의료, 교육, 기타)
    Failure Indicators: Missing categories, duplicate key errors, wrong types
    Evidence: .sisyphus/evidence/task-3-seed-data.txt
  ```

  **Commit**: YES
  - Message: `feat(models): define all 6 Sequelize models with associations and seed data`
  - Files: server/src/models/*, server/src/seeders/*, server/src/__tests__/models/*
  - Pre-commit: `npx vitest run src/__tests__/models/`

- [x] 4. Auth API (Register, Login, Logout, Refresh, Me, Password Change) — TDD

  **What to do**:
  **TDD Cycle — Write tests FIRST, then implement:**
  
  RED (Write failing tests):
  - Test: `POST /api/auth/register` — valid input → 201 with user + accessToken + refreshToken cookie
  - Test: `POST /api/auth/register` — duplicate email → 400
  - Test: `POST /api/auth/register` — invalid email → 400 with Zod error
  - Test: `POST /api/auth/register` — password < 8 chars → 400
  - Test: `POST /api/auth/register` — first user gets admin role
  - Test: `POST /api/auth/register` — creates default "현금" PaymentMethod
  - Test: `POST /api/auth/login` — correct credentials → accessToken + refreshToken cookie
  - Test: `POST /api/auth/login` — wrong password → 401
  - Test: `POST /api/auth/login` — non-existent email → 401
  - Test: `POST /api/auth/login` — inactive user → 403
  - Test: `POST /api/auth/logout` → clears refreshToken cookie
  - Test: `POST /api/auth/refresh` — valid refreshToken → new accessToken
  - Test: `POST /api/auth/refresh` — expired/invalid refreshToken → 401
  - Test: `GET /api/auth/me` — valid accessToken → user data
  - Test: `GET /api/auth/me` — no token → 401
  - Test: `PATCH /api/auth/password` — correct current password → success
  - Test: `PATCH /api/auth/password` — wrong current password → 401
  
  GREEN (Implement to pass):
  - Create `server/src/routes/auth.ts` with all 6 endpoints
  - Create `server/src/validations/auth.ts` — Zod schemas for register, login, passwordChange
  - Implement: bcryptjs password hashing, JWT access/refresh token generation
  - Implement: httpOnly cookie for refresh token (7d expiry)
  - Implement: First user → admin role logic
  - Implement: Auto-create "현금" PaymentMethod on registration
  
  REFACTOR: Clean up, extract JWT utilities

  **Must NOT do**:
  - Do NOT implement email verification
  - Do NOT implement password reset via email
  - Do NOT implement rate limiting (can add later)
  - Do NOT store access token in httpOnly cookie (only refresh)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 6 endpoints, Zod validation, JWT logic, cookie management, first-user-admin logic, auto cash creation — complex business rules
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (with Task 5, but depends on Task 5 completion)
  - **Blocks**: Tasks 5-10, 17
  - **Blocked By**: Tasks 1, 2, 3

  **References**:
  **Pattern References**:
  - `dwhavi_budget.md:69-83` — 인증 시스템 요구사항 전체
  - `dwhavi_budget.md:282-289` — Auth API 엔드포인트 6개
  - `dwhavi_budget.md:192-200` — User 모델 스키마
  - `dwhavi_budget.md:6-19` — API 응답 형식 (success/error wrapper)

  **API/Type References**:
  - `dwhavi_budget.md:250` — 회원가입 시 "현금" 자동 생성 명세

  **External References**:
  - jsonwebtoken — `jwt.sign()`, `jwt.verify()` API
  - bcryptjs — `bcrypt.hash()`, `bcrypt.compare()` API

  **Acceptance Criteria**:
  - [ ] All 17+ tests pass
  - [ ] Register creates user + default "현금" PaymentMethod
  - [ ] First registered user gets admin role
  - [ ] Login returns accessToken + sets httpOnly refresh cookie
  - [ ] Refresh token rotation works
  - [ ] Logout clears cookie
  - [ ] Password change requires current password verification
  - [ ] Zod validation rejects invalid inputs

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Full auth flow — register → login → me → logout
    Tool: Bash (curl)
    Preconditions: Server running, clean DB
    Steps:
      1. curl -s -X POST http://localhost:3000/api/auth/register \
           -H 'Content-Type: application/json' \
           -d '{"email":"test@test.com","password":"Test1234","display_name":"테스터"}' | jq .
      2. Extract accessToken from response
      3. curl -s http://localhost:3000/api/auth/me -H 'Authorization: Bearer {token}' | jq .
      4. curl -s -X POST http://localhost:3000/api/auth/logout | jq .
      5. curl -s http://localhost:3000/api/auth/me -H 'Authorization: Bearer {token}' 
    Expected Result: 
      - Register: {"success":true,"data":{"user":{"email":"test@test.com","role":"admin",...}}}
      - Me: {"success":true,"data":{"email":"test@test.com","display_name":"테스터"}}
      - After logout: still 200 (access token valid until expiry), but refresh cookie cleared
    Failure Indicators: Missing fields, no cookie set, password not hashed
    Evidence: .sisyphus/evidence/task-4-auth-flow.txt

  Scenario: Validation rejection — invalid inputs
    Tool: Bash (curl)
    Preconditions: Server running
    Steps:
      1. curl -s -X POST http://localhost:3000/api/auth/register \
           -H 'Content-Type: application/json' \
           -d '{"email":"not-email","password":"12","display_name":"A"}' | jq .
      2. curl -s -X POST http://localhost:3000/api/auth/register \
           -H 'Content-Type: application/json' \
           -d '{"email":"test2@test.com","password":"Test1234","display_name":"테스터2"}'
      3. curl -s -X POST http://localhost:3000/api/auth/register \
           -H 'Content-Type: application/json' \
           -d '{"email":"test2@test.com","password":"Test1234","display_name":"테스터2"}' | jq .
    Expected Result: 
      - Step 1: {"success":false,"message":"..."} with validation errors
      - Step 3: {"success":false,"message":"이미 사용 중인 이메일입니다"} (duplicate)
    Failure Indicators: Server crash, missing validation, wrong status codes
    Evidence: .sisyphus/evidence/task-4-auth-validation.txt
  ```

  **Commit**: YES
  - Message: `feat(auth): implement JWT authentication with register, login, logout, refresh, me, password change`
  - Files: server/src/routes/auth.ts, server/src/validations/auth.ts, server/src/__tests__/routes/auth.test.ts

- [x] 5. Auth Middleware + Admin Middleware + Error Handler

  **What to do**:
  **TDD Cycle:**
  
  RED:
  - Test: Protected route without token → 401
  - Test: Protected route with valid token → passes through, req.user populated
  - Test: Protected route with expired token → 401
  - Test: Admin route with admin user → passes through
  - Test: Admin route with regular user → 403
  - Test: Invalid token format → 401
  
  GREEN:
  - Create `server/src/middleware/auth.ts` — JWT verification middleware, extracts user from token
  - Create `server/src/middleware/admin.ts` — checks `req.user.role === 'admin'`
  - Create `server/src/middleware/errorHandler.ts` — centralized error handler returning `{success: false, message}` format
  - Create `server/src/middleware/validate.ts` — Zod schema validation middleware factory
  - Wire up error handler in `server/src/index.ts`

  **Must NOT do**:
  - Do NOT implement RBAC beyond admin/user roles
  - Do NOT add rate limiting middleware

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple middleware with auth logic, tests needed
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 4 patterns)
  - **Parallel Group**: Wave 2 (with Task 4)
  - **Blocks**: Tasks 6-13
  - **Blocked By**: Task 4

  **References**:
  **Pattern References**:
  - `dwhavi_budget.md:69-77` — JWT 인증 구조 (access 15분, refresh 7일)
  - `dwhavi_budget.md:169-176` — Admin 접근 권한 (role=admin)
  - `dwhavi_budget.md:6-19` — API 에러 응답 형식

  **Acceptance Criteria**:
  - [ ] All middleware tests pass
  - [ ] auth middleware populates `req.user` from valid JWT
  - [ ] admin middleware returns 403 for non-admin
  - [ ] error handler returns standardized `{success, message}` format
  - [ ] validate middleware applies Zod schemas to req.body

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Middleware chain — auth + admin protection
    Tool: Bash (curl)
    Preconditions: Task 4 completed, server running
    Steps:
      1. Register admin user (first user = admin)
      2. Register regular user (second user)
      3. curl http://localhost:3000/api/admin/users (no token) 
      4. curl http://localhost:3000/api/admin/users -H 'Authorization: Bearer {user-token}'
      5. curl http://localhost:3000/api/admin/users -H 'Authorization: Bearer {admin-token}'
    Expected Result:
      - Step 3: {"success":false,"message":"인증이 필요합니다"} (401)
      - Step 4: {"success":false,"message":"관리자 권한이 필요합니다"} (403)
      - Step 5: {"success":true,"data":[...]} (200)
    Failure Indicators: User accessing admin routes, no auth check
    Evidence: .sisyphus/evidence/task-5-middleware.txt
  ```

  **Commit**: YES
  - Message: `feat(middleware): add auth, admin, validation, and error handler middleware`
  - Files: server/src/middleware/*.ts, server/src/__tests__/middleware/*.test.ts

- [x] 6. PaymentMethods API — TDD

  **What to do**:
  **TDD Cycle:**
  
  RED:
  - Test: `GET /api/payment-methods` → returns user's active payment methods
  - Test: `POST /api/payment-methods` → creates card with valid data
  - Test: `POST /api/payment-methods` with type='transfer' → creates transfer method
  - Test: `PUT /api/payment-methods/:id` → updates card
  - Test: `DELETE /api/payment-methods/:id` (soft delete, non-cash) → success
  - Test: `DELETE /api/payment-methods/:id` (cash card) → 400 "현금은 삭제할 수 없습니다"
  - Test: Other user's card → 403
  - Test: Zod validation: name required, type enum validation
  
  GREEN:
  - Create `server/src/routes/payment-methods.ts`
  - Create `server/src/validations/payment-method.ts` — Zod schemas
  - Implement CRUD with soft delete, cash protection, user scoping

  **Must NOT do**:
  - Do NOT hard-delete any payment methods
  - Do NOT allow deleting the "현금" payment method

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: CRUD with soft delete, special cash protection, validation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 7, 8, 9, 10)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 12, 21
  - **Blocked By**: Tasks 4, 5

  **References**:
  - `dwhavi_budget.md:151-158` — 내 카드 관리 요구사항
  - `dwhavi_budget.md:236-250` — PaymentMethod 모델 스키마
  - `dwhavi_budget.md:316-321` — PaymentMethods API 엔드포인트

  **Acceptance Criteria**:
  - [ ] All tests pass
  - [ ] CRUD works with user scoping
  - [ ] Soft delete works (deleted_at set, excluded from GET)
  - [ ] Cash payment method cannot be deleted
  - [ ] type enum includes 'transfer'

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Card CRUD flow
    Tool: Bash (curl)
    Preconditions: Logged in user with default "현금"
    Steps:
      1. POST /api/payment-methods {"name":"신한카드","issuer":"신한","type":"credit","color":"#3b82f6"}
      2. GET /api/payment-methods → verify new card appears
      3. PUT /api/payment-methods/{id} {"name":"신한플래티늄"}
      4. DELETE /api/payment-methods/{현금id} → expect 400
    Expected Result: Create → read → update works. Cash delete rejected.
    Evidence: .sisyphus/evidence/task-6-payment-methods.txt
  ```

  **Commit**: YES
  - Message: `feat(payment-methods): CRUD API with soft delete and cash protection`
  - Files: server/src/routes/payment-methods.ts, server/src/validations/payment-method.ts, tests

- [x] 7. Categories API (Global + Personal) — TDD

  **What to do**:
  **TDD Cycle:**
  
  RED:
  - Test: `GET /api/categories` → returns global + user's personal categories
  - Test: `POST /api/categories` → creates personal category (user_id = req.user.id)
  - Test: `PUT /api/categories/:id` (own category) → updates
  - Test: `PUT /api/categories/:id` (global category) → 403
  - Test: `DELETE /api/categories/:id` → soft delete (personal only)
  - Test: Categories include income/expense type filtering
  - Test: Soft-deleted categories excluded from GET
  
  GREEN:
  - Create `server/src/routes/categories.ts`
  - Create `server/src/validations/category.ts` — Zod schemas
  - Implement: global (user_id=null) + personal categories, user-scoped access, soft delete

  **Must NOT do**:
  - Do NOT allow users to modify global categories (admin only)
  - Do NOT hard-delete categories

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 6, 8, 9, 10)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 8, 11, 12, 13, 22
  - **Blocked By**: Tasks 4, 5

  **References**:
  - `dwhavi_budget.md:204-217` — Category 모델 (user_id null=전역, not null=개인)
  - `dwhavi_budget.md:173-174` — 전역 카테고리 + 개인 카테고리 관리

  **Acceptance Criteria**:
  - [ ] Global + personal categories returned together
  - [ ] User can only CRUD own personal categories
  - [ ] Global categories read-only for users
  - [ ] Soft delete works

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Category access control
    Tool: Bash (curl)
    Steps:
      1. GET /api/categories → 12 seed categories + 0 personal
      2. POST /api/categories {"name":"반려동물","type":"expense","icon":"🐾","color":"#f59e0b"}
      3. GET /api/categories → 12 + 1 personal
      4. PUT /api/categories/{seed_id} {"name":"수정시도"} → 403
      5. DELETE /api/categories/{personal_id} → 200
    Expected Result: Personal CRUD works, global modification blocked
    Evidence: .sisyphus/evidence/task-7-categories.txt
  ```

  **Commit**: YES
  - Message: `feat(categories): CRUD API with global/personal scope and soft delete`

- [x] 8. Transactions API (CRUD, Filters, Pagination, Sort, Soft Delete) — TDD

  **What to do**:
  **TDD Cycle:**
  
  RED:
  - Test: `POST /api/transactions` income → creates with valid data
  - Test: `POST /api/transactions` expense → creates with valid data
  - Test: `POST /api/transactions` income with expense category → 400 (카테고리 타입 검증)
  - Test: `POST /api/transactions` amount=0 → 400
  - Test: `POST /api/transactions` amount=100000000 → 400
  - Test: `GET /api/transactions?month=2026-04` → returns paginated results
  - Test: `GET /api/transactions?date=2026-04-04` → returns specific date transactions
  - Test: `GET /api/transactions?category_id=1&min_amount=10000&sort=amount&order=desc` → filtered/sorted
  - Test: `GET /api/transactions?page=1&limit=5` → returns 5 items with pagination metadata
  - Test: `PUT /api/transactions/:id` → updates own transaction
  - Test: `PUT /api/transactions/:id` (other user's) → 403
  - Test: `DELETE /api/transactions/:id` → soft delete (sets deleted_at)
  - Test: `PATCH /api/transactions/:id/restore` → restores soft-deleted transaction
  - Test: `GET /api/transactions?keyword=점심` → searches memo field
  
  GREEN:
  - Create `server/src/routes/transactions.ts`
  - Create `server/src/validations/transaction.ts` — Zod schemas (amount 1~99999999, date format, type enum)
  - Implement: CRUD + filters (category, payment_method, amount range, keyword) + pagination + sorting + soft delete + restore
  - Implement: category type validation (income category → income only)

  **Must NOT do**:
  - Do NOT hard-delete transactions
  - Do NOT allow modifying other users' transactions
  - Do NOT allow future dates validation (spec doesn't restrict it)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Most complex CRUD with 4+ filter types, pagination, sorting, soft delete+restore, cross-validation with categories — highest complexity in the backend
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 6, 7, 9, 10)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 9, 12, 19
  - **Blocked By**: Tasks 4, 5, 7 (needs Category model)

  **References**:
  - `dwhavi_budget.md:86-103` — 가계부 기록 CRUD 전체 요구사항
  - `dwhavi_budget.md:220-233` — Transaction 모델 스키마
  - `dwhavi_budget.md:293-299` — Transactions API 엔드포인트 (필터 파라미터 포함)
  - `dwhavi_budget.md:99` — 소프트 삭제 + 복구 명세

  **Acceptance Criteria**:
  - [ ] All 14+ tests pass
  - [ ] CRUD with user scoping works
  - [ ] Filters: category_id, payment_method_id, min_amount, max_amount, keyword, date
  - [ ] Sorting: date (default desc), amount (asc/desc), category
  - [ ] Pagination: page, limit (default 20, max 100), returns total count
  - [ ] Category type enforcement (income→income, expense→expense)
  - [ ] Soft delete + restore works
  - [ ] Amount validation: 1 ~ 99,999,999

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Transaction CRUD + filters
    Tool: Bash (curl)
    Steps:
      1. POST /api/transactions {"type":"expense","amount":23000,"category_id":{식비_id},"payment_method_id":{cash_id},"date":"2026-04-04","memo":"점심 식비","sub_category":"점심"}
      2. POST /api/transactions {"type":"expense","amount":8500,"category_id":{식비_id},"date":"2026-04-04","memo":"카페"}
      3. POST /api/transactions {"type":"income","amount":5000000,"category_id":{급여_id},"date":"2026-04-03"}
      4. GET /api/transactions?month=2026-04 → verify 3 results
      5. GET /api/transactions?date=2026-04-04 → verify 2 results
      6. GET /api/transactions?category_id={식비_id}&sort=amount&order=desc → verify sorted
      7. DELETE /api/transactions/{id} → soft delete
      8. GET /api/transactions?month=2026-04 → verify 2 results (deleted excluded)
      9. PATCH /api/transactions/{deleted_id}/restore → restore
      10. GET /api/transactions?month=2026-04 → verify 3 results again
    Expected Result: Full lifecycle works correctly
    Evidence: .sisyphus/evidence/task-8-transactions.txt

  Scenario: Category type enforcement
    Tool: Bash (curl)
    Steps:
      1. POST /api/transactions {"type":"income","amount":10000,"category_id":{식비_id},"date":"2026-04-04"}
    Expected Result: {"success":false,"message":"...카테고리 타입이 일치하지 않습니다..."} (400)
    Evidence: .sisyphus/evidence/task-8-category-type-check.txt
  ```

  **Commit**: YES
  - Message: `feat(transactions): CRUD API with filters, pagination, sorting, and soft delete`

- [x] 9. SubCategories Autocomplete API — TDD

  **What to do**:
  **TDD Cycle:**
  
  RED:
  - Test: `GET /api/subcategories?category_id=1` → returns unique sub_category values
  - Test: `GET /api/subcategories?category_id=1&q=점` → filters by prefix
  - Test: `GET /api/subcategories?category_id=1` → returns top 10, sorted by frequency
  - Test: Returns empty array when no matching sub-categories
  
  GREEN:
  - Create `server/src/routes/subcategories.ts`
  - Query Transaction table: `SELECT sub_category, COUNT(*) as count FROM Transactions WHERE user_id=? AND category_id=? AND sub_category LIKE '?%' AND deleted_at IS NULL GROUP BY sub_category ORDER BY count DESC LIMIT 10`

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single endpoint with one query
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 6, 7, 10)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 19
  - **Blocked By**: Task 8

  **References**:
  - `dwhavi_budget.md:333-338` — SubCategories API 명세

  **Acceptance Criteria**:
  - [ ] Returns unique sub_category values for a category
  - [ ] Filters by prefix query `q`
  - [ ] Returns top 10 by frequency
  - [ ] Only returns user's own data

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Autocomplete returns correct suggestions
    Tool: Bash (curl)
    Preconditions: Several transactions with sub_category values exist
    Steps:
      1. GET /api/subcategories?category_id={식비_id}&q=점
    Expected Result: ["점심","점심약속"] or similar, up to 10 items
    Evidence: .sisyphus/evidence/task-9-autocomplete.txt
  ```

  **Commit**: YES
  - Message: `feat(subcategories): autocomplete API with frequency-based ranking`

- [x] 10. RecurringExpenses API (CRUD, Toggle, Period) — TDD

  **What to do**:
  **TDD Cycle:**
  
  RED:
  - Test: `GET /api/recurring-expenses` → returns user's recurring expenses
  - Test: `POST /api/recurring-expenses` → creates with name, amount, category, payment_method, start_date, end_date(optional)
  - Test: `PUT /api/recurring-expenses/:id` → updates
  - Test: `DELETE /api/recurring-expenses/:id` → soft delete
  - Test: `PATCH /api/recurring-expenses/:id/toggle` → toggles is_active
  - Test: `GET /api/recurring-expenses/month-summary?month=2026-04` → returns sum of active expenses for that month
  - Test: Month-summary only includes expenses where start_date <= month-end AND (end_date IS NULL OR end_date >= month-start)
  
  GREEN:
  - Create `server/src/routes/recurring-expenses.ts`
  - Create `server/src/validations/recurring-expense.ts` — Zod schemas
  - Implement: CRUD, toggle, month-summary with period filtering (start_date/end_date)

  **Must NOT do**:
  - Do NOT auto-create transactions from recurring expenses
  - Do NOT implement any scheduler/cron/lazy check

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 6, 7, 8, 9)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 21
  - **Blocked By**: Tasks 4, 5, 6, 7

  **References**:
  - `dwhavi_budget.md:161-167` — 고정비 관리 요구사항 (수동 관리, 기간 지정)
  - `dwhavi_budget.md:262-275` — RecurringExpense 모델 (수정: payment_day → start_date/end_date)

  **Acceptance Criteria**:
  - [ ] CRUD works with user scoping
  - [ ] start_date required, end_date optional (nullable = ongoing)
  - [ ] Toggle activates/deactivates
  - [ ] Month-summary calculates only active expenses within period
  - [ ] Soft delete works

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Recurring expense lifecycle with period
    Tool: Bash (curl)
    Steps:
      1. POST /api/recurring-expenses {"name":"관리비","amount":103160,"category_id":{주거_id},"payment_method_id":{cash_id},"start_date":"2026-01-01","end_date":null}
      2. POST /api/recurring-expenses {"name":"Netflix","amount":17000,"category_id":{유흥_id},"start_date":"2026-03-01","end_date":"2026-06-30"}
      3. GET /api/recurring-expenses/month-summary?month=2026-04 → 103160+17000=120160
      4. GET /api/recurring-expenses/month-summary?month=2026-07 → 103160 only (Netflix ended)
      5. PATCH /api/recurring-expenses/{id}/toggle → deactivate 관리비
      6. GET /api/recurring-expenses/month-summary?month=2026-07 → 0
    Expected Result: Period filtering and active toggle work correctly
    Evidence: .sisyphus/evidence/task-10-recurring.txt
  ```

  **Commit**: YES
  - Message: `feat(recurring-expenses): CRUD API with period-based tracking and toggle`

- [x] 10.5. Fix Test Isolation — In-Memory SQLite Per Test File

  **What to do**:
  - **CRITICAL BLOCKER**: All 63 tests pass individually but 27 fail when running `npx vitest run` (all files together).
    The root cause is all test files share the same `./data/budget.db` SQLite file, causing concurrent access
    conflicts and overlapping test data (e.g., same `test@example.com` email).
  - Refactor `server/src/__tests__/helpers/testApp.ts` (or create a new helper) to use `:memory:` SQLite
    instead of file-based `./data/budget.db` for tests.
  - Ensure each test file gets its own isolated in-memory database instance.
  - Strategy options (pick the best fit):
    - **Option A**: Each test file's `beforeAll`/`beforeEach` creates a fresh Sequelize instance with `sqlite::memory:`,
      runs `sync()` + `loadModels()`, and `afterAll` closes the connection.
    - **Option B**: Use Vitest's `pool: 'forks'` isolation (each test file runs in its own process with its own DB).
    - **Option C**: Create a `createTestApp()` factory that returns a fresh app+db combo per call.
  - Update ALL existing test files (auth, payment-methods, categories, transactions, subcategories, recurring-expenses)
    to use the new isolated test setup.
  - Verify: `cd server && npx vitest run` passes ALL 63 tests with 0 failures.

  **Must NOT do**:
  - Do NOT modify production database code (only test helpers and test files)
  - Do NOT change any API behavior or business logic
  - Do NOT skip or remove any existing test cases

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Refactoring test infrastructure only, no business logic changes
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (test infrastructure change, must be consistent)
  - **Parallel Group**: Wave 3.5 (standalone)
  - **Blocks**: Tasks 11-13, Wave 7 smoke test (Task 25)
  - **Blocked By**: Tasks 1-10 (all completed)

  **References**:
  **Pattern References**:
  - `server/src/__tests__/helpers/testApp.ts` — Current test app factory (needs modification)
  - `server/src/models/index.ts` — `loadModels()` and `setupAssociations()` functions
  - `server/src/__tests__/auth.test.ts` — Example test file to understand current pattern
  - `server/src/__tests__/payment-methods.test.ts` — Another test file for pattern reference
  - `server/vitest.config.ts` — Current Vitest configuration

  **External References**:
  - Sequelize SQLite `:memory:` connection: `new Sequelize('sqlite::memory:', { dialect: 'sqlite', ... })`

  **Acceptance Criteria**:
  - [ ] `cd server && npx vitest run` passes ALL tests (63 pass, 0 fail)
  - [ ] Each test file uses its own isolated database
  - [ ] No test file touches `./data/budget.db`
  - [ ] Individual test files still pass (`npx vitest run src/__tests__/auth.test.ts`)

  **QA Scenarios (MANDATORY)**:

  ```
  Scenario: Full test suite passes together
    Tool: Bash
    Preconditions: All test files updated with isolated DB
    Steps:
      1. cd /home/dwhavi/projects/budget-app/server
      2. npx vitest run 2>&1
    Expected Result: All tests pass (63+ tests, 0 failures). No "SQLITE_BUSY" or "SQLITE_LOCKED" errors.
    Failure Indicators: Any test failure, database lock errors, timeout errors
    Evidence: .sisyphus/evidence/task-10.5-test-isolation.txt

  Scenario: Individual test files still pass
    Tool: Bash
    Preconditions: Test isolation fix applied
    Steps:
      1. cd /home/dwhavi/projects/budget-app/server
      2. npx vitest run src/__tests__/auth.test.ts
      3. npx vitest run src/__tests__/transactions.test.ts
      4. npx vitest run src/__tests__/payment-methods.test.ts
    Expected Result: Each file passes independently
    Failure Indicators: Import errors, missing helpers, setup failures
    Evidence: .sisyphus/evidence/task-10.5-individual-tests.txt
  ```

  **Commit**: YES
  - Message: `fix(test): isolate test databases with in-memory SQLite per test file`
  - Files: server/src/__tests__/helpers/*, server/src/__tests__/*.test.ts (updated imports), server/vitest.config.ts (if changed)
  - Pre-commit: `cd server && npx vitest run`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
>
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npx tsc --noEmit` (client + server) + linter + `npx vitest run`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state (`docker compose down -v && docker compose up --build`). Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test full flow: register → login → add transaction → view dashboard → check stats → manage cards → admin panel. Test edge cases: empty state, invalid input, dark/light toggle, mobile layout. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Wave | Commit Message Pattern | Files | Pre-commit Check |
|------|----------------------|-------|-----------------|
| 1 | `chore: project scaffolding and configuration` | root configs | `tsc --noEmit` |
| 2 | `feat(auth): JWT authentication system` | server/src/routes/auth*, middleware/* | `vitest run` |
| 3 | `feat(api): {module} CRUD endpoints` | server/src/routes/{module}* | `vitest run` |
| 4 | `feat(api): {module} feature endpoints` | server/src/routes/{module}* | `vitest run` |
| 5 | `feat(ui): React foundation and layout` | client/src/* | `tsc --noEmit` |
| 6 | `feat(ui): {page} page` | client/src/pages/{Page}/* | `tsc --noEmit` |
| 7 | `chore: Docker, README, integration` | root files | `docker compose up --build` |

---

## Success Criteria

### Verification Commands
```bash
# Server health
curl http://localhost:3000/api/auth/me  # Expected: 401 { "success": false }

# Full auth flow
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@test.com","password":"Test1234","display_name":"테스터"}'
# Expected: { "success": true, "data": { "user": {...}, "accessToken": "..." } }

# All tests pass
cd server && npx vitest run   # Expected: all pass
cd client && npx vitest run   # Expected: all pass

# Docker
docker compose up --build     # Expected: both services healthy
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] All tests pass
- [ ] `npm install && npm run dev` works
- [ ] Docker Compose works
- [ ] README.md complete
