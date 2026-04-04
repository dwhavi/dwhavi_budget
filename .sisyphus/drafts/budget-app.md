# Draft: 가계부 웹 앱 (Budget App)

## 분석 요약

### 기존 문서 상태
- **dwhavi_budget.md**: 393줄의 상세 요구사항 문서 (거의 완벽한 수준의 기획서)
- **dashboard-mockup.html**: 대시보드 페이지 HTML 목업 (다크모드 기반, Tailwind CSS)
- **프로젝트 코드**: 아직 없음 (그린필드 프로젝트)

### 기술 스택 (확정)
| 계층 | 기술 |
|------|------|
| Frontend | React 18 + Vite + TypeScript |
| UI | Tailwind CSS + Recharts |
| Backend | Node.js + Express + TypeScript |
| DB | SQLite + Sequelize ORM |
| 인증 | JWT (access + refresh token) |
| 기타 | bcryptjs, cookie-parser, concurrently, Zod |
| 배포 | Docker Compose (선택) |

### 기능 모듈 (7개)
1. **인증 시스템** - 회원가입/로그인, JWT, 자동로그인, 비밀번호 변경
2. **가계부 기록 CRUD** - 수입/지출 등록, 하위카테고리, 자동완성, 필터/정렬/페이징
3. **대시보드** - 요약카드, 달력, 최근거래, 카테고리순위, 월별추이, 일일예상소비액
4. **통계 페이지** - 월별추이차트, 카테고리별차트, 예산관리, 예산알림
5. **내 카드 관리** - 카드 CRUD, 기본카드설정, 현금기본제공
6. **고정비 관리** - 고정비 등록/자동등록, 활성/비활성 토글
7. **관리자 페이지** - 사용자관리, 카테고리관리, 시스템설정

### DB 모델 (6개 테이블)
- User, Category, Transaction, PaymentMethod, Budget, RecurringExpense

### API 엔드포인트 (40+개)
- Auth (6), Transactions (6), Stats (4), Budgets (2), PaymentMethods (4), RecurringExpenses (6), SubCategories (1), Admin (8)

### UI/UX 요구사항
- 한국어 인터페이스
- 반응형 (모바일/태블릿/데스크톱)
- 다크모드 지원
- 토스트 알림, 로딩 스켈레톤, 모달 기반 폼

## Requirements (confirmed)
- 요구사항 문서가 매우 상세하여 대부분의 기능이 명확히 정의됨

## Technical Decisions
- 기술 스택: 문서에 명시된 대로 확정
- DB: SQLite (가벼운 개인용 앱에 적합)
- ORM: Sequelize (SQLite + TypeScript 지원)

## Research Findings
- 대시보드 목업 HTML이 존재 → UI 디자인 방향이 구체적으로 정해져 있음
- 다크모드 기반 UI가 기본 (mockup에서 `class="dark"` 사용)

## Confirmed Decisions (from interview)
- **테스트 전략**: TDD (RED-GREEN-REFACTOR 사이클)
- **테스트 프레임워크**: Vitest
- **Docker**: 초기부터 포함
- **고정비**: 자동 등록 제거 → 관리자/설정 페이지에서 수동 관리, 기간 지정 가능
- **반응형 기준**: 모바일 우선 (Mobile-first)
- **모바일 네비게이션**: 하단 탭바
- **액세스 토큰 저장**: localStorage
- **결제수단 ENUM**: credit, debit, cash, transfer (이체 추가)
- **스키마 변경**: Transaction에 recurring_expense_id 불필요 (자동등록 제거)
- **RecurringExpense 스키마 변경**: payment_day 제거, start_date/end_date 추가 (기간 지정)

## Scope Boundaries
- INCLUDE: 문서에 명시된 모든 기능 (고정비 자동등록 제외)
- EXCLUDE: 고정비 자동등록 스케줄러/lazy check
