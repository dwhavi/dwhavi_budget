# 거래내역 API (Transactions)

> **⚠️ AI Agent 제약사항 (Constraints)**
> 이 API와 관련된 작업을 수행할 때 전체 프로젝트를 탐색하지 마십시오. 요구사항이 명확하다면 [`docs/knowledge-base.md`](../knowledge-base.md)에 명시된 **2. Transactions** 관련 파일만 제한적으로 분석하고 수정하세요.

기본 경로: `/api/transactions` (모든 엔드포인트 인증 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/` | 거래내역 목록 조회 (필터/정렬/페이지) |
| `POST` | `/` | 거래내역 생성 |
| `PUT` | `/:id` | 거래내역 수정 |
| `DELETE` | `/:id` | 거래내역 소프트 삭제 |
| `PATCH` | `/:id/restore` | 삭제된 거래내역 복구 |

---

## GET /api/transactions

거래내역 목록을 페이지네이션 및 필터와 함께 조회합니다.

**쿼리 파라미터:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `month` | string | 월 필터 (예: `2026-04`) |
| `date` | string | 특정 날짜 필터 (`YYYY-MM-DD`) |
| `category_id` | number | 카테고리 ID |
| `payment_method_id` | number | 결제수단 ID |
| `min_amount` | number | 최소 금액 |
| `max_amount` | number | 최대 금액 |
| `keyword` | string | 메모 검색 키워드 |
| `sort` | string | 정렬 필드 (`date`, `amount` 등) |
| `order` | string | 정렬 방향 (`asc` / `desc`) |
| `page` | number | 페이지 번호 (기본: 1) |
| `limit` | number | 페이지당 항목 수 (기본: 20) |

**응답 (200):**

```json
{
  "success": true,
  "data": {
    "transactions": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 42,
      "totalPages": 3
    }
  }
}
```

---

## POST /api/transactions

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
| `amount` | number | ✅ | 금액 (1 이상 99,999,999 이하) |
| `category_id` | number | ✅ | 카테고리 ID (type과 일치해야 함) |
| `payment_method_id` | number | ❌ | 결제수단 ID |
| `date` | string | ✅ | 날짜 (`YYYY-MM-DD`) |
| `sub_category` | string | ❌ | 서브카테고리 |
| `memo` | string | ❌ | 메모 |

> **주의:** `type`이 `income`이면 `income` 타입 카테고리만, `expense`이면 `expense` 타입 카테고리만 선택 가능합니다.

---

## PUT /api/transactions/:id

거래내역을 수정합니다. 요청 본문은 생성과 동일합니다. 본인 거래만 수정 가능합니다.

---

## DELETE /api/transactions/:id

거래내역을 소프트 삭제합니다. 실제 데이터는 유지되며 복구할 수 있습니다.

---

## PATCH /api/transactions/:id/restore

소프트 삭제된 거래내역을 복구합니다.

---

## 🔬 테스트 하네스

테스트 파일: [`server/src/__tests__/transactions.test.ts`](../../server/src/__tests__/transactions.test.ts)

```bash
# 거래내역 API 전체 테스트
cd server && npx vitest run src/__tests__/transactions.test.ts

# 생성만
cd server && npx vitest run src/__tests__/transactions.test.ts -t "POST /api/transactions"
```

### 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 유효한 데이터로 수입 거래 생성 | `201` + transaction (type: income) |
| 2 | 유효한 데이터로 지출 거래 생성 | `201` + sub_category, memo 포함 |
| 3 | 수입 타입에 지출 카테고리 사용 | `400` "수입 카테고리만 선택할 수 있습니다" |
| 4 | amount = 0 | `400` |
| 5 | amount = 100,000,000 (초과) | `400` |
| 6 | 월 필터로 목록 조회 | `200` + transactions + pagination |
| 7 | 특정 날짜로 조회 | `200` + 해당 날짜 거래만 |
| 8 | 카테고리 + 금액 + 정렬 필터 | 내림차순 정렬 검증 |
| 9 | 페이지네이션 (limit=2) | `200` + totalPages=2, 2개 반환 |
| 10 | 본인 거래 수정 | `200` + 변경된 amount, memo |
| 11 | 타인 거래 수정 시도 | `404` "거래 내역을 찾을 수 없습니다" |
| 12 | 소프트 삭제 후 목록에서 제외 | `200` + 삭제 후 조회 시 0개 |
| 13 | 삭제된 거래 복구 | `200` + `deleted_at: null` |
| 14 | 키워드 검색 | `200` + 메모에 키워드 포함된 거래만 |

### curl 예시

```bash
BASE_URL="http://localhost:3000/api"
TOKEN="eyJhbGci..."

# 이번 달 거래내역 조회
curl -X GET "$BASE_URL/transactions?month=2026-04&sort=date&order=desc" \
  -H "Authorization: Bearer $TOKEN"

# 지출 거래 생성
curl -X POST "$BASE_URL/transactions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "expense",
    "amount": 15000,
    "category_id": 4,
    "payment_method_id": 1,
    "date": "2026-04-07",
    "sub_category": "점심",
    "memo": "김치찌개"
  }'

# 거래 수정
curl -X PUT "$BASE_URL/transactions/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 20000, "memo": "특별한 점심"}'

# 소프트 삭제
curl -X DELETE "$BASE_URL/transactions/1" \
  -H "Authorization: Bearer $TOKEN"

# 복구
curl -X PATCH "$BASE_URL/transactions/1/restore" \
  -H "Authorization: Bearer $TOKEN"
```
