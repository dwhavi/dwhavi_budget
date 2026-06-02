# Decisions - Budget App

## Architecture Decisions
- 구버전 Express+SQLite → Supabase 전환 완료 (server/ 디렉토리 삭제됨, DB 마이그레이션은 보존)
- Supabase Auth + Google OAuth 로그인 전용 (1인용 가계부)
- React Query 클라이언트사이드 캐시싱 (서버 캐시 없음)
- PWA 빌드 (vite-plugin-pwa, generateSW, Workbox)
- 배포: Vercel (GitHub 연동 미설정, `vercel --prod` 수동 배포)
- features/ 디렉토리가 활성 코드, pages/ 디렉토리는 미사용 구버전

## Time Handling
- **모든 시간 KST(UTC+9) 기준** — DB에 UTC(TIMESTAMPTZ)로 저장되더라도 표시/입력/변환 모두 KST
- created_at 수정 시: `new Date()` 로컬 변환 → `setHours()` 수정 → `toISOString()` UTC 재변환

## PWA Caching
- Supabase API: `NetworkFirst` (온라인 시 최신 데이터 우선, 오프라인 시 캐시 폴백)
- staleTime: 5분 (React Query), networkTimeoutSeconds: 5초 (Workbox)

## Vercel 배포
- GitHub 자동 배포 미설정 → `vercel --prod` 수동 실행 필요
- 배포 URL: https://budget-app-dwhavis-projects.vercel.app (별칭: budget-app-iota-bice.vercel.app)
