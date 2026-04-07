# 카테고리 API (Categories)

> **⚠️ AI Agent 제약사항 (Constraints)**
> 이 API와 관련된 작업을 수행할 때 전체 프로젝트를 탐색하지 마십시오. 요구사항이 명확하다면 [`docs/knowledge-base.md`](../knowledge-base.md)에 명시된 **3. Categories** 관련 파일만 제한적으로 분석하고 수정하세요.

기본 경로: `/api/categories` (모든 엔드포인트 인증 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/` | 카테고리 목록 조회 |
| `POST` | `/` | 개인 카테고리 생성 |
| `PUT` | `/:id` | 카테고리 수정 |
| `DELETE` | `/:id` | 카테고리 소프트 삭제 |

---

## 카테고리 구분

| 구분 | `user_id` | 수정 가능 | 삭제 가능 |
|------|-----------|-----------|-----------|
| **전역 카테고리** | `null` | ❌ (403) | ❌ (403) |
| **개인 카테고리** | 사용자 ID | ✅ | ✅ |

### 전역 카테고리 (기본 제공)

```
💰 급여 (income)   💼 부수입 (income)   🎁 용돈 (income)
🍽️ 식비 (expense)  🚌 교통 (expense)    🏠 주거 (expense)
📱 통신 (expense)   🎮 유흥 (expense)   🛍️ 쇼핑 (expense)
🏥 의료 (expense)  📚 교육 (expense)    📌 기타 (expense)
```

---

## GET /api/categories

전역 카테고리 + 본인 개인 카테고리를 모두 반환합니다.

**쿼리 파라미터:**

| 파라미터 | 설명 |
|----------|------|
| `type` | `"income"` 또는 `"expense"` 로 필터 |

**응답 (200):**

```json
{
  "success": true,
  "data": {
    "categories": [
      { "id": 1, "name": "급여", "type": "income", "icon": "💰", "color": "#22c55e", "user_id": null },
      { "id": 13, "name": "커피", "type": "expense", "icon": "📌", "color": "#64748b", "user_id": 1 }
    ]
  }
}
```

---

## POST /api/categories

개인 카테고리를 생성합니다. `icon`과 `color`를 생략하면 기본값(`📌`, `#64748b`)이 적용됩니다.

**요청 본문:**

```json
{
  "name": "카페",
  "type": "expense",
  "icon": "☕",
  "color": "#a0522d"
}
```

---

## PUT /api/categories/:id

개인 카테고리 수정. **전역 카테고리는 수정 불가 (403).**

---

## DELETE /api/categories/:id

개인 카테고리 소프트 삭제. **전역 카테고리는 삭제 불가 (403).**  
소프트 삭제된 카테고리는 일반 목록 조회에서 자동으로 제외됩니다.

---

## 🔬 테스트 하네스

테스트 파일: [`server/src/__tests__/categories.test.ts`](../../server/src/__tests__/categories.test.ts)

```bash
# 카테고리 API 전체 테스트
cd server && npx vitest run src/__tests__/categories.test.ts
```

### 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | 전역 시드 12개 + 개인 0개 조회 | `200` + 12개 |
| 2 | 개인 카테고리 생성 | `201` + name, type, 기본 icon/color |
| 3 | 생성 후 목록 조회 | `200` + 13개 (12 + 1) |
| 4 | 전역 카테고리 수정 시도 | `403` "전역 카테고리는 수정할 수 없습니다" |
| 5 | 개인 카테고리 수정 | `200` + 변경된 name |
| 6 | 개인 카테고리 소프트 삭제 | `200` "카테고리가 삭제되었습니다" |
| 7 | 소프트 삭제 후 목록에서 제외 | `200` + 다시 12개 |

### curl 예시

```bash
BASE_URL="http://localhost:3000/api"
TOKEN="eyJhbGci..."

# 지출 카테고리만 조회
curl -X GET "$BASE_URL/categories?type=expense" \
  -H "Authorization: Bearer $TOKEN"

# 개인 카테고리 생성
curl -X POST "$BASE_URL/categories" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "카페", "type": "expense", "icon": "☕", "color": "#a0522d"}'

# 수정
curl -X PUT "$BASE_URL/categories/13" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "커피전문점"}'

# 소프트 삭제
curl -X DELETE "$BASE_URL/categories/13" \
  -H "Authorization: Bearer $TOKEN"
```
