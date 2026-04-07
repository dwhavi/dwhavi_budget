# 테스트 가이드

## 서버 테스트

```bash
cd server

# 테스트 1회 실행
npm test

# watch 모드
npm run test:watch
```

서버 테스트는 **Vitest** + **supertest**를 사용합니다. 테스트 실행 시 별도의 인메모리 SQLite 데이터베이스가 사용되므로 실제 데이터에 영향을 주지 않습니다.

### 테스트 파일 목록

| 파일 | 커버리지 | 문서 |
|------|----------|------|
| `auth.test.ts` | 회원가입, 로그인, 로그아웃, 토큰 갱신, 내 정보, 비밀번호 변경 | [docs/api/auth.md](./api/auth.md) |
| `transactions.test.ts` | 거래 생성, 조회(필터/정렬/페이지), 수정, 삭제, 복구 | [docs/api/transactions.md](./api/transactions.md) |
| `categories.test.ts` | 카테고리 목록, 생성, 수정, 삭제, 소프트 삭제 | [docs/api/categories.md](./api/categories.md) |
| `payment-methods.test.ts` | 결제수단 목록, 생성, 수정, 삭제, 권한 | [docs/api/payment-methods.md](./api/payment-methods.md) |
| `subcategories.test.ts` | 자동완성, 빈도순 정렬, 필터, 소프트 삭제 처리 | [docs/api/subcategories.md](./api/subcategories.md) |
| `recurring-expenses.test.ts` | 고정 지출 CRUD, 토글, 월별 요약 | [docs/api/recurring-expenses.md](./api/recurring-expenses.md) |
| `budgets.test.ts` | 예산 조회, upsert, 유저 격리 | [docs/api/budgets.md](./api/budgets.md) |
| `stats.test.ts` | 대시보드, 월별 추이, 카테고리별, 결제수단별 | [docs/api/stats.md](./api/stats.md) |
| `admin.test.ts` | 관리자 사용자/카테고리/설정/요약 CRUD | [docs/api/admin.md](./api/admin.md) |

### 테스트 환경 구성

모든 서버 테스트는 `server/src/__tests__/setup.ts`를 통해 인메모리 DB를 설정합니다. 각 테스트 파일은 `beforeEach` / `afterEach`에서 DB를 초기화하여 테스트 간 격리를 보장합니다.

```
server/src/__tests__/
├── setup.ts                  # 전역 테스트 셋업
├── smoke.test.ts             # 서버 기동 여부 확인
├── auth.test.ts
├── transactions.test.ts
├── categories.test.ts
├── payment-methods.test.ts
├── subcategories.test.ts
├── recurring-expenses.test.ts
├── budgets.test.ts
├── stats.test.ts
└── admin.test.ts
```

---

## 클라이언트 테스트

```bash
cd client

# 테스트 1회 실행
npm test

# watch 모드
npm run test:watch
```

클라이언트 테스트는 **Vitest** + **React Testing Library**를 사용합니다.

---

## 하네스 실행 팁

특정 기능만 빠르게 검증하고 싶을 때:

```bash
# 특정 파일만 실행
cd server && npx vitest run src/__tests__/auth.test.ts

# 특정 describe 블록만
cd server && npx vitest run --reporter=verbose -t "POST /api/auth/login"

# 전체 커버리지 리포트
cd server && npx vitest run --coverage
```
