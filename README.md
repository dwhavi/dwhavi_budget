# 💰 Budget App

개인 가계부 웹 애플리케이션. 수입과 지출을 기록하고, 카테고리별·결제수단별 통계를 확인하며, 월별 예산을 관리할 수 있습니다.

---

## 빠른 링크

| 문서 | 설명 |
|------|------|
| [빠른 시작](./docs/getting-started.md) | 설치, 실행, 환경변수 설정 |
| [아키텍처](./docs/architecture.md) | 기술 스택, 프로젝트 구조, 데이터 모델 |
| [배포 가이드](./docs/deployment.md) | Docker 배포 |
| [테스트 가이드](./docs/testing.md) | 하네스 실행 방법, 테스트 목록 |
| [🧠 AI Agent 지식 베이스](./docs/knowledge-base.md) | **[제약사항]** 분야별 AI가 확인해야 할 파일 매핑 목차 |

---

## 주요 기능

- **거래내역 관리** — 수입/지출 내역 등록, 수정, 삭제, 복구
- **카테고리 관리** - 전역 카테고리(기본 제공) + 개인 커스텀 카테고리
- **결제수단 관리** — 신용카드, 체크카드, 현금 등 결제수단 등록
- **고정 지출 관리** — 매월 반복되는 지출(월세, 구독 등) 자동 추적
- **예산 설정** — 카테고리별 월 예산 설정 및 달성률 확인
- **통계 대시보드** — 월별 추이, 카테고리별/결제수단별 통계 차트
- **서브카테고리 자동완성** — 거래 입력 시 서브카테고리 자동 추천
- **관리자 페이지** — 사용자 관리, 전역 카테고리 관리, 시스템 설정
- **JWT 인증** — 액세스 토큰(15분) + 리프레시 토큰(7일) 기반 인증

---

## API 문서

| 기능 | 경로 | 하네스 |
|------|------|--------|
| [인증](./docs/api/auth.md) | `/api/auth` | `auth.test.ts` (17개 시나리오) |
| [거래내역](./docs/api/transactions.md) | `/api/transactions` | `transactions.test.ts` (14개 시나리오) |
| [카테고리](./docs/api/categories.md) | `/api/categories` | `categories.test.ts` (7개 시나리오) |
| [결제수단](./docs/api/payment-methods.md) | `/api/payment-methods` | `payment-methods.test.ts` (8개 시나리오) |
| [서브카테고리](./docs/api/subcategories.md) | `/api/subcategories` | `subcategories.test.ts` (9개 시나리오) |
| [고정 지출](./docs/api/recurring-expenses.md) | `/api/recurring-expenses` | `recurring-expenses.test.ts` (7개 시나리오) |
| [예산](./docs/api/budgets.md) | `/api/budgets` | `budgets.test.ts` (9개 시나리오) |
| [통계](./docs/api/stats.md) | `/api/stats` | `stats.test.ts` (11개 시나리오) |
| [관리자](./docs/api/admin.md) | `/api/admin` | `admin.test.ts` (18개 시나리오) |

---

## 기술 스택 요약

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 19, Vite 8, TypeScript, Tailwind CSS 4 |
| 백엔드 | Express 5, TypeScript, Sequelize 6, SQLite |
| 인증 | JWT (액세스 + 리프레시 토큰) |
| 테스트 | Vitest, supertest, React Testing Library |
