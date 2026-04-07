# 서브카테고리 API (SubCategories)

> **⚠️ AI Agent 제약사항 (Constraints)**
> 이 API와 관련된 작업을 수행할 때 전체 프로젝트를 탐색하지 마십시오. 요구사항이 명확하다면 [`docs/knowledge-base.md`](../knowledge-base.md)에 명시된 **5. Subcategories** 관련 파일만 제한적으로 분석하고 수정하세요.

기본 경로: `/api/subcategories` (인증 필요)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/` | 서브카테고리 자동완성 |

---

## GET /api/subcategories

거래 입력 시 서브카테고리(`sub_category`)를 자동완성합니다.  
사용자가 해당 카테고리에서 과거에 사용했던 `sub_category` 값을 빈도순(많이 쓴 순)으로 반환합니다. 최대 **10개** 반환.

**쿼리 파라미터:**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `category_id` | number | ✅ | 카테고리 ID |
| `q` | string | ❌ | 검색어 (prefix 매칭) |

**응답 (200):**

```json
{
  "success": true,
  "data": ["점심", "저녁", "간식"]
}
```

**에러:**

| 상황 | 상태 코드 | 메시지 |
|------|-----------|--------|
| `category_id` 누락 | `400` | "category_id가 필요합니다" |
| 존재하지 않는 카테고리 | `404` | "카테고리를 찾을 수 없습니다" |
| 인증 없음 | `401` | "인증이 필요합니다" |

---

## 동작 규칙

- `null` 또는 빈 문자열(`""`) `sub_category`는 제외
- 소프트 삭제된 거래의 `sub_category`는 제외
- 빈도 높은 순서로 정렬
- `q` 파라미터가 있으면 prefix 필터 적용

---

## 🔬 테스트 하네스

테스트 파일: [`server/src/__tests__/subcategories.test.ts`](../../server/src/__tests__/subcategories.test.ts)

```bash
cd server && npx vitest run src/__tests__/subcategories.test.ts
```

### 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|----------|-----------|
| 1 | sub_category 없는 상태에서 조회 | `200` + `[]` |
| 2 | sub_category="점심" 거래 생성 후 조회 | `200` + `["점심"]` |
| 3 | `q="점"` 필터 | `200` + `["점심"]` (저녁, 간식 제외) |
| 4 | 12가지 sub_category, 빈도 다양하게 생성 | `200` + 상위 10개 빈도순 |
| 5 | `category_id` 누락 | `400` |
| 6 | 존재하지 않는 `category_id` | `404` |
| 7 | null/빈 sub_category 제외 | `200` + null 포함 거래는 결과에서 제외 |
| 8 | 소프트 삭제된 거래의 sub_category 제외 | `200` + 삭제된 거래 서브카테고리 미포함 |
| 9 | 인증 없음 | `401` |

### curl 예시

```bash
BASE_URL="http://localhost:3000/api"
TOKEN="eyJhbGci..."

# 식비 카테고리(id=4)의 sub_category 자동완성
curl -X GET "$BASE_URL/subcategories?category_id=4" \
  -H "Authorization: Bearer $TOKEN"

# 검색어 필터 적용
curl -X GET "$BASE_URL/subcategories?category_id=4&q=점" \
  -H "Authorization: Bearer $TOKEN"
```
