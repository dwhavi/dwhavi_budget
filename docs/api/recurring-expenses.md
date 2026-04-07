# 고정 지출 API (Recurring Expenses)

> **⚠️ AI Agent 제약사항 (Constraints)**
> 이 API와 관련된 작업을 수행할 때 전체 프로젝트를 탐색하지 마십시오. 요구사항이 명확하다면 [`docs/knowledge-base.md`](../knowledge-base.md)에 명시된 **6. Recurring Expenses** 관련 파일만 제한적으로 분석하고 수정하세요.

기본 경로: `/api/recurring-expenses` (모든 엔드포인트 인증 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/` | 고정 지출 목록 |
| `POST` | `/` | 고정 지출 생성 |
| `PUT` | `/:id` | 고정 지출 수정 |
| `DELETE` | `/:id` | 고정 지출 소프트 삭제 |
| `PATCH` | `/:id/toggle` | 활성화/비활성화 전환 |
| `GET` | `/month-summary` | 월별 고정 지출 요약 |

---

## GET /api/recurring-expenses

본인의 고정 지출 목록을 반환합니다. 소프트 삭제된 항목은 제외됩니다.

**응답 (200):**

```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": 1,
        "name": "넷플릭스",
        "amount": 15000,
        "category_id": 7,
        "payment_method_id": 2,
        "start_date": "2026-01-01",
        "end_date": "2026-12-31",
        "is_active": true,
        "memo": "월 구독"
      }
    ]
  }
}
```

---

## POST /api/recurring-expenses

고정 지출을 생성합니다. 기본적으로 `is_active: true`로 생성됩니다.

**요청 본문:**

```json
{
  "name": "넷플릭스",
  "amount": 15000,
  "category_id": 7,
  "payment_method_id": 2,
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "memo": "월 구독"
}
```

| 필드 | 필수 | 설명 |
|------|------|------|
| `name` | ✅ | 고정 지출 이름 |
| `amount` | ✅ | 금액 |
| `category_id` | ✅ | 카테고리 ID |
| `payment_method_id` | ❌ | 결제수단 ID |
| `start_date` | ✅ | 시작일 (`YYYY-MM-DD`) |
| `end_date` | ❌ | 종료일 (`YYYY-MM-DD`) |
| `memo` | ❌ | 메모 |

---

## PUT /api/recurring-expenses/:id

고정 지출을 수정합니다.

---

## DELETE /api/recurring-expenses/:id

고정 지출을 소프트 삭제합니다. 삭제 후 목록에서 제외됩니다.

---

## PATCH /api/recurring-expenses/:id/toggle

`is_active` 값을 토글합니다. `true → false → true` 반복.

---

## GET /api/recurring-expenses/month-summary

특정 월에 적용되는 활성화된 고정 지출 요약을 반환합니다.

**쿼리 파라미터:**

| 파라미터 | 설명 |
|----------|------|
| `month` | 조회할 월 (예: `2026-04`) |

**필터 조건:**
- `is_active: true`
- `start_date ≤ month 마지막 날`
- `end_date ≥ month 첫 날` (또는 `end_date` 없음)

**응답 (200):**

```json
{
  "success": true,
  "data": {
    "totalAmount": 25000,
    "count": 2,
    "expenses": [...]
  }
}
```

---

## 🔬 테스트 하네스

테스트 파일: [`server/src/__tests__/recurring-expenses.test.ts`](../../server/src/__tests__/recurring-expenses.test.ts)

```bash
cd server && npx vitest run src/__tests__/recurring-expenses.test.ts
```

### 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 초기 상태 목록 조회 | `200` + `expenses: []` |
| 2 | start_date + end_date 포함 생성 | `201` + name, amount, dates, is_active: true |
| 3 | 수정 | `200` + 변경된 amount, name |
| 4 | 소프트 삭제 후 목록에서 제외 | `200` + DB에 deleted_at 존재, 목록 0개 |
| 5 | toggle: true→false→true | `200` + is_active 교대 변경 |
| 6 | 월별 요약: 활성 & 기간 내 항목만 | `200` + totalAmount=25000, count=2 |
| 7 | 월별 요약: 만료된 항목 제외 | `200` + 과거 종료 항목 제외, totalAmount=15000 |

### curl 예시

```bash
BASE_URL="http://localhost:3000/api"
TOKEN="eyJhbGci..."

# 목록 조회
curl -X GET "$BASE_URL/recurring-expenses" \
  -H "Authorization: Bearer $TOKEN"

# 생성
curl -X POST "$BASE_URL/recurring-expenses" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "넷플릭스",
    "amount": 15000,
    "category_id": 7,
    "payment_method_id": 2,
    "start_date": "2026-01-01",
    "end_date": "2026-12-31",
    "memo": "월 구독"
  }'

# 활성화/비활성화 토글
curl -X PATCH "$BASE_URL/recurring-expenses/1/toggle" \
  -H "Authorization: Bearer $TOKEN"

# 이번 달 요약
curl -X GET "$BASE_URL/recurring-expenses/month-summary?month=2026-04" \
  -H "Authorization: Bearer $TOKEN"
```
