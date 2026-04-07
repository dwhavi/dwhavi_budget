# 결제수단 API (Payment Methods)

> **⚠️ AI Agent 제약사항 (Constraints)**
> 이 API와 관련된 작업을 수행할 때 전체 프로젝트를 탐색하지 마십시오. 요구사항이 명확하다면 [`docs/knowledge-base.md`](../knowledge-base.md)에 명시된 **4. Payment Methods** 관련 파일만 제한적으로 분석하고 수정하세요.

기본 경로: `/api/payment-methods` (모든 엔드포인트 인증 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/` | 결제수단 목록 조회 |
| `POST` | `/` | 결제수단 생성 |
| `PUT` | `/:id` | 결제수단 수정 |
| `DELETE` | `/:id` | 결제수단 소프트 삭제 |

> **참고:** 회원가입 시 기본 결제수단 **"현금"** (type: `cash`, `is_default: true`)이 자동 생성됩니다. 이 결제수단은 삭제할 수 없습니다.

---

## 결제수단 타입

| 타입 | 설명 |
|------|------|
| `cash` | 현금 |
| `credit` | 신용카드 |
| `debit` | 체크카드 |
| `transfer` | 계좌이체 |

---

## GET /api/payment-methods

본인의 결제수단 목록을 반환합니다.

**응답 (200):**

```json
{
  "success": true,
  "data": {
    "paymentMethods": [
      { "id": 1, "name": "현금", "type": "cash", "is_default": true, "user_id": 1 },
      { "id": 2, "name": "신한카드", "type": "credit", "issuer": "신한은행", "color": "#FF5733" }
    ]
  }
}
```

---

## POST /api/payment-methods

결제수단을 생성합니다.

**요청 본문:**

```json
{
  "name": "신한카드",
  "type": "credit",
  "issuer": "신한은행",
  "color": "#FF5733",
  "memo": "주 카드"
}
```

| 필드 | 필수 | 설명 |
|------|------|------|
| `name` | ✅ | 결제수단 이름 |
| `type` | ✅ | `cash` / `credit` / `debit` / `transfer` |
| `issuer` | ❌ | 발급사 |
| `color` | ❌ | 표시 색상 (HEX) |
| `memo` | ❌ | 메모 |

---

## PUT /api/payment-methods/:id

결제수단 수정. **본인 결제수단만 수정 가능, 타인 소유 시 403.**

---

## DELETE /api/payment-methods/:id

결제수단 소프트 삭제. **"현금" 결제수단은 삭제 불가 (400).**

---

## 🔬 테스트 하네스

테스트 파일: [`server/src/__tests__/payment-methods.test.ts`](../../server/src/__tests__/payment-methods.test.ts)

```bash
# 결제수단 API 전체 테스트
cd server && npx vitest run src/__tests__/payment-methods.test.ts
```

### 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 목록 조회 (기본 "현금" 포함) | `200` + 1개, name: "현금", is_default: true |
| 2 | 신용카드 생성 | `201` + name, issuer, type, color, user_id |
| 3 | 계좌이체 생성 | `201` + type: "transfer" |
| 4 | 본인 결제수단 수정 | `200` + 변경된 name, color |
| 5 | 비현금 결제수단 소프트 삭제 | `200` + DB에 deleted_at 존재 |
| 6 | "현금" 삭제 시도 | `400` "현금은 삭제할 수 없습니다" |
| 7 | 타인 결제수단 수정 시도 | `403` "권한이 없습니다" |
| 8 | 유효하지 않은 type | `400` |

### curl 예시

```bash
BASE_URL="http://localhost:3000/api"
TOKEN="eyJhbGci..."

# 목록 조회
curl -X GET "$BASE_URL/payment-methods" \
  -H "Authorization: Bearer $TOKEN"

# 신용카드 생성
curl -X POST "$BASE_URL/payment-methods" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "신한카드",
    "type": "credit",
    "issuer": "신한은행",
    "color": "#0066CC",
    "memo": "주 사용 카드"
  }'

# 수정
curl -X PUT "$BASE_URL/payment-methods/2" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "신한카드 프리미엄", "color": "#003399"}'

# 소프트 삭제
curl -X DELETE "$BASE_URL/payment-methods/2" \
  -H "Authorization: Bearer $TOKEN"
```
