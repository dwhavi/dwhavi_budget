# 가계부 웹 앱 개발 프롬프트

## 프로젝트 개요
한국어 가계부 웹 애플리케이션. 사용자가 일상적인 수입/지출을 기록하고, 달력과 차트로 시각적으로 확인하며, 통계를 통해 소비 패턴을 분석할 수 있는 풀스택 앱이다.

## API 응답 형식 통일

모든 API는 아래 형식을 따른다.

**성공:**
```json
{ "success": true, "data": { ... } }
```

**실패:**
```json
{ "success": false, "message": "에러 메시지" }
```

상태 코드: 400 (입력 오류), 401 (인증 필요), 403 (권한 없음), 404 (리소스 없음), 500 (서버 오류)

## 기술 스택

| 계층 | 기술 |
|------|------|
| Frontend | React 18 + Vite + TypeScript |
| UI | Tailwind CSS + Recharts |
| Backend | Node.js + Express + TypeScript |
| DB | SQLite + Sequelize ORM |
| 인증 | JWT (access + refresh token) |
| 기타 | bcryptjs, cookie-parser, concurrently, Zod |
| 배포 | Docker Compose (선택) |

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
- **비밀번호 변경**: 로그인 상태에서 현재 비밀번호 확인 후 새 비밀번호로 변경
- **입력 검증 (Zod)**:
  - 이메일: 유효한 이메일 형식
  - 비밀번호: 최소 8자, 영문+숫자 포함
  - display_name: 2~20자

### 2. 가계부 기록 CRUD

- 수입/지출 등록 항목: 날짜, 금액, 카테고리, **결제수단**, 메모
- **결제수단 선택**: 지출 입력 시 간단한 선택창에서 현금 또는 등록된 카드 중 선택
- **하위 카테고리 지원**:
  - 카테고리 선택 후 하위 카테고리 입력 가능 (자유 입력, 텍스트)
  - **자동완성**: 사용자가 이전에 입력한 하위 카테고리를 기반으로 드롭다운 자동완성 제공
  - 예시: 식비 → 점심, 저녁, 아침, 커피, 디저트, 야식...
  - 동일 카테고리 내에서만 자동완성 후보 표시
  - 하위 카테고리는 필수가 아닌 선택 입력
- 기본 카테고리 제공:
  - 수입: 급여, 부수입, 용돈
  - 지출: 식비, 교통, 주거, 통신, 유흥, 쇼핑, 의료, 교육, 기타
- 월별 필터링으로 기록 조회, 수정 및 삭제 가능
- 금액은 한국어 원화 표기 (₩), DB에는 정수로 저장 (1 이상 99,999,999 이하)
- **소프트 삭제**: 삭제 시 `deleted_at`에 타임스탬프 기록, 조회에서 제외, 복구 가능
- **카테고리 타입 검증**: 수입 카테고리로는 수입만, 지출 카테고리로는 지출만 등록 가능
- **검색/필터**: 카테고리, 결제수단, 금액 범위, 키워드(memo)로 필터링 가능
- **정렬**: 날짜(기본/최신순), 금액(높은순/낮은순), 카테고리별 정렬 가능
- **페이징**: 기록 목록은 `page`(기본 1), `limit`(기본 20, 최대 100) 파라미터로 페이지네이션

### 3. 대시보드 (메인 페이지)

대시보드는 로그인 후 첫 화면이며, 한눈에 이번 달의 재정 현황을 파악할 수 있도록 구성한다.

**① 요약 카드 (상단)**
- 이번 달 총수입 / 총지출 / 잔액 (수입 - 지출)
- 예산 초과 경고 표시 (월별 예산 대비 지출이 임계값 초과 시)

**② 달력 (메인 영역)**
- 월별 캘린더 프레임
- 일자별 수입(파란색) / 지출(빨간색) 금액 표시
- 날짜 클릭 → 해당 일 상세 내역 팝업
- 날짜 선택 → 바로 수입/지출 빠른 등록 (사이드 패널 또는 모달로 입력 폼 오픈)
- 이전/다음 달 이동

**③ 최근 거래 내역 (하단 또는 사이드)**
- 최근 5~10건의 거래를 최신순으로 표시
- 날짜, 카테고리, 금액, 메모(있는 경우) 노출
- 클릭 시 상세 조회 또는 수정 진입

**④ 카테고리별 소비 순위 (하단 또는 사이드)**
- 당월 지출 카테고리별 금액 순위 (상위 5개)
- 막대 차트 또는 프로그레스 바로 시각화
- 카테고리 색상과 금액 함께 표시

**⑤ 월별 추이 미니 차트 (옵션)**
- 최근 6개월 수입 vs 지출 미니 라인/막대 차트
- 통계 페이지 상세보기 링크 포함

**⑥ 일일 예상 소비액 (요약 카드 내 표시)**
- `잔여 금액 ÷ 잔여일 수`로 일일 예상 소비액 자동 계산
- 요약 카드 영역에 "오늘까지 써도 되는 금액"으로 직관 표시
- 예: 잔액 2,659,500원 ÷ 잔여 25일 = 일일 106,380원

**⑦ 카드별 월별 집계 (요약 카드 하단 또는 별도 영역)**
- 이번 달 결제수단별 총 사용 금액을 막대 차트로 표시
- 카드명 + 금액 + 비율 노출
- 클릭 시 해당 카드의 상세 내역 필터링

### 4. 통계 페이지

- **월별 추이 차트**: 최근 6개월 수입 vs 지출 (막대/선 차트)
- **카테고리별 차트**: 당월 지출 카테고리 비율 (파이/도넛 차트)
- **예산 관리**: 월별 카테고리별 예산 설정 및 달성률 표시
- **예산 알림**: 월별 예산 대비 지출이 임계값(%) 초과 시 대시보드에 경고 표시

### 5. 내 카드 관리 (설정 페이지)

- 소유 카드 등록: 카드명, 카드사, 카드 종류 (신용/체크), UI 색상, 메모
- 카드 목록 조회 / 수정 / 삭제
- 기본 결제 카드 설정 가능 (is_default)
- **현금 기본 제공**: 회원가입 시 자동으로 "현금" 결제수단 생성 (삭제 불가)
- **소프트 삭제**: 카드 삭제 시 `deleted_at` 기록, 연동된 기록에는 유지 표시
- 설정 페이지는 탭 구성: 카드 관리 / 예산 설정 / **고정비 관리**

### 5-1. 고정비 관리

- **고정비 등록**: 항목명, 금액, 결제수단, 카테고리, 결제일(매월 N일), 메모
- **자동 등록**: 매월 설정된 결제일에 해당 월의 거래에 자동으로 추가
- 예시: TV/인터넷(38,805원/월), 핸드폰(25,000원/월), 관리비(103,160원/월) 등
- 고정비 목록 조회 / 수정 / 삭제
- 당월 고정비 합계를 대시보드에 별도 표시 가능
- 활성/비활성 토글 (일시 중단 가능)

### 6. 관리자 페이지

- **접근 권한**: `role=admin` 유저만 접근, 네비게이션에 조건부 표시
- **사용자 관리**: 전체 사용자 목록, 권한 변경, 계정 활성/비활성화
- **카테고리 관리**: 기본 카테고리 CRUD, 색상/아이콘 수정, 순서 변경
- **카테고리 관리 범위**: 전역 카테고리(관리자 관리) + 사용자 개인 카테고리(직접 추가/수정 가능)
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
| display_name | STRING(20) | 표시 이름 |
| role | ENUM('admin','user') | 기본 'user' |
| is_active | BOOLEAN | 기본 true |
| created_at | DATE | |
| updated_at | DATE | |

### Category
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK AUTO | |
| user_id | INTEGER FK → User | NULL = 전역(관리자), NOT NULL = 개인 카테고리 |
| name | STRING NOT NULL | 카테고리명 |
| type | ENUM('income','expense') | |
| icon | STRING | 아이콘명 |
| color | STRING | 표시 색상 |
| sort_order | INTEGER | 정렬 순서 |
| deleted_at | DATE | 소프트 삭제 |

- 사용자는 전역 카테고리(공통) + 자신의 개인 카테고리를 모두 사용 가능
- 전역 카테고리는 관리자만 CRUD 가능, 개인 카테고리는 본인만 CRUD 가능

### Transaction
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK AUTO | |
| user_id | INTEGER FK → User | |
| type | ENUM('income','expense') | |
| amount | INTEGER NOT NULL | 원화 정수 (1~99,999,999) |
| category_id | INTEGER FK → Category | |
| payment_method_id | INTEGER FK → PaymentMethod | nullable |
| date | DATEONLY NOT NULL | |
| sub_category | STRING | 하위 카테고리 (선택, 자유 입력) |
| memo | STRING | |
| created_at | DATE | |
| updated_at | DATE | |
| deleted_at | DATE | 소프트 삭제 |

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
| created_at | DATE | |
| updated_at | DATE | |
| deleted_at | DATE | 소프트 삭제 |

- 회원가입 시 자동으로 `type='cash', name='현금'` 결제수단 생성 (삭제 불가)

### Budget
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK AUTO | |
| user_id | INTEGER FK → User | |
| category_id | INTEGER FK → Category | |
| month | STRING('YYYY-MM') | |
| amount | INTEGER NOT NULL | 예산 금액 |

### RecurringExpense (고정비)
| 필드 | 타입 | 설명 |
|------|------|------|
| id | INTEGER PK AUTO | |
| user_id | INTEGER FK → User | |
| name | STRING NOT NULL | 항목명 |
| amount | INTEGER NOT NULL | 금액 |
| category_id | INTEGER FK → Category | |
| payment_method_id | INTEGER FK → PaymentMethod | |
| payment_day | INTEGER | 매월 결제일 (1~28) |
| memo | STRING | |
| is_active | BOOLEAN | 기본 true |
| created_at | DATE | |
| updated_at | DATE | |
| deleted_at | DATE | 소프트 삭제 |

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
| PATCH | /api/auth/password | 비밀번호 변경 (현재 비밀번호 확인 필요) |

### Transactions
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/transactions?month=YYYY-MM&page=1&limit=20&sort=date&order=desc&category_id=&payment_method_id=&min_amount=&max_amount=&keyword= | 기록 조회 (필터/페이징/정렬) |
| GET | /api/transactions?date=YYYY-MM-DD | 특정 일자 기록 조회 |
| POST | /api/transactions | 기록 등록 |
| PUT | /api/transactions/:id | 기록 수정 |
| DELETE | /api/transactions/:id | 기록 삭제 (소프트) |
| PATCH | /api/transactions/:id/restore | 삭제된 기록 복구 |

### Stats
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/stats/dashboard?month=YYYY-MM | 대시보드 요약 (일일 예상 소비액, 카드별 집계 포함) |
| GET | /api/stats/payment-methods?month=YYYY-MM | 결제수단별 월별 사용 금액 |
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
| GET | /api/payment-methods | 내 카드 목록 (삭제 제외) |
| POST | /api/payment-methods | 카드 등록 |
| PUT | /api/payment-methods/:id | 카드 수정 |
| DELETE | /api/payment-methods/:id | 카드 삭제 (소프트, 현금 제외) |

### RecurringExpenses (고정비)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/recurring-expenses | 고정비 목록 |
| POST | /api/recurring-expenses | 고정비 등록 |
| PUT | /api/recurring-expenses/:id | 고정비 수정 |
| DELETE | /api/recurring-expenses/:id | 고정비 삭제 (소프트) |
| PATCH | /api/recurring-expenses/:id/toggle | 활성/비활성 토글 |
| GET | /api/recurring-expenses/month-summary?month=YYYY-MM | 당월 고정비 합계 |

### SubCategories (자동완성)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/subcategories?category_id=1&q=점 | 하위 카테고리 자동완성 검색 |

- 자동완성은 사용자의 기존 Transaction에서 `sub_category` 값을 카테고리별로 그룹핑하여 반환

### Admin (role=admin 필수)
| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | /api/admin/users | 전체 사용자 목록 |
| PUT | /api/admin/users/:id/role | 권한 변경 |
| PUT | /api/admin/users/:id/status | 계정 활성/비활성화 |
| GET | /api/admin/categories | 카테고리 목록 |
| POST | /api/admin/categories | 카테고리 추가 |
| PUT | /api/admin/categories/:id | 카테고리 수정 |
| DELETE | /api/admin/categories/:id | 카테고리 삭제 (소프트) |
| GET | /api/admin/settings | 시스템 설정 조회 |
| PUT | /api/admin/settings | 시스템 설정 변경 |

---

## 개발 지침

1. `server/`와 `client/`를 각각 독립 실행 가능하게 구성
2. `npm run dev`로 server + client 동시 실행 (concurrently)
3. DB 초기화 시 기본 카테고리 시드 데이터 자동 생성
4. 모든 API는 인증 필수 (auth middleware), Admin API는 admin 미들웨어 추가
5. 입력값 검증은 Zod 사용 (이메일 형식, 비밀번호 8자+영숫자, 금액 범위 등)
6. CORS 설정 (개발 시 `localhost:5173` 허용)
7. 첫 회원가입 유저는 자동으로 admin role 부여
8. 회원가입 시 기본 "현금" 결제수단 자동 생성
9. README.md에 설치 및 실행 방법, API 명세 작성
10. 소프트 삭제 모델은 조회 시 `deleted_at IS NULL` 조건 적용

## 환경변수 (`.env.example`)

```
# Server
PORT=3000
NODE_ENV=development

# Database
DB_PATH=./data/budget.db

# JWT
JWT_SECRET=<생성된 시크릿 키>
JWT_REFRESH_SECRET=<생성된 시크릿 키>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Client
VITE_API_URL=http://localhost:3000/api
```

## 최종 산출물

- 완전히 동작하는 가계부 앱
- `npm install && npm run dev`로 즉시 실행 가능
- `.env.example` 포함
- README.md 포함 (설치, 실행, API 명세, 배포 가이드)
