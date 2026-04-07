# 인증 API (Auth)

> **⚠️ AI Agent 제약사항 (Constraints)**
> 이 API와 관련된 작업을 수행할 때 전체 프로젝트를 탐색하지 마십시오. 요구사항이 명확하다면 [`docs/knowledge-base.md`](../knowledge-base.md)에 명시된 **1. Auth** 관련 파일만 제한적으로 분석하고 수정하세요.

기본 경로: `/api/auth`

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| `POST` | `/register` | 회원가입 | ❌ |
| `POST` | `/login` | 로그인 | ❌ |
| `POST` | `/logout` | 로그아웃 | ✅ |
| `POST` | `/refresh` | 토큰 갱신 | ❌ (쿠키) |
| `GET` | `/me` | 내 정보 조회 | ✅ |
| `PATCH` | `/password` | 비밀번호 변경 | ✅ |

---

## POST /api/auth/register

회원가입. 최초 가입 유저는 자동으로 `admin` 역할이 부여됩니다.

**요청 본문:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "display_name": "홍길동"
}
```

| 필드 | 유효성 |
|------|--------|
| `email` | 유효한 이메일 형식 |
| `password` | 최소 8자 |
| `display_name` | 필수 |

**응답 (201):**

```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "user@example.com", "display_name": "홍길동", "role": "admin" },
    "accessToken": "eyJhbGci..."
  }
}
```

> 회원가입 시 기본 결제수단 **"현금"** (type: `cash`)이 자동 생성됩니다.
> 리프레시 토큰은 `HttpOnly` 쿠키(`refreshToken`)로 전달됩니다.

---

## POST /api/auth/login

로그인. 액세스 토큰과 리프레시 토큰(쿠키)을 발급합니다.

**요청 본문:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답 (200):**

```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "email": "user@example.com", "display_name": "홍길동", "role": "user" },
    "accessToken": "eyJhbGci..."
  }
}
```

---

## POST /api/auth/logout

로그아웃. 리프레시 토큰 쿠키를 제거합니다. (인증 선택)

---

## POST /api/auth/refresh

리프레시 토큰 쿠키로 새 액세스 토큰을 발급합니다.

**응답 (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "user": { "id": 1, "email": "user@example.com" }
  }
}
```

---

## GET /api/auth/me

현재 로그인한 사용자 정보를 반환합니다. `password_hash`는 응답에서 제외됩니다.

---

## PATCH /api/auth/password

비밀번호 변경.

**요청 본문:**

```json
{
  "current_password": "oldPassword",
  "new_password": "newPassword123"
}
```

---

## 🔬 테스트 하네스

테스트 파일: [`server/src/__tests__/auth.test.ts`](../../server/src/__tests__/auth.test.ts)

```bash
# 인증 API 전체 테스트
cd server && npx vitest run src/__tests__/auth.test.ts

# 특정 시나리오만
cd server && npx vitest run src/__tests__/auth.test.ts -t "register"
cd server && npx vitest run src/__tests__/auth.test.ts -t "login"
```

### 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 유효한 입력으로 회원가입 | `201` + user + accessToken + refreshToken 쿠키 |
| 2 | 중복 이메일로 회원가입 | `400` "이미 사용중인 이메일입니다" |
| 3 | 잘못된 이메일 형식 | `400` |
| 4 | 8자 미만 비밀번호 | `400` |
| 5 | 최초 가입 유저 → role: admin | `201` + `role: "admin"` |
| 6 | 회원가입 시 "현금" 결제수단 자동 생성 | DB에 PaymentMethod 1개 존재 |
| 7 | 올바른 자격증명으로 로그인 | `200` + accessToken + refreshToken 쿠키 |
| 8 | 잘못된 비밀번호 | `401` "이메일 또는 비밀번호가 올바르지 않습니다" |
| 9 | 존재하지 않는 이메일 | `401` |
| 10 | 비활성화된 계정 로그인 | `403` "비활성화된 계정입니다" |
| 11 | 로그아웃 → refreshToken 쿠키 삭제 | `200` + `refreshToken=;` |
| 12 | 유효한 리프레시 토큰으로 갱신 | `200` + 새 accessToken |
| 13 | 잘못된 리프레시 토큰 | `401` "유효하지 않은 리프레시 토큰입니다" |
| 14 | 유효한 액세스 토큰으로 `/me` | `200` + user (password_hash 제외) |
| 15 | 토큰 없이 `/me` | `401` "인증이 필요합니다" |
| 16 | 올바른 현재 비밀번호로 변경 | `200` "비밀번호가 변경되었습니다" |
| 17 | 틀린 현재 비밀번호로 변경 | `401` "현재 비밀번호가 올바르지 않습니다" |

### curl 예시

```bash
BASE_URL="http://localhost:3000/api"

# 회원가입
curl -c cookies.txt -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123","display_name":"홍길동"}'

# 로그인 (쿠키 저장)
curl -c cookies.txt -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"Password123"}'

# 내 정보 조회 (TOKEN은 로그인 응답의 accessToken)
TOKEN="eyJhbGci..."
curl -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $TOKEN"

# 토큰 갱신 (쿠키 자동 전송)
curl -b cookies.txt -X POST "$BASE_URL/auth/refresh"
```
