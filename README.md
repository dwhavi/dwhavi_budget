# 💰 Budget App

개인 가계부 웹 애플리케이션. 수입과 지출을 기록하고, 카테고리별·결제수단별 통계를 확인하며, 월별 예산을 관리할 수 있습니다.

---

## 목차

- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [빠른 시작](#빠른-시작)
- [환경변수](#환경변수)
- [주요 기능](#주요-기능)
- [API 문서](#api-문서)
  - [인증 (Auth)](#인증-auth)
  - [거래내역 (Transactions)](#거래내역-transactions)
  - [카테고리 (Categories)](#카테고리-categories)
  - [결제수단 (Payment Methods)](#결제수단-payment-methods)
  - [서브카테고리 (SubCategories)](#서브카테고리-subcategories)
  - [고정 지출 (Recurring Expenses)](#고정-지출-recurring-expenses)
  - [예산 (Budgets)](#예산-budgets)
  - [통계 (Stats)](#통계-stats)
  - [관리자 (Admin)](#관리자-admin)
- [Docker 배포](#docker-배포)
- [테스트](#테스트)

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 19, Vite 8, TypeScript, Tailwind CSS 4, Recharts |
| 백엔드 | Express 5, TypeScript, Sequelize 6, SQLite |
| 인증 | JWT (액세스 토큰 + 리프레시 토큰) |
| 테스트 | Vitest, supertest (서버), React Testing Library (클라이언트) |

---

## 프로젝트 구조

```
budget-app/
├── client/                    # 프론트엔드 (React + Vite)
│   ├── public/
│   └── src/
│       ├── api/               # API 호출 모듈
│       ├── components/        # 공통 컴포넌트
│       ├── contexts/          # React Context
│       ├── hooks/             # 커스텀 훅
│       ├── pages/             # 페이지 컴포넌트
│       │   ├── Admin/         # 관리자 페이지
│       │   ├── Dashboard/     # 대시보드
│       │   ├── LoginPage/     # 로그인
│       │   ├── RegisterPage/  # 회원가입
│       │   ├── Settings/      # 설정
│       │   ├── Stats/         # 통계
│       │   └── Transactions/  # 거래내역
│       ├── types/             # TypeScript 타입 정의
│       ├── App.tsx
│       └── main.tsx
├── server/                    # 백엔드 (Express)
│   └── src/
│       ├── middleware/         # 미들웨어 (인증, 에러 핸들링)
│       ├── models/            # Sequelize 모델
│       ├── routes/            # API 라우트
│       │   ├── admin.ts
│       │   ├── auth.ts
│       │   ├── budgets.ts
│       │   ├── categories.ts
│       │   ├── payment-methods.ts
│       │   ├── recurring-expenses.ts
│       │   ├── stats.ts
│       │   ├── subcategories.ts
│       │   └── transactions.ts
│       ├── seeders/           # DB 시더 (기본 카테고리)
│       ├── validations/       # Zod 스키마
│       ├── __tests__/         # 서버 테스트
│       └── index.ts
├── .env.example               # 환경변수 템플릿
└── package.json               # 루트 패키지 (워크스페이스)
```

---

## 빠른 시작

### 사전 요구사항

- Node.js 20 이상
- npm 10 이상

### 설치 및 실행

```bash
# 1. 저장소 클론
git clone <repository-url>
cd budget-app

# 2. 전체 의존성 설치 (루트 + 서버 + 클라이언트)
npm run install:all

# 3. 환경변수 설정
cp .env.example .env
# .env 파일을 열어 JWT_SECRET, JWT_REFRESH_SECRET을 실제 값으로 변경

# 4. 서버용 .env 파일도 생성
cp .env.example server/.env

# 5. 기본 카테고리 시드
cd server && npm run db:seed && cd ..

# 6. 개발 서버 실행 (서버 + 클라이언트 동시 실행)
npm run dev
```

서버는 `http://localhost:3000`, 클라이언트는 `http://localhost:5173`에서 실행됩니다.

### 개별 실행

```bash
# 서버만 실행
npm run dev:server

# 클라이언트만 실행
npm run dev:client
```

### 프로덕션 빌드

```bash
# 서버 빌드
cd server && npm run build

# 클라이언트 빌드
cd client && npm run build
```

---

## 환경변수

`.env.example`을 복사해서 `.env` 파일을 만들고 필요에 따라 값을 수정하세요.

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `PORT` | `3000` | 서버 포트 |
| `NODE_ENV` | `development` | 실행 환경 |
| `DB_PATH` | `./data/budget.db` | SQLite 데이터베이스 파일 경로 |
| `JWT_SECRET` | `your-secret-key-here` | 액세스 토큰 서명 키 (반드시 변경) |
| `JWT_REFRESH_SECRET` | `your-refresh-secret-key-here` | 리프레시 토큰 서명 키 (반드시 변경) |
| `JWT_EXPIRES_IN` | `15m` | 액세스 토큰 만료 시간 |
| `JWT_REFRESH_EXPIRES_IN` | `7d` | 리프레시 토큰 만료 시간 |
| `VITE_API_URL` | `http://localhost:3000/api` | 클라이언트에서 사용하는 API 기본 URL |

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

모든 API는 `/api` 경로 아래에 위치합니다. 인증이 필요한 엔드포인트는 `Authorization: Bearer <token>` 헤더를 포함해야 합니다.

---

### 인증 (Auth)

기본 경로: `/api/auth`

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| `POST` | `/register` | 회원가입 | ❌ |
| `POST` | `/login` | 로그인 | ❌ |
| `POST` | `/logout` | 로그아웃 | ✅ |
| `POST` | `/refresh` | 토큰 갱신 | ❌ |
| `GET` | `/me` | 내 정보 조회 | ✅ |
| `PATCH` | `/password` | 비밀번호 변경 | ✅ |

#### POST /register

회원가입.

**요청 본문:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "display_name": "홍길동"
}
```

**응답:**

```json
{
  "user": { "id": 1, "email": "user@example.com", "display_name": "홍길동", "role": "user" },
  "accessToken": "eyJhbGci..."
}
```

#### POST /login

로그인. 액세스 토큰과 리프레시 토큰(쿠키)을 발급합니다.

**요청 본문:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답:**

```json
{
  "user": { "id": 1, "email": "user@example.com", "display_name": "홍길동", "role": "user" },
  "accessToken": "eyJhbGci..."
}
```

#### POST /logout

로그아웃. 리프레시 토큰 쿠키를 제거합니다.

#### POST /refresh

리프레시 토큰으로 새 액세스 토큰을 발급합니다.

**응답:**

```json
{
  "accessToken": "eyJhbGci...",
  "user": { "id": 1, "email": "user@example.com" }
}
```

#### GET /me

현재 로그인한 사용자 정보를 반환합니다.

#### PATCH /password

비밀번호 변경.

**요청 본문:**

```json
{
  "current_password": "oldPassword",
  "new_password": "newPassword123"
}
```

---

### 거래내역 (Transactions)

기본 경로: `/api/transactions` (인증 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/` | 거래내역 목록 조회 |
| `POST` | `/` | 거래내역 생성 |
| `PUT` | `/:id` | 거래내역 수정 |
| `DELETE` | `/:id` | 거래내역 소프트 삭제 |
| `PATCH` | `/:id/restore` | 삭제된 거래내역 복구 |

#### GET /

거래내역 목록을 페이지네이션 및 필터와 함께 조회합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `month` | string | 월 필터 (예: `2026-04`) |
| `date` | string | 특정 날짜 필터 |
| `category_id` | number | 카테고리 ID |
| `payment_method_id` | number | 결제수단 ID |
| `min_amount` | number | 최소 금액 |
| `max_amount` | number | 최대 금액 |
| `keyword` | string | 메모 검색 키워드 |
| `sort` | string | 정렬 필드 |
| `order` | string | 정렬 방향 (`asc` / `desc`) |
| `page` | number | 페이지 번호 |
| `limit` | number | 페이지당 항목 수 |

#### POST /

새 거래내역을 생성합니다.

**요청 본문:**

```json
{
  "type": "expense",
  "amount": 15000,
  "category_id": 1,
  "payment_method_id": 2,
  "date": "2026-04-06",
  "sub_category": "점심",
  "memo": "회사 근처 식당"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `type` | string | ✅ | `"income"` 또는 `"expense"` |
| `amount` | number | ✅ | 금액 |
| `category_id` | number | ✅ | 카테고리 ID |
| `payment_method_id` | number | ❌ | 결제수단 ID |
| `date` | string | ✅ | 날짜 (`YYYY-MM-DD`) |
| `sub_category` | string | ❌ | 서브카테고리 |
| `memo` | string | ❌ | 메모 |

#### PUT /:id

거래내역을 수정합니다. 요청 본문은 생성과 동일합니다.

#### DELETE /:id

거래내역을 소프트 삭제합니다. 실제 데이터는 유지되며 복구할 수 있습니다.

#### PATCH /:id/restore

소프트 삭제된 거래내역을 복구합니다.

---

### 카테고리 (Categories)

기본 경로: `/api/categories` (인증 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/` | 카테고리 목록 조회 |
| `POST` | `/` | 개인 카테고리 생성 |
| `PUT` | `/:id` | 카테고리 수정 |
| `DELETE` | `/:id` | 카테고리 소프트 삭제 |

#### GET /

카테고리 목록을 조회합니다. 전역 카테고리와 개인 카테고리가 모두 포함됩니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `type` | string | `"income"` 또는 `"expense"`로 필터 |

#### POST /

개인 카테고리를 생성합니다.

**요청 본문:**

```json
{
  "name": "카페",
  "type": "expense",
  "icon": "coffee"
}
```

---

### 결제수단 (Payment Methods)

기본 경로: `/api/payment-methods` (인증 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/` | 결제수단 목록 조회 |
| `POST` | `/` | 결제수단 생성 |
| `PUT` | `/:id` | 결제수단 수정 |
| `DELETE` | `/:id` | 결제수단 소프트 삭제 |

> **참고:** 기본으로 제공되는 "현금" 결제수단은 삭제할 수 없습니다.

---

### 서브카테고리 (SubCategories)

기본 경로: `/api/subcategories` (인증 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/` | 서브카테고리 자동완성 |

#### GET /

거래 입력 시 서브카테고리를 자동완성합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `category_id` | number | 카테고리 ID (필수) |
| `q` | string | 검색어 |

---

### 고정 지출 (Recurring Expenses)

기본 경로: `/api/recurring-expenses` (인증 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/` | 고정 지출 목록 |
| `POST` | `/` | 고정 지출 생성 |
| `PUT` | `/:id` | 고정 지출 수정 |
| `DELETE` | `/:id` | 고정 지출 소프트 삭제 |
| `PATCH` | `/:id/toggle` | 활성화/비활성화 전환 |
| `GET` | `/month-summary` | 월별 고정 지출 요약 |

#### GET /month-summary

특정 월의 고정 지출 요약을 조회합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `month` | string | 조회할 월 (예: `2026-04`) |

---

### 예산 (Budgets)

기본 경로: `/api/budgets` (인증 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/` | 예산 목록 조회 |
| `PUT` | `/` | 예산 설정 (upsert) |

#### GET /

예산 목록을 조회합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `month` | string | 조회할 월 (예: `2026-04`) |

#### PUT /

카테고리별 예산을 설정합니다. 이미 존재하는 카테고리는 업데이트됩니다.

**요청 본문:**

```json
{
  "budgets": [
    { "category_id": 1, "amount": 300000 },
    { "category_id": 3, "amount": 150000 }
  ]
}
```

---

### 통계 (Stats)

기본 경로: `/api/stats` (인증 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/dashboard` | 대시보드 요약 |
| `GET` | `/monthly-trend` | 월별 추이 |
| `GET` | `/categories` | 카테고리별 통계 |
| `GET` | `/payment-methods` | 결제수단별 통계 |

#### GET /dashboard

대시보드용 요약 데이터를 반환합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `month` | string | 조회할 월 (예: `2026-04`) |

#### GET /monthly-trend

월별 수입/지출 추이를 반환합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `months` | number | 조회할 개월 수 |

#### GET /categories

카테고리별 지출/수입 통계를 반환합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `type` | string | `"income"` 또는 `"expense"` |
| `start_date` | string | 시작일 (`YYYY-MM-DD`) |
| `end_date` | string | 종료일 (`YYYY-MM-DD`) |

#### GET /payment-methods

결제수단별 통계를 반환합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `start_date` | string | 시작일 (`YYYY-MM-DD`) |
| `end_date` | string | 종료일 (`YYYY-MM-DD`) |

---

### 관리자 (Admin)

기본 경로: `/api/admin` (관리자 권한 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/users` | 사용자 목록 조회 |
| `PUT` | `/users/:id/role` | 사용자 권한 변경 |
| `PUT` | `/users/:id/status` | 사용자 상태 변경 |
| `GET` | `/categories` | 전역 카테고리 목록 |
| `POST` | `/categories` | 전역 카테고리 생성 |
| `PUT` | `/categories/:id` | 전역 카테고리 수정 |
| `DELETE` | `/categories/:id` | 전역 카테고리 삭제 |
| `GET` | `/settings` | 시스템 설정 조회 |
| `PUT` | `/settings` | 시스템 설정 변경 |
| `GET` | `/summary` | 시스템 요약 정보 |

---

## Docker 배포

### Dockerfile 작성 예시

프로젝트 루트에 `Dockerfile`을 생성합니다.

```dockerfile
# 빌드 스테이지
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

RUN npm run install:all

COPY . .
RUN cd server && npm run build
RUN cd client && npm run build

# 프로덕션 스테이지
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package*.json ./
COPY --from=builder /app/client/dist ./public

RUN npm install --omit=dev

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### docker-compose.yml 작성 예시

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - NODE_ENV=production
      - DB_PATH=/app/data/budget.db
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - JWT_EXPIRES_IN=15m
      - JWT_REFRESH_EXPIRES_IN=7d
    volumes:
      - app-data:/app/data

volumes:
  app-data:
```

### 실행

```bash
# 이미지 빌드
docker compose build

# 백그라운드 실행
docker compose up -d

# 로그 확인
docker compose logs -f

# 중지
docker compose down
```

SQLite 데이터는 `app-data` 볼륨에 저장되어 컨테이너를 재시작해도 유지됩니다.

---

## 테스트

### 서버 테스트

```bash
cd server

# 테스트 1회 실행
npm test

# watch 모드
npm run test:watch
```

서버 테스트는 Vitest와 supertest를 사용합니다. 테스트 실행 시 별도의 인메모리 SQLite 데이터베이스가 사용됩니다.

### 클라이언트 테스트

```bash
cd client

# 테스트 1회 실행
npm test

# watch 모드
npm run test:watch
```

클라이언트 테스트는 Vitest와 React Testing Library를 사용합니다.

---

## 스크린샷

> 스크린샷은 추후 추가될 예정입니다.
