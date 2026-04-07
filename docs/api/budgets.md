# 예산 API (Budgets)

> **⚠️ AI Agent 제약사항 (Constraints)**
> 이 API와 관련된 작업을 수행할 때 전체 프로젝트를 탐색하지 마십시오. 요구사항이 명확하다면 [`docs/knowledge-base.md`](../knowledge-base.md)에 명시된 **7. Budgets** 관련 파일만 제한적으로 분석하고 수정하세요.

기본 경로: `/api/budgets` (모든 엔드포인트 인증 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/` | 예산 목록 조회 |
| `PUT` | `/` | 예산 설정 (upsert) |

---

## GET /api/budgets

특정 월의 예산 목록을 조회합니다. 카테고리 정보가 함께 반환됩니다.

**쿼리 파라미터:**

| 파라미터 | 설명 |
|----------|------|
| `month` | 조회할 월 (예: `2026-04`) |

**응답 (200):**

```json
{
  "success": true,
  "data": {
    "budgets": [
      {
        "id": 1,
        "category_id": 4,
        "month": "2026-04",
        "amount": 500000,
        "category": { "id": 4, "name": "식비", "icon": "🍽️", "color": "#ef4444" }
      }
    ]
  }
}
```

---

## PUT /api/budgets

카테고리별 예산을 설정합니다. **이미 존재하는 (category_id + month) 조합은 업데이트됩니다 (upsert).**

**요청 본문:**

```json
{
  "budgets": [
    { "category_id": 4, "month": "2026-04", "amount": 300000 },
    { "category_id": 5, "month": "2026-04", "amount": 150000 }
  ]
}
```

| 필드 | 유효성 |
|------|--------|
| `category_id` | 유효한 카테고리 ID |
| `month` | `YYYY-MM` 형식 |
| `amount` | 0 이상 (음수 불가) |

**응답 (200):**

```json
{
  "success": true,
  "data": {
    "budgets": [...]
  }
}
```

---

## 🔬 테스트 하네스

테스트 파일: [`server/src/__tests__/budgets.test.ts`](../../server/src/__tests__/budgets.test.ts)

```bash
cd server && npx vitest run src/__tests__/budgets.test.ts
```

### 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 예산 미설정 상태 조회 | `200` + `budgets: []` |
| 2 | 특정 월 예산 조회 + 카테고리 정보 | `200` + budget 포함 category 객체 |
| 3 | 인증 없이 조회 | `401` |
| 4 | 유저 격리: 타인 예산 미노출 | 각 유저가 본인 예산만 조회 |
| 5 | 복수 예산 동시 생성 (bulk upsert) | `200` + 2개 생성, DB에도 2개 |
| 6 | 동일 (category_id + month)로 재요청 | `200` + 1개 유지 (업데이트), 중복 미생성 |
| 7 | 잘못된 month 형식 (`2026-4`) | `400` |
| 8 | 음수 amount | `400` |
| 9 | 인증 없이 수정 | `401` |

### curl 예시

```bash
BASE_URL="http://localhost:3000/api"
TOKEN="eyJhbGci..."

# 4월 예산 조회
curl -X GET "$BASE_URL/budgets?month=2026-04" \
  -H "Authorization: Bearer $TOKEN"

# 예산 설정 (upsert)
curl -X PUT "$BASE_URL/budgets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "budgets": [
      { "category_id": 4, "month": "2026-04", "amount": 300000 },
      { "category_id": 5, "month": "2026-04", "amount": 100000 }
    ]
  }'
```
