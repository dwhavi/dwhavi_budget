# 아키텍처

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
├── docs/                      # 기능별 문서 (이 폴더)
│   ├── getting-started.md
│   ├── architecture.md
│   ├── deployment.md
│   ├── testing.md
│   └── api/
│       ├── auth.md
│       ├── transactions.md
│       ├── categories.md
│       ├── payment-methods.md
│       ├── subcategories.md
│       ├── recurring-expenses.md
│       ├── budgets.md
│       ├── stats.md
│       └── admin.md
├── .env.example               # 환경변수 템플릿
└── package.json               # 루트 패키지 (워크스페이스)
```

---

## 인증 흐름

```
클라이언트                        서버
   │                               │
   │── POST /api/auth/login ──────▶│
   │                               │── JWT 액세스 토큰 발급 (15분)
   │                               │── 리프레시 토큰 쿠키 발급 (7일)
   │◀── accessToken + cookie ──────│
   │                               │
   │── API 요청 (Authorization: Bearer <token>) ──▶│
   │                               │
   │  [토큰 만료 시]                │
   │── POST /api/auth/refresh ─────▶│ (cookie 자동 전송)
   │◀── 새 accessToken ────────────│
```

## 데이터 모델 관계

```
User
 ├── Category (user_id nullable → 전역/개인)
 ├── PaymentMethod
 ├── Transaction
 │    ├── Category
 │    └── PaymentMethod
 ├── Budget
 │    └── Category
 └── RecurringExpense
      ├── Category
      └── PaymentMethod
```

> **Soft Delete**: Transaction, Category, PaymentMethod, RecurringExpense는 `deleted_at` 필드를 사용해 소프트 삭제됩니다. 일반 조회에서는 자동으로 제외됩니다.
