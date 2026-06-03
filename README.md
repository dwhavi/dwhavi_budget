# 💰 Budget App

개인 가계부 웹 애플리케이션. 수입과 지출을 기록하고, 카테고리별·결제수단별 통계를 확인하며, 월별 예산을 관리할 수 있습니다.

Google Drive AppData에 데이터를 저장하므로 별도 서버 없이 Vercel에 정적 배포 가능합니다.

---

## 주요 기능

- **지출 대시보드** — 카테고리별 도넛 차트, 일일 지출 추이, 캘린더, 예산 진행률
- **전체 현황** — 수입/지출/잔액, 저축률, 월별 추이
- **거래내역 관리** — 수입/지출 등록, 수정, 삭제
- **카테고리 관리** — 수입/지출 카테고리 커스텀
- **결제수단 관리** — 신용카드, 체크카드, 현금 등
- **고정 지출 관리** — 매월 반복 지출 수동 추적
- **예산 설정** — 카테고리별 월 예산 설정 및 달성률
- **PWA** — 모바일 홈화면 설치 가능, 오프라인 조회
- **Google 로그인** — Google OAuth 기반 간편 인증

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | React 19, Vite 8, TypeScript, Tailwind CSS 4, Recharts |
| 데이터 저장 | Google Drive AppData (JSON) |
| 인증 | Google OAuth (Implicit Flow) |
| 배포 | Vercel (SPA) |
| 테스트 | Vitest, React Testing Library, Playwright |
