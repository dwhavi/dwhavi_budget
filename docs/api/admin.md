# 관리자 API (Admin)

> **⚠️ AI Agent 제약사항 (Constraints)**
> 이 API와 관련된 작업을 수행할 때 전체 프로젝트를 탐색하지 마십시오. 요구사항이 명확하다면 [`docs/knowledge-base.md`](../knowledge-base.md)에 명시된 **9. Admin** 관련 파일만 제한적으로 분석하고 수정하세요.

기본 경로: `/api/admin` (**관리자 권한 필요** — role: `admin`)

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

## 사용자 관리

### GET /api/admin/users

전체 사용자 목록을 반환합니다. `password_hash`는 제외됩니다.

**응답 (200):**
```json
{
  "success": true,
  "data": {
    "users": [
      { "id": 1, "email": "admin@example.com", "display_name": "Admin", "role": "admin", "is_active": true }
    ]
  }
}
```

### PUT /api/admin/users/:id/role

사용자 역할을 변경합니다.

**요청 본문:**
```json
{ "role": "admin" }
```

유효한 값: `"admin"`, `"user"` (그 외는 `400`)

### PUT /api/admin/users/:id/status

사용자 활성화/비활성화.

**요청 본문:**
```json
{ "is_active": false }
```

---

## 전역 카테고리 관리

### GET /api/admin/categories

모든 카테고리(전역 + 모든 유저 개인)를 반환합니다.

### POST /api/admin/categories

전역 카테고리를 생성합니다. (`user_id: null`로 저장)

**요청 본문:**
```json
{
  "name": "관리자카테고리",
  "type": "expense",
  "icon": "🔧",
  "color": "#ff0000"
}
```

### PUT /api/admin/categories/:id

전역 카테고리를 포함한 모든 카테고리 수정 가능.

### DELETE /api/admin/categories/:id

카테고리 소프트 삭제.

---

## 시스템 설정

### GET /api/admin/settings

```json
{
  "success": true,
  "data": {
    "settings": {
      "app_name": "Budget App",
      "budget_alert_threshold": 80,
      "default_currency": "KRW"
    }
  }
}
```

### PUT /api/admin/settings

**요청 본문:**
```json
{
  "app_name": "나의 가계부",
  "budget_alert_threshold": 90
}
```

| 필드 | 유효성 |
|------|--------|
| `budget_alert_threshold` | 0–100 (초과 시 `400`) |

---

## GET /api/admin/summary

시스템 전체 요약 정보.

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 5,
      "totalTransactions": 1234,
      "totalCategories": 15
    }
  }
}
```

---

## 🔬 테스트 하네스

테스트 파일: [`server/src/__tests__/admin.test.ts`](../../server/src/__tests__/admin.test.ts)

```bash
cd server && npx vitest run src/__tests__/admin.test.ts
```

### 테스트 시나리오

**사용자 관리**

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 관리자로 사용자 목록 조회 | `200` + users (password_hash 제외) |
| 2 | 일반 유저로 사용자 목록 조회 | `403` |
| 3 | 인증 없이 조회 | `401` |
| 4 | 유저 역할을 admin으로 변경 | `200` + role: "admin", DB 반영 |
| 5 | 유효하지 않은 role | `400` |
| 6 | 존재하지 않는 유저 role 변경 | `404` |
| 7 | 유저 비활성화 | `200` + is_active: false, DB 반영 |
| 8 | 존재하지 않는 유저 status 변경 | `404` |

**카테고리 관리**

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 9 | 전역 + 개인 카테고리 목록 | `200` + 모든 카테고리 |
| 10 | 전역 카테고리 생성 | `201` + user_id: null |
| 11 | 전역 카테고리 수정 | `200` + 변경된 name |
| 12 | 존재하지 않는 카테고리 수정 | `404` |
| 13 | 전역 카테고리 소프트 삭제 | `200` + DB에 deleted_at 존재 |

**시스템 설정**

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 14 | 설정 조회 | `200` + app_name, budget_alert_threshold, default_currency |
| 15 | 설정 변경 | `200` + 변경된 값 반영 |
| 16 | 변경 후 재조회 | 변경 값 유지 |
| 17 | threshold > 100 | `400` |

**요약**

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 18 | 시스템 요약 조회 | `200` + totalUsers=2, totalTransactions=0, totalCategories≥1 |

### curl 예시

```bash
BASE_URL="http://localhost:3000/api"
ADMIN_TOKEN="eyJhbGci..."

# 사용자 목록
curl -X GET "$BASE_URL/admin/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 역할 변경
curl -X PUT "$BASE_URL/admin/users/2/role" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "admin"}'

# 전역 카테고리 생성
curl -X POST "$BASE_URL/admin/categories" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "투자", "type": "income", "icon": "📈", "color": "#22c55e"}'

# 설정 변경
curl -X PUT "$BASE_URL/admin/settings" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"app_name": "나의 가계부", "budget_alert_threshold": 90}'

# 시스템 요약
curl -X GET "$BASE_URL/admin/summary" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```
