# 가계부 웹 앱 개발 프롬프트

## 프로젝트 개요
한국어 가계부 웹 애플리케이션. 사용자가 일상적인 수입/지출을 기록하고, 달력과 차트로 시각적으로 확인하며, 통계를 통해 소비 패턴을 분석할 수 있는 풀스택 앱이다.

## 기술 스택

| 계층 | 기술 |
|------|------|
| Frontend | React 18 + Vite + TypeScript |
| UI | Tailwind CSS + Recharts |
| Backend | Node.js + Express + TypeScript |
| DB | SQLite + Sequelize ORM |
| 인증 | JWT (access + refresh token) |
| 기타 | bcryptjs, cookie-parser, concurrently, Zod |

## 프로젝트 구조

```
budget-app/
├── client/                # React 프론트엔드
│   ├── src/
│   │   ├── components/    # 공통 컴포넌트 (Calendar, Modal, Toast 등)
│   │   ├── pages/         # 페이지별 컴포넌트
│   │   │   ├── LoginPage
│   │   │   ├── RegisterPage
│   │   │   ├── Dashboard  # 메인 (달력 + 요약)
│   │   │   ├── Transactions  # 기록 목록
│   │   │   ├── Stats      # 상세 통계
│   │   │   ├── Settings   # 내 카드 관리
│   │   │   └── Admin      # 관리자 페이지
│   │   ├── api/           # axios 인스턴스 + interceptor
│   │   ├── hooks/         # 커스텀 훅
│   │   ├── contexts/      # AuthContext, ThemeContext
│   │   └── types/         # TypeScript 타입 정의
│   └── ...
├── server/                # Express 백엔드
│   ├── src/
│   │   ├── routes/        # auth, transactions, stats, budgets, payment-methods, admin
│   │   ├── middleware/    # auth, admin, errorHandler, validate
│   │   ├── models/        # Sequelize 모델
│   │   ├── seeders/       # 기본 카테고리 시드
│   │   └── index.ts
│   └── ...
└── README.md
```

---

## 요구사항

### 1. 인증 시스템

- 이메일 + 비밀번호 회원가입 / 로그인
- JWT access token (15분 만료) + refresh token (7일 만료)
- refresh token은 httpOnly 쿠키에 저장
- access token 만료 시 refresh token으로 자동 갱신 (axios interceptor)
- **자동 로그인**: 브라우저 재방문 시 refresh token 쿠키가 존재하면 자동으로 인증 복구
- 로그아웃 시 refresh token 쿠키 삭제
- 유저 역할: `admin` / `user` (기본 `user`)

### 2. 가계부 기록 CRUD

- 수입/지출 등록 항목: 날짜, 금액, 카테고리, **결제수단**, 메모
- **결제수단 선택**: 지출 입력 시 간단한 선택창에서 현금 또는 등록된 카드 중 선택
- 기본 카테고리 제공:
  - 수입: 급여, 부수입, 용돈
  - 지출: 식비, 교통, 주거, 통신, 유흥, 쇼핑, 의료, 교육, 기타
- 월별 필터링으로 기록 조회, 수정 및 삭제 가능
- 금액은 한국어 원화 표기 (₩), DB에는 정수로 저장

### 3. 대시보드 (메인 페이지)

- **요약 카드**: 이번 달 총수입 / 총지출 / 잔액
- **달력 형태 일별 내역**:
  - 해당 월의 캘린더 프레임에 일자별 지출/수입 금액을 표시
  - 수입은 파란색, 지출은 빨간색 등 색상으로 구분
  - 날짜 클릭 시 해당 일자의 상세 내역 팝업 표시
  - 달력에서 날짜 선택 후 바로 지출/수입 빠른 등록 가능
- 월 이동 (이전/다음 달) 가능

### 4. 통계 페이지

- **월별 추이 차트**: 최근 6개월 수입 vs 지출 (막대/선 차트)
- **카테고리별 차트**: 당월 지출 카테고리 비율 (파이/도넛 차트)
- **예산 관리**: 월별 카테고리별 예산 설정 및 달성률 표시

### 5. 내 카드 관리 (설정 페이지)

- 소유 카드 등록: 카드명, 카드사, 카드 종류 (신용/체크), UI 색상, 메모
- 카드 목록 조회 / 수정 / 삭제
- 기본 결제 카드 설정 가능 (is_default)
- 설정 페이지는 탭 구성: 카드 관리 / 예산 설정

### 6. 관리자 페이지

- **접근 권한**: `role=admin` 유저만 접근, 네비게이션에 조건부 표시
- **사용자 관리**: 전체 사용자 목록, 권한 변경, 계정 활성/비활성화
- **카테고리 관리**: 기본 카테고리 CRUD, 색상/아이콘 수정, 순서 변경
- **시스템 설정**: 앱 이름, 기본 통화, 예산 알림 임계값 등 전역 설정
- **시스템 대시보드**: 전체 사용자 수, 총 거래 건수 등 요약

### 7. UI/UX

- **한국어 인터페이스** (모든 텍스트 한국어)
- **반응형 디자인** (모바일/태블릿/데스크톱 지원)
- **다크 모드** 지원 (토글 전환, 사용자 설정 저장)
- 내비게이션: 대시보드 / 기록 / 통계 / 설정 / 관리자(ADMIN 전용)
- 토스트 알림 (성공/에러/경고)
- 로딩 스켈레톤 UI
- 모달 기반 입력 폼 (지출/수입 등록, 수정)

---

## DB 모델 (Sequelize)

### User
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK AUTO | |
| email | STRING UNIQUE NOT NULL | |
| password_hash | STRING NOT NULL | |
| role | ENUM('admin','user') | 기본 'user' |
| is_active | BOOLEAN | 기본 true |
| created_at | DATE | |
| updated_at | DATE | |

### Category
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK AUTO | |
| name | STRING NOT NULL | 카테고리명 |
| type | ENUM('income','expense') | |
| icon | STRING | 아이콘명 |
| color | STRING | 표시 색상 |
| sort_order | INTEGER | 정렬 순서 |

### Transaction
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK AUTO | |
| user_id | INTEGER FK → User | |
| type | ENUM('income','expense') | |
| amount | INTEGER NOT NULL | 원화 정수 |
| category_id | INTEGER FK → Category | |
| payment_method_id | INTEGER FK → PaymentMethod | nullable |
| date | DATEONLY NOT NULL | |
| memo | STRING | |

### PaymentMethod
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK AUTO | |
| user_id | INTEGER FK → User | |
| name | STRING NOT NULL | 카드명 |
| issuer | STRING | 카드사 |
| type | ENUM('credit','debit','cash') | |
| color | STRING | UI 색상 |
| is_default | BOOLEAN | 기본 false |
| memo | STRING | |

### Budget
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK AUTO | |
| user_id | INTEGER FK → User | |
| category_id | INTEGER FK → Category | |
| month | STRING('YYYY-MM') | |
| amount | INTEGER NOT NULL | 예산 금액 |

---

## API 엔드포인트

### Auth
| 메서드 | 경로 | 설명 |
|--------|------|------|
| POST | /api/auth/register | 회원가입 |
| POST | /api/auth/login | 로그인 (httpOnly 쿠키에 refresh token 설정) |
| POST | /api/auth/logout | 로그아웃 (쿠키 삭제) |
| POST | /api/auth/refresh | 토큰 갱신 |
| GET | /api/auth/me | 현재 유저 정보 |

### Transactions
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/transactions?month=YYYY-MM | 월별 기록 조회 |
| GET | /api/transactions?date=YYYY-MM-DD | 특정 일자 기록 조회 |
| POST | /api/transactions | 기록 등록 |
| PUT | /api/transactions/:id | 기록 수정 |
| DELETE | /api/transactions/:id | 기록 삭제 |

### Stats
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/stats/dashboard?month=YYYY-MM | 대시보드 요약 |
| GET | /api/stats/monthly-trend | 최근 6개월 추이 |
| GET | /api/stats/category?month=YYYY-MM | 카테고리별 통계 |

### Budgets
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/budgets?month=YYYY-MM | 월별 예산 조회 |
| PUT | /api/budgets | 예산 설정/수정 (bulk upsert) |

### PaymentMethods
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/payment-methods | 내 카드 목록 |
| POST | /api/payment-methods | 카드 등록 |
| PUT | /api/payment-methods/:id | 카드 수정 |
| DELETE | /api/payment-methods/:id | 카드 삭제 |

### Admin (role=admin 필수)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/admin/users | 전체 사용자 목록 |
| PUT | /api/admin/users/:id/role | 권한 변경 |
| PUT | /api/admin/users/:id/status | 계정 활성/비활성화 |
| GET | /api/admin/categories | 카테고리 목록 |
| POST | /api/admin/categories | 카테고리 추가 |
| PUT | /api/admin/categories/:id | 카테고리 수정 |
| DELETE | /api/admin/categories/:id | 카테고리 삭제 |
| GET | /api/admin/settings | 시스템 설정 조회 |
| PUT | /api/admin/settings | 시스템 설정 변경 |

---

## 개발 지침

1. `server/`와 `client/`를 각각 독립 실행 가능하게 구성
2. `npm run dev`로 server + client 동시 실행 (concurrently)
3. DB 초기화 시 기본 카테고리 시드 데이터 자동 생성
4. 모든 API는 인증 필수 (auth middleware), Admin API는 admin 미들웨어 추가
5. 에러 응답 형식 통일: `{ success: false, message: string }` (400/401/403/404/500)
6. 입력값 검증은 Zod 사용
7. CORS 설정 (개발 시 `localhost:5173` 허용)
8. 첫 회원가입 유저는 자동으로 admin role 부여
9. README.md에 설치 및 실행 방법, API 명세 작성

## 최종 산출물

- 완전히 동작하는 가계부 앱
- `npm install && npm run dev`로 즉시 실행 가능
- README.md 포함
