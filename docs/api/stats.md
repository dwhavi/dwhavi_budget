# 통계 API (Stats)

> **⚠️ AI Agent 제약사항 (Constraints)**
> 이 API와 관련된 작업을 수행할 때 전체 프로젝트를 탐색하지 마십시오. 요구사항이 명확하다면 [`docs/knowledge-base.md`](../knowledge-base.md)에 명시된 **8. Stats** 관련 파일만 제한적으로 분석하고 수정하세요.

기본 경로: `/api/stats` (모든 엔드포인트 인증 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/dashboard` | 대시보드 요약 |
| `GET` | `/monthly-trend` | 월별 추이 |
| `GET` | `/category` | 카테고리별 통계 |
| `GET` | `/payment-methods` | 결제수단별 통계 |

---

## GET /api/stats/dashboard

대시보드용 요약 데이터를 반환합니다.

**쿼리 파라미터:**

| 파라미터 | 설명 |
|----------|------|
| `month` | 조회할 월 (예: `2026-04`) |

**응답 (200):**

```json
{
  "success": true,
  "data": {
    "totalIncome": 3000000,
    "totalExpense": 800000,
    "balance": 2200000,
    "dailyAllowance": 51612,
    "categoryRanking": [
      { "category_id": 4, "category_name": "식비", "total": 800000, "color": "#ef4444" }
    ],
    "recentTransactions": [
      { "date": "2026-04-10", ... },
      { "date": "2026-04-05", ... }
    ]
  }
}
```

| 필드 | 설명 |
|------|------|
| `totalIncome` | 해당 월 총 수입 |
| `totalExpense` | 해당 월 총 지출 |
| `balance` | `totalIncome - totalExpense` |
| `dailyAllowance` | 잔여 일수 기준 하루 사용 가능 금액 |
| `categoryRanking` | 지출 카테고리 순위 (내림차순) |
| `recentTransactions` | 최근 거래내역 (날짜 역순) |

---

## GET /api/stats/monthly-trend

월별 수입/지출 추이를 반환합니다. 기본 6개월.

**쿼리 파라미터:**

| 파라미터 | 설명 |
|----------|------|
| `months` | 조회할 개월 수 (기본: 6) |

**응답 (200):**

```json
{
  "success": true,
  "data": [
    { "month": "2026-04", "income": 3000000, "expense": 500000 },
    { "month": "2026-03", "income": 2800000, "expense": 450000 },
    ...
  ]
}
```

거래가 없는 월도 `income: 0, expense: 0`으로 포함됩니다.

---

## GET /api/stats/category

카테고리별 지출/수입 통계를 반환합니다.

**쿼리 파라미터:**

| 파라미터 | 설명 |
|----------|------|
| `month` | 조회할 월 (`YYYY-MM`) |
| `type` | `"income"` 또는 `"expense"` |
| `start_date` | 시작일 (`YYYY-MM-DD`) |
| `end_date` | 종료일 (`YYYY-MM-DD`) |

**응답 (200):**

```json
{
  "success": true,
  "data": [
    {
      "category_id": 4,
      "category_name": "식비",
      "total": 800000,
      "percentage": 80.0,
      "color": "#ef4444"
    },
    {
      "category_id": 5,
      "category_name": "교통",
      "total": 200000,
      "percentage": 20.0,
      "color": "#f97316"
    }
  ]
}
```

> `percentage` 합계는 항상 100입니다 (소수점 오차 0.01 이내).

---

## GET /api/stats/payment-methods

결제수단별 통계를 반환합니다.

**쿼리 파라미터:**

| 파라미터 | 설명 |
|----------|------|
| `month` | 조회할 월 (`YYYY-MM`) |
| `start_date` | 시작일 (`YYYY-MM-DD`) |
| `end_date` | 종료일 (`YYYY-MM-DD`) |

**응답 (200):**

```json
{
  "success": true,
  "data": [
    { "payment_method_id": 1, "payment_method_name": "현금", "total": 800000, "percentage": 80.0 },
    { "payment_method_id": 2, "payment_method_name": "신용카드", "total": 200000, "percentage": 20.0 }
  ]
}
```

---

## 🔬 테스트 하네스

테스트 파일: [`server/src/__tests__/stats.test.ts`](../../server/src/__tests__/stats.test.ts)

```bash
cd server && npx vitest run src/__tests__/stats.test.ts
```

### 테스트 시나리오

**대시보드 (`/dashboard`)**

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 수입 3건 + 지출 1건 데이터로 조회 | totalIncome=3,000,000 / totalExpense=800,000 / balance=2,200,000 |
| 2 | 데이터 없는 빈 월 | 모든 필드 0, 배열 빈 값 |
| 3 | 인증 없음 | `401` |
| 4 | 유저 격리: 타인 거래 미포함 | 각 유저의 totalIncome이 독립적 |

**월별 추이 (`/monthly-trend`)**

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 5 | 2개월에 거래 있을 때 | data 배열 + month/income/expense 필드 |
| 6 | 거래 없음 | 6개 항목, 모두 income/expense=0 |
| 7 | 인증 없음 | `401` |

**카테고리별 (`/category`)**

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 8 | 2개 카테고리로 지출 분산 | 2개 항목, percentage 합계 ≈ 100 |

**결제수단별 (`/payment-methods`)**

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 9 | 2개 결제수단으로 지출 분산 | 2개 항목, percentage 합계 ≈ 100 |
| 10 | 거래 없는 월 | `200` + `[]` |
| 11 | 인증 없음 | `401` |

### curl 예시

```bash
BASE_URL="http://localhost:3000/api"
TOKEN="eyJhbGci..."

# 대시보드 요약
curl -X GET "$BASE_URL/stats/dashboard?month=2026-04" \
  -H "Authorization: Bearer $TOKEN"

# 월별 추이 (최근 12개월)
curl -X GET "$BASE_URL/stats/monthly-trend?months=12" \
  -H "Authorization: Bearer $TOKEN"

# 카테고리별 지출 (이번 달)
curl -X GET "$BASE_URL/stats/category?month=2026-04&type=expense" \
  -H "Authorization: Bearer $TOKEN"

# 결제수단별 (기간 지정)
curl -X GET "$BASE_URL/stats/payment-methods?start_date=2026-01-01&end_date=2026-04-30" \
  -H "Authorization: Bearer $TOKEN"
```
